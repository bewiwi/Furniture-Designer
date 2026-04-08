# Multi-Panel Kind Optimization — Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Add a multi-panel-kind UI to the Panel Plan page so users can define several panel sizes with prices and pick between two packing algorithms (cheapest-per-type or smart mix) to minimize material cost.

**Architecture:** `panelConfig` on the furniture object is extended to hold a `panelKinds` array and an `algorithm` selector. `packer.js` gains a new `packPlanksSmartMix()` export. `cutplan-view.js` is rewritten to render the panel-kinds form and display per-algorithm results. `i18n.js` gets new keys and `storage.js` handles migration from the old single-panel format.

**Tech Stack:** Vanilla JS, Vite dev server, existing guillotine packer in `src/packer.js`, `vitest` tests in `*.test.js` files.

---

### Task 1: Migrate `panelConfig` — data model & storage

**Files:**
- Modify: `src/storage.js`
- Modify: `src/ui/cutplan-view.js` (ensure config init also migrates)

**Context:**  
Current config shape: `{ width: 2440, height: 1220, kerf: 3 }`.  
New shape:
```js
{
  kerf: 3,
  algorithm: 'smart-mix',
  panelKinds: [
    { id: 'abc123', name: 'Standard', width: 2440, height: 1220, pricePerPanel: 0 }
  ]
}
```

**Step 1: Write the migration helper in `src/storage.js`**

Add this function near the bottom of `src/storage.js` (before the exports):

```js
/**
 * Migrates old single-panel panelConfig to multi-kind format.
 * Safe to call on already-migrated configs.
 */
export function migratePanelConfig(furniture) {
  if (!furniture) return;
  if (!furniture.panelConfig) {
    furniture.panelConfig = {
      kerf: 3,
      algorithm: 'smart-mix',
      panelKinds: [{ id: 'default', name: 'Standard', width: 2440, height: 1220, pricePerPanel: 0 }],
    };
    return;
  }
  const cfg = furniture.panelConfig;
  // Already migrated?
  if (Array.isArray(cfg.panelKinds)) return;

  // Promote old flat format
  const kind = {
    id: 'migrated',
    name: 'Standard',
    width: cfg.width ?? 2440,
    height: cfg.height ?? 1220,
    pricePerPanel: 0,
  };
  furniture.panelConfig = {
    kerf: cfg.kerf ?? 3,
    algorithm: 'smart-mix',
    panelKinds: [kind],
  };
}
```

**Step 2: Call migration in `loadFromLocalStorage`**

In `src/storage.js`, after the parsed furniture is returned from `loadFromLocalStorage`, call `migratePanelConfig(furniture)` before the `return`. Import it in the same file (it's a local function, so just call it directly).

**Step 3: Call migration in `importJSON`**

Same pattern — call `migratePanelConfig(furniture)` right after parsing in the `importJSON` function.

**Step 4: Call migration in `cutplan-view.js` init guard**

Replace the existing config init block in `renderCutPlan`:
```js
// OLD:
if (!furniture.panelConfig) {
  furniture.panelConfig = { width: 2440, height: 1220, kerf: 3 };
}
```
```js
// NEW: (import migratePanelConfig from storage.js)
migratePanelConfig(furniture);
```

**Step 5: Commit**
```bash
git add src/storage.js src/ui/cutplan-view.js
git commit -m "feat: migrate panelConfig to multi-kind format"
```

---

### Task 2: Add `packPlanksSmartMix` to `packer.js`

**Files:**
- Modify: `src/packer.js`
- Modify: `src/packer.test.js`

**Context:**  
The existing `packPlanks(planks, panelWidth, panelHeight, kerf)` remains unchanged.  
We add a new export that accepts an array of panel kinds.

**Step 1: Write the failing test in `src/packer.test.js`**

```js
import { packPlanksSmartMix } from './packer.js';

describe('packPlanksSmartMix', () => {
  const kinds = [
    { id: 'small', name: 'Small', width: 500, height: 500, pricePerPanel: 10 },
    { id: 'large', name: 'Large', width: 1000, height: 1000, pricePerPanel: 30 },
  ];

  it('places a piece that only fits in the large kind on the large kind', () => {
    const planks = [
      { id: 'p1', name: 'A', pw: 600, ph: 400, label: 'A' },
    ];
    const { panels, unplaced } = packPlanksSmartMix(planks, kinds, 3);
    expect(unplaced).toHaveLength(0);
    expect(panels).toHaveLength(1);
    expect(panels[0].kind.id).toBe('large');
  });

  it('prefers open cheaper panel over opening a new expensive one', () => {
    const planks = [
      { id: 'p1', name: 'A', pw: 300, ph: 300, label: 'A' },
      { id: 'p2', name: 'B', pw: 100, ph: 100, label: 'B' },
    ];
    const { panels } = packPlanksSmartMix(planks, kinds, 0);
    // Both should fit on 1 small panel
    expect(panels).toHaveLength(1);
    expect(panels[0].kind.id).toBe('small');
  });
});
```

**Step 2: Run to confirm it fails**
```bash
cd /Users/bewiwi/project/meuble && npx vitest run src/packer.test.js
```
Expected: FAIL — `packPlanksSmartMix is not a function`

**Step 3: Implement `packPlanksSmartMix` in `src/packer.js`**

Add after the existing `packPlanks` function:

```js
/**
 * Smart-mix packer: places each piece on the cheapest already-open panel
 * that fits, or opens a new panel of the cheapest fitting kind.
 *
 * @param {Object[]} planks - Planks with pw/ph already computed (2 largest dims)
 * @param {Object[]} panelKinds - Array of { id, name, width, height, pricePerPanel }
 * @param {number} kerf - Saw blade kerf in mm
 * @returns {{ panels: Object[], unplaced: Object[], totalCost: number, kindCosts: Object }}
 */
export function packPlanksSmartMix(planks, panelKinds, kerf) {
  // Normalize: ensure pw/ph exist (in case raw planks are passed)
  const items = planks.map(p => {
    if (p.pw !== undefined) return p;
    const dims = [p.w, p.h, p.d].sort((a, b) => b - a);
    return { ...p, pw: dims[0], ph: dims[1] };
  });

  // Sort by area descending
  items.sort((a, b) => (b.pw * b.ph) - (a.pw * a.ph));

  // Sort kinds by price ascending (cheapest first as default opening preference)
  const sortedKinds = [...panelKinds].sort((a, b) => a.pricePerPanel - b.pricePerPanel);

  const openPanels = []; // { kind, root, placements }
  const unplaced = [];

  function createNode(x, y, w, h) {
    return { x, y, w, h, used: false, right: null, down: null };
  }

  function findNode(root, w, h) {
    let best = null;
    let bestScore = Infinity;
    function search(node) {
      if (!node) return;
      if (node.used) {
        search(node.right);
        search(node.down);
      } else {
        if (w <= node.w && h <= node.h) {
          const score = Math.min(node.w - w, node.h - h);
          if (score < bestScore) { best = { node, rotated: false }; bestScore = score; }
        }
        if (h <= node.w && w <= node.h) {
          const score = Math.min(node.w - h, node.h - w);
          if (score < bestScore) { best = { node, rotated: true }; bestScore = score; }
        }
      }
    }
    search(root);
    return best;
  }

  function splitNode(node, w, h) {
    node.used = true;
    const totalW = w + kerf;
    const totalH = h + kerf;
    const spaceRight = node.w - totalW;
    const spaceDown = node.h - totalH;
    if (spaceRight > spaceDown) {
      node.right = createNode(node.x + totalW, node.y, node.w - totalW, h);
      node.down  = createNode(node.x, node.y + totalH, node.w, node.h - totalH);
    } else {
      node.right = createNode(node.x + totalW, node.y, node.w - totalW, node.h);
      node.down  = createNode(node.x, node.y + totalH, w, node.h - totalH);
    }
    return node;
  }

  for (const item of items) {
    const w = item.pw;
    const h = item.ph;
    let placed = false;

    // 1. Try existing open panels (prefer cheapest kind first, then best fit)
    // Sort open panels by kind price then by remaining space score
    const sorted = [...openPanels].sort((a, b) => a.kind.pricePerPanel - b.kind.pricePerPanel);
    for (const panel of sorted) {
      const match = findNode(panel.root, w, h);
      if (match) {
        const rw = match.rotated ? h : w;
        const rh = match.rotated ? w : h;
        splitNode(match.node, rw, rh);
        panel.placements.push({ item, rect: { x: match.node.x, y: match.node.y, w: rw, h: rh } });
        placed = true;
        break;
      }
    }

    // 2. Open a new panel — cheapest kind where the piece fits
    if (!placed) {
      for (const kind of sortedKinds) {
        const newPanel = {
          kind,
          root: createNode(0, 0, kind.width, kind.height),
          placements: [],
        };
        const match = findNode(newPanel.root, w, h);
        if (match) {
          const rw = match.rotated ? h : w;
          const rh = match.rotated ? w : h;
          splitNode(match.node, rw, rh);
          newPanel.placements.push({ item, rect: { x: match.node.x, y: match.node.y, w: rw, h: rh } });
          openPanels.push(newPanel);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      unplaced.push(item);
    }
  }

  // Compute costs
  const kindCosts = {};
  for (const panel of openPanels) {
    const id = panel.kind.id;
    if (!kindCosts[id]) kindCosts[id] = { kind: panel.kind, count: 0, subtotal: 0 };
    kindCosts[id].count++;
    kindCosts[id].subtotal += panel.kind.pricePerPanel;
  }
  const totalCost = Object.values(kindCosts).reduce((s, k) => s + k.subtotal, 0);

  return { panels: openPanels, unplaced, totalCost, kindCosts };
}
```

**Step 4: Run tests to verify they pass**
```bash
cd /Users/bewiwi/project/meuble && npx vitest run src/packer.test.js
```
Expected: PASS (all existing + new tests)

**Step 5: Commit**
```bash
git add src/packer.js src/packer.test.js
git commit -m "feat: add packPlanksSmartMix for multi-panel-kind optimization"
```

---

### Task 3: Add i18n keys (EN + FR)

**Files:**
- Modify: `src/i18n.js`

**Context:**  
The file has two locale objects — `en` and `fr`. Both need the same keys added.  
Find the `cutplan` block in each locale (around line 98 for EN, line 263 for FR) and append new keys.

**Step 1: Add EN keys** (after `'cutplan.panel_number'`):
```js
'cutplan.add_panel_kind': '+ Add Panel Kind',
'cutplan.panel_kind_name': 'Name',
'cutplan.panel_kind_price': 'Price/panel (€)',
'cutplan.algorithm': 'Algorithm',
'cutplan.algo.cheapest_all': 'Cheapest for all (per type)',
'cutplan.algo.smart_mix': 'Smart Mix (optimal)',
'cutplan.cost_total': 'Total cost: {cost}€',
'cutplan.cost_breakdown': '{count}× {name} = {subtotal}€',
'cutplan.ranking_title': 'Panel type comparison',
'cutplan.panel_kind_label': 'Type: {name}',
'cutplan.winner': '★ Best price',
'cutplan.panels_used': '{count} panel(s) needed',
'cutplan.no_price': 'No prices defined — showing panel count only',
```

**Step 2: Add FR keys** (after `'cutplan.panel_number'` in the FR locale):
```js
'cutplan.add_panel_kind': '+ Ajouter un type de panneau',
'cutplan.panel_kind_name': 'Nom',
'cutplan.panel_kind_price': 'Prix/panneau (€)',
'cutplan.algorithm': 'Algorithme',
'cutplan.algo.cheapest_all': 'Moins cher par type',
'cutplan.algo.smart_mix': 'Mix optimal',
'cutplan.cost_total': 'Coût total : {cost}€',
'cutplan.cost_breakdown': '{count}× {name} = {subtotal}€',
'cutplan.ranking_title': 'Comparaison des types de panneaux',
'cutplan.panel_kind_label': 'Type : {name}',
'cutplan.winner': '★ Meilleur prix',
'cutplan.panels_used': '{count} panneau(x) nécessaire(s)',
'cutplan.no_price': 'Aucun prix défini — affichage du nombre de panneaux uniquement',
```

**Step 3: Commit**
```bash
git add src/i18n.js
git commit -m "feat: add i18n keys for multi-panel optimization UI"
```

---

### Task 4: Rewrite `cutplan-view.js`

**Files:**
- Modify: `src/ui/cutplan-view.js`

**Context:**  
Current file is ~82 lines. Replace the entire `renderCutPlan` function with the new implementation below. The function signature stays the same.

**Step 1: Replace the full file content with:**

```js
import { packPlanks, packPlanksSmartMix } from '../packer.js';
import { groupPlanks } from '../planks.js';
import { t } from '../i18n.js';
import { migratePanelConfig } from '../storage.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Renders SVG layouts for a list of panels.
 * Each panel can have an optional .kind property for labeling.
 */
function renderPanelSVGs(panels, config, showKindLabel = false) {
  if (!panels || panels.length === 0) return '<p style="padding:20px;color:var(--text-secondary);">No panels to display.</p>';

  return panels.map((panel, idx) => {
    const kind = panel.kind;
    const panelW = kind ? kind.width : config.panelKinds[0].width;
    const panelH = kind ? kind.height : config.panelKinds[0].height;
    const kindLabel = showKindLabel && kind ? ` — ${t('cutplan.panel_kind_label', { name: kind.name })}` : '';

    return `
      <div class="panel-board">
        <h3 style="margin:0 0 15px 0;">${t('cutplan.panel_number', { num: idx + 1 })}${kindLabel}</h3>
        <svg viewBox="0 0 ${panelW} ${panelH}" style="width:100%;max-width:1200px;border:2px solid #555;background:repeating-linear-gradient(45deg,#333,#333 10px,#222 10px,#222 20px);">
          ${panel.placements.map(plc => `
            <g class="panel-piece">
              <title>${plc.item.name} (${plc.rect.w} x ${plc.rect.h})</title>
              <rect x="${plc.rect.x}" y="${plc.rect.y}" width="${plc.rect.w}" height="${plc.rect.h}" fill="var(--accent-primary)" stroke="#000" stroke-width="2"/>
              <text x="${plc.rect.x + plc.rect.w/2}" y="${plc.rect.y + plc.rect.h/2}" fill="#fff" font-size="${Math.min(Math.min(plc.rect.w, plc.rect.h)/3, 120)}" dominant-baseline="middle" text-anchor="middle" pointer-events="none">
                <tspan x="${plc.rect.x + plc.rect.w/2}" dy="-0.2em" font-weight="bold">${plc.item.label}</tspan>
                <tspan x="${plc.rect.x + plc.rect.w/2}" dy="1.2em" font-size="0.4em" fill="rgba(255,255,255,0.8)">${plc.rect.w} × ${plc.rect.h}</tspan>
              </text>
            </g>
          `).join('')}
        </svg>
      </div>
    `;
  }).join('');
}

/**
 * Algorithm A: run packing independently per panel kind, return ranked results.
 */
function runCheapestForAll(labeledPlanks, config) {
  const results = config.panelKinds.map(kind => {
    const { panels, unplaced } = packPlanks(labeledPlanks, kind.width, kind.height, config.kerf);
    const totalCost = panels.length * kind.pricePerPanel;
    return { kind, panels, unplaced, totalCost, panelCount: panels.length };
  });
  results.sort((a, b) => {
    if (a.unplaced.length !== b.unplaced.length) return a.unplaced.length - b.unplaced.length;
    // If prices are all 0, sort by panel count
    const allZero = config.panelKinds.every(k => k.pricePerPanel === 0);
    return allZero ? a.panelCount - b.panelCount : a.totalCost - b.totalCost;
  });
  return results;
}

/**
 * Renders the ranking table for Algorithm A.
 */
function renderRankingTable(results, allPricesZero) {
  const rows = results.map((r, i) => {
    const isWinner = i === 0;
    const costCell = allPricesZero
      ? `${r.panelCount} panel(s)`
      : `${r.totalCost}€ (${r.panelCount} × ${r.kind.pricePerPanel}€)`;
    const badge = isWinner ? `<span style="color:var(--accent-primary);font-weight:700;"> ${t('cutplan.winner')}</span>` : '';
    const unplacedWarning = r.unplaced.length > 0
      ? `<span style="color:var(--danger);"> ⚠️ ${r.unplaced.length} unplaced</span>`
      : '';
    return `
      <tr style="${isWinner ? 'background:rgba(var(--accent-rgb),0.08);' : ''}">
        <td style="padding:8px 12px;">${i + 1}</td>
        <td style="padding:8px 12px;font-weight:600;">${r.kind.name}${badge}</td>
        <td style="padding:8px 12px;">${r.kind.width} × ${r.kind.height}</td>
        <td style="padding:8px 12px;">${costCell}${unplacedWarning}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="margin:20px;overflow-x:auto;">
      <h3 style="margin:0 0 12px 0;">${t('cutplan.ranking_title')}</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid var(--border);">
        <thead>
          <tr style="background:var(--bg-secondary);">
            <th style="padding:8px 12px;text-align:left;">#</th>
            <th style="padding:8px 12px;text-align:left;">${t('cutplan.panel_kind_name')}</th>
            <th style="padding:8px 12px;text-align:left;">Size (mm)</th>
            <th style="padding:8px 12px;text-align:left;">${allPricesZero ? t('cutplan.panels_used', { count: '' }).trim() : 'Cost'}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderCutPlan(container, furniture, planks) {
  migratePanelConfig(furniture);
  const config = furniture.panelConfig;

  // Labeled planks
  const groups = groupPlanks(planks);
  const labeledPlanks = planks.map(p => {
    const group = groups.find(g => g.ids.includes(p.id));
    return { ...p, label: group ? group.label : '' };
  });

  // Flatten pw/ph on labeled planks for packPlanksSmartMix
  const preparedPlanks = labeledPlanks.map(p => {
    const dims = [p.w, p.h, p.d].sort((a, b) => b - a);
    return { ...p, pw: dims[0], ph: dims[1] };
  });

  const allPricesZero = config.panelKinds.every(k => k.pricePerPanel === 0);

  // ── Build panel kinds form rows ──────────────────────────────────────────
  const kindRows = config.panelKinds.map((kind, i) => `
    <div class="cp-kind-row" data-idx="${i}" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
      <input type="text"   class="cp-kind-name"  value="${kind.name}"          placeholder="${t('cutplan.panel_kind_name')}" style="width:100px;" />
      <label style="display:flex;align-items:center;gap:4px;white-space:nowrap;">W <input type="number" class="cp-kind-w" value="${kind.width}"  style="width:70px;"></label>
      <label style="display:flex;align-items:center;gap:4px;white-space:nowrap;">H <input type="number" class="cp-kind-h" value="${kind.height}" style="width:70px;"></label>
      <label style="display:flex;align-items:center;gap:4px;white-space:nowrap;">${t('cutplan.panel_kind_price')} <input type="number" class="cp-kind-price" value="${kind.pricePerPanel}" style="width:70px;" min="0" step="0.01"></label>
      <button class="btn cp-remove-kind" data-idx="${i}" style="padding:4px 10px;background:var(--danger);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;" ${config.panelKinds.length <= 1 ? 'disabled' : ''}>✕</button>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="cutplan-header" style="padding:20px;background:var(--bg-secondary);border-bottom:1px solid var(--border);">
      <h2 style="margin:0 0 14px 0;">${t('cutplan.title') || 'Panel Cut Plan'}</h2>

      <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;">
        <!-- Panel kinds -->
        <div>
          <div style="font-size:0.8em;color:var(--text-secondary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">Panel Kinds</div>
          <div id="cp-kinds-list">${kindRows}</div>
          <button id="cp-add-kind" class="btn" style="margin-top:6px;font-size:0.85em;">${t('cutplan.add_panel_kind')}</button>
        </div>

        <!-- Global settings -->
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="display:flex;align-items:center;gap:8px;">${t('cutplan.kerf')} <input type="number" id="cp-kerf" value="${config.kerf}" style="width:70px;"></label>
          <label style="display:flex;align-items:center;gap:8px;">${t('cutplan.algorithm')}
            <select id="cp-algorithm" style="padding:4px 8px;">
              <option value="cheapest-for-all" ${config.algorithm === 'cheapest-for-all' ? 'selected' : ''}>${t('cutplan.algo.cheapest_all')}</option>
              <option value="smart-mix"        ${config.algorithm === 'smart-mix'        ? 'selected' : ''}>${t('cutplan.algo.smart_mix')}</option>
            </select>
          </label>
          <button id="cp-apply" class="btn btn-primary">${t('cutplan.recalculate')}</button>
        </div>
      </div>
    </div>

    <div id="cp-results" class="cutplan-body" style="padding:20px;display:flex;flex-direction:column;gap:40px;overflow-y:auto;flex:1;"></div>
  `;

  // ── Render results ──────────────────────────────────────────────────────
  function renderResults() {
    const resultsEl = container.querySelector('#cp-results');
    let html = '';

    if (config.algorithm === 'cheapest-for-all') {
      const ranked = runCheapestForAll(preparedPlanks, config);
      html += renderRankingTable(ranked, allPricesZero);

      // Show layouts for winner (first in ranked)
      const winner = ranked[0];
      if (winner) {
        // Adapt panels to have kind property for renderPanelSVGs
        const winnnerPanels = winner.panels.map(p => ({ ...p, kind: winner.kind }));
        // Unplaced warning
        if (winner.unplaced.length > 0) {
          html += `
            <div style="background:rgba(231,76,60,0.1);border:1px solid var(--danger);border-radius:var(--radius-md);padding:15px;margin:0 20px;">
              <h3 style="color:var(--danger);margin:0 0 10px 0;">${t('cutplan.error.title')}</h3>
              <ul style="margin:6px 0 0 20px;color:var(--text-secondary);">
                ${winner.unplaced.map(p => `<li>${p.label}: ${p.name} (${p.pw} × ${p.ph})</li>`).join('')}
              </ul>
            </div>`;
        }
        html += `<div style="display:flex;flex-direction:column;gap:40px;">${renderPanelSVGs(winnnerPanels, config, false)}</div>`;
      }
    } else {
      // Smart Mix
      const { panels, unplaced, totalCost, kindCosts } = packPlanksSmartMix(preparedPlanks, config.panelKinds, config.kerf);

      // Cost summary
      const breakdown = Object.values(kindCosts)
        .map(k => t('cutplan.cost_breakdown', { count: k.count, name: k.kind.name, subtotal: k.subtotal }))
        .join(' + ');
      const summaryLine = allPricesZero
        ? `${t('cutplan.no_price')} — ${panels.length} panel(s) used`
        : `${breakdown} → ${t('cutplan.cost_total', { cost: totalCost })}`;

      html += `
        <div style="margin-bottom:10px;padding:14px 18px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);font-size:1em;">
          ${summaryLine}
        </div>`;

      if (unplaced.length > 0) {
        html += `
          <div style="background:rgba(231,76,60,0.1);border:1px solid var(--danger);border-radius:var(--radius-md);padding:15px;">
            <h3 style="color:var(--danger);margin:0 0 10px 0;">${t('cutplan.error.title')}</h3>
            <ul style="margin:6px 0 0 20px;color:var(--text-secondary);">
              ${unplaced.map(p => `<li>${p.label}: ${p.name} (${p.pw} × ${p.ph})</li>`).join('')}
            </ul>
          </div>`;
      }

      html += `<div style="display:flex;flex-direction:column;gap:40px;">${renderPanelSVGs(panels, config, true)}</div>`;
    }

    resultsEl.innerHTML = html;
  }

  renderResults();

  // ── Event: Add kind ─────────────────────────────────────────────────────
  container.querySelector('#cp-add-kind').addEventListener('click', () => {
    config.panelKinds.push({ id: generateId(), name: 'New', width: 2440, height: 1220, pricePerPanel: 0 });
    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });

  // ── Event: Remove kind ──────────────────────────────────────────────────
  container.querySelector('#cp-kinds-list').addEventListener('click', e => {
    const btn = e.target.closest('.cp-remove-kind');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (config.panelKinds.length <= 1) return;
    config.panelKinds.splice(idx, 1);
    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });

  // ── Event: Apply/Recalculate ────────────────────────────────────────────
  container.querySelector('#cp-apply').addEventListener('click', () => {
    // Read kerf + algorithm
    config.kerf = parseInt(container.querySelector('#cp-kerf').value, 10) || 3;
    config.algorithm = container.querySelector('#cp-algorithm').value;

    // Read all kind rows
    const rows = container.querySelectorAll('.cp-kind-row');
    rows.forEach((row, i) => {
      const kind = config.panelKinds[i];
      if (!kind) return;
      kind.name          = row.querySelector('.cp-kind-name').value || 'Panel';
      kind.width         = parseInt(row.querySelector('.cp-kind-w').value, 10) || 2440;
      kind.height        = parseInt(row.querySelector('.cp-kind-h').value, 10) || 1220;
      kind.pricePerPanel = parseFloat(row.querySelector('.cp-kind-price').value) || 0;
    });

    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });
}
```

**Step 2: Verify dev server has no console errors**

Open http://localhost:5173, switch to the Panel Plan view, confirm the form renders with at least one panel kind row, the algorithm dropdown is visible, and Recalculate works.

**Step 3: Commit**
```bash
git add src/ui/cutplan-view.js
git commit -m "feat: rewrite cutplan-view with multi-panel-kind UI and dual algorithm"
```

---

### Task 5: Browser verification

**Files:** None (read-only verification)

**Step 1: Open the Panel Plan view**

Navigate to http://localhost:5173 and switch to Panel Plan. Verify:
- Panel kind rows appear with Name/W/H/Price fields
- `+ Add Panel Kind` button adds a new row
- Remove (✕) button is disabled when only 1 kind remains
- Algorithm dropdown shows both options

**Step 2: Test Algorithm A (Cheapest for All)**

1. Keep algorithm on `Cheapest for all`
2. Add a second panel kind (e.g. Large 2500×2000, €65)
3. Click Recalculate
4. Confirm a ranking table appears with 2 rows
5. Winner row is highlighted
6. SVG layouts for winner are shown below

**Step 3: Test Algorithm C (Smart Mix)**

1. Switch to `Smart Mix`
2. Click Recalculate
3. Confirm cost summary line appears with breakdown
4. SVG panels are labeled with their kind

**Step 4: Test persistence**

1. Configure 2 panel kinds + prices + Smart Mix
2. Reload page
3. Confirm all settings are preserved

**Step 5: Test migration**

1. In browser DevTools console, manually set:
   ```js
   const d = JSON.parse(localStorage.getItem('furniture-designer-state'));
   d.panelConfig = { width: 2440, height: 1220, kerf: 3 };
   localStorage.setItem('furniture-designer-state', JSON.stringify(d));
   location.reload();
   ```
2. Navigate to Panel Plan — should show 1 panel kind row, no errors

**Step 6: Commit final**
```bash
git add -A
git commit -m "feat: multi-panel kind optimization complete — algorithms A and C"
```
