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
              <text x="${plc.rect.x + plc.rect.w / 2}" y="${plc.rect.y + plc.rect.h / 2}" fill="#fff" font-size="${Math.min(Math.min(plc.rect.w, plc.rect.h) / 3, 120)}" dominant-baseline="middle" text-anchor="middle" pointer-events="none">
                <tspan x="${plc.rect.x + plc.rect.w / 2}" dy="-0.2em" font-weight="bold">${plc.item.label}</tspan>
                <tspan x="${plc.rect.x + plc.rect.w / 2}" dy="1.2em" font-size="0.4em" fill="rgba(255,255,255,0.8)">${plc.rect.w} × ${plc.rect.h}</tspan>
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
function runCheapestForAll(preparedPlanks, config) {
  const results = config.panelKinds.map(kind => {
    const { panels, unplaced } = packPlanks(preparedPlanks, kind.width, kind.height, config.kerf);
    const totalCost = panels.length * kind.pricePerPanel;
    return { kind, panels, unplaced, totalCost, panelCount: panels.length };
  });
  results.sort((a, b) => {
    if (a.unplaced.length !== b.unplaced.length) return a.unplaced.length - b.unplaced.length;
    const allZero = config.panelKinds.every(k => k.pricePerPanel === 0);
    return allZero ? a.panelCount - b.panelCount : a.totalCost - b.totalCost;
  });
  return results;
}

/**
 * Renders the comparison ranking table for Algorithm A.
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

  const colHeader = allPricesZero ? t('cutplan.panels_used', { count: '' }).trim() : 'Cost';

  return `
    <div style="overflow-x:auto;">
      <h3 style="margin:0 0 12px 0;">${t('cutplan.ranking_title')}</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid var(--border);">
        <thead>
          <tr style="background:var(--bg-secondary);">
            <th style="padding:8px 12px;text-align:left;">#</th>
            <th style="padding:8px 12px;text-align:left;">${t('cutplan.panel_kind_name')}</th>
            <th style="padding:8px 12px;text-align:left;">Size (mm)</th>
            <th style="padding:8px 12px;text-align:left;">${colHeader}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderCutPlan(container, furniture, planks) {
  // Ensure config exists and is in the new multi-kind format
  migratePanelConfig(furniture);
  const config = furniture.panelConfig;

  // Build labeled + dimension-normalized planks (pw/ph = two largest dims)
  const groups = groupPlanks(planks);
  const preparedPlanks = planks.map(p => {
    const group = groups.find(g => g.ids.includes(p.id));
    const dims = [p.w, p.h, p.d].sort((a, b) => b - a);
    return { ...p, label: group ? group.label : '', pw: dims[0], ph: dims[1] };
  });

  const allPricesZero = config.panelKinds.every(k => k.pricePerPanel === 0);

  // ── Build panel kind rows ──────────────────────────────────────────────────
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
        <!-- Panel kinds manager -->
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

    <div id="cp-results" class="cutplan-body" style="padding:20px;display:flex;flex-direction:column;gap:30px;overflow-y:auto;flex:1;"></div>
  `;

  // ── Render results section ─────────────────────────────────────────────────
  function renderResults() {
    const resultsEl = container.querySelector('#cp-results');
    let html = '';

    if (config.algorithm === 'cheapest-for-all') {
      const ranked = runCheapestForAll(preparedPlanks, config);
      html += renderRankingTable(ranked, allPricesZero);

      // Show SVG layouts for the winning panel kind
      const winner = ranked[0];
      if (winner) {
        const winnerPanels = winner.panels.map(p => ({ ...p, kind: winner.kind }));

        if (winner.unplaced.length > 0) {
          html += `
            <div style="background:rgba(231,76,60,0.1);border:1px solid var(--danger);border-radius:var(--radius-md);padding:15px;">
              <h3 style="color:var(--danger);margin:0 0 10px 0;">${t('cutplan.error.title')}</h3>
              <ul style="margin:6px 0 0 20px;color:var(--text-secondary);">
                ${winner.unplaced.map(p => `<li>${p.label}: ${p.name} (${p.pw} × ${p.ph})</li>`).join('')}
              </ul>
            </div>`;
        }
        html += `<div style="display:flex;flex-direction:column;gap:40px;">${renderPanelSVGs(winnerPanels, config, false)}</div>`;
      }
    } else {
      // Smart Mix algorithm
      const { panels, unplaced, totalCost, kindCosts } = packPlanksSmartMix(preparedPlanks, config.panelKinds, config.kerf);

      // Cost summary line
      const breakdown = Object.values(kindCosts)
        .map(k => t('cutplan.cost_breakdown', { count: k.count, name: k.kind.name, subtotal: k.subtotal }))
        .join(' + ');
      const summaryLine = allPricesZero
        ? `${t('cutplan.no_price')} — ${panels.length} panel(s) used`
        : `${breakdown} → ${t('cutplan.cost_total', { cost: totalCost })}`;

      html += `
        <div style="padding:14px 18px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-md);font-size:1em;">
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

  // ── Event: Add panel kind ──────────────────────────────────────────────────
  container.querySelector('#cp-add-kind').addEventListener('click', () => {
    config.panelKinds.push({ id: generateId(), name: 'New', width: 2440, height: 1220, pricePerPanel: 0 });
    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });

  // ── Event: Remove panel kind ───────────────────────────────────────────────
  container.querySelector('#cp-kinds-list').addEventListener('click', e => {
    const btn = e.target.closest('.cp-remove-kind');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (config.panelKinds.length <= 1) return;
    config.panelKinds.splice(idx, 1);
    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });

  // ── Event: Apply / Recalculate ─────────────────────────────────────────────
  container.querySelector('#cp-apply').addEventListener('click', () => {
    config.kerf = parseInt(container.querySelector('#cp-kerf').value, 10) || 3;
    config.algorithm = container.querySelector('#cp-algorithm').value;

    container.querySelectorAll('.cp-kind-row').forEach((row, i) => {
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
