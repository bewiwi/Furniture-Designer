# Panel Cut Plan Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Implement a 2D guillotine packing algorithm and a UI view to generate cut lists with SVG visual plans.

**Architecture:** We will create a `Packer` module (`src/packer.js`) for the core math, integrate it into a new DOM view (`src/ui/cutplan-view.js`), establish routing and persistence in `src/main.js`, and finally apply styling in `src/style.css`.

**Tech Stack:** Vanilla JavaScript, SVG, HTML/CSS.

---

### Task 1: Create 2D Guillotine Packer Core

**Files:**
- Create: `src/packer.js`
- Create: `src/packer.test.js`

**Step 1: Write the failing test**

```javascript
// src/packer.test.js
import { describe, it, expect } from 'vitest';
import { packPlanks } from './packer.js';

describe('packPlanks', () => {
  it('should pack a single piece into one panel', () => {
    // Plank: 1000x500
    const planks = [{ id: 'p1', label: 'A', w: 1000, h: 500, d: 18, type: 'shelf' }];
    const panels = packPlanks(planks, 2440, 1220, 3);
    
    expect(panels.length).toBe(1);
    expect(panels[0].placements.length).toBe(1);
    expect(panels[0].placements[0].rect.w).toBe(1000);
    expect(panels[0].placements[0].rect.h).toBe(500);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/packer.test.js`
Expected: FAIL with "packPlanks is not defined" or similar export error.

**Step 3: Write minimal implementation**

```javascript
// src/packer.js
export function packPlanks(planks, panelWidth, panelHeight, kerf) {
  const panels = [];
  
  // Flatten planks (2 largest dimensions are used for 2D)
  const items = planks.map(p => {
    const dims = [p.w, p.h, p.d].sort((a,b) => b - a);
    return { ...p, pw: dims[0], ph: dims[1] };
  });

  // Sort by area (largest first)
  items.sort((a, b) => (b.pw * b.ph) - (a.pw * a.ph));

  function createNode(x, y, w, h) {
    return { x, y, w, h, used: false, right: null, down: null };
  }

  function findNode(root, w, h) {
    if (root.used) {
      const node = findNode(root.right, w, h);
      if (node) return node;
      return findNode(root.down, w, h);
    }
    else if ((w <= root.w && h <= root.h)) {
      return { node: root, rotated: false };
    }
    // Try rotated
    else if ((h <= root.w && w <= root.h)) {
      return { node: root, rotated: true };
    }
    return null;
  }

  function splitNode(node, w, h) {
    node.used = true;
    // Add kerf to piece dimensions for remaining space
    const totalW = w + kerf;
    const totalH = h + kerf;

    // Guillotine split - choose axis that leaves largest single area
    const spaceRight = node.w - totalW;
    const spaceDown = node.h - totalH;

    if (spaceRight > spaceDown) { // Split vertically
      node.right = createNode(node.x + totalW, node.y, node.w - totalW, h);
      node.down  = createNode(node.x, node.y + totalH, node.w, node.h - totalH);
    } else { // Split horizontally
      node.right = createNode(node.x + totalW, node.y, node.w - totalW, node.h);
      node.down  = createNode(node.x, node.y + totalH, w, node.h - totalH);
    }
    return node;
  }

  for (const item of items) {
    const w = item.pw;
    const h = item.ph;
    
    let placed = false;
    // Try existing panels
    for (const panel of panels) {
      const match = findNode(panel.root, w, h);
      if (match) {
        splitNode(match.node, match.rotated ? h : w, match.rotated ? w : h);
        panel.placements.push({
          item,
          rect: { x: match.node.x, y: match.node.y, w: match.rotated ? h : w, h: match.rotated ? w : h }
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Add new panel
      const newPanel = {
        root: createNode(0, 0, panelWidth, panelHeight),
        placements: []
      };
      const match = findNode(newPanel.root, w, h);
      if (match) {
        splitNode(match.node, match.rotated ? h : w, match.rotated ? w : h);
        newPanel.placements.push({
          item,
          rect: { x: match.node.x, y: match.node.y, w: match.rotated ? h : w, h: match.rotated ? w : h }
        });
        panels.push(newPanel);
      }
    }
  }

  return panels;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/packer.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/packer.test.js src/packer.js
git commit -m "feat: add 2D guillotine packing algorithm"
```

---

### Task 2: Create UI Component and SVG Renderer

**Files:**
- Create: `src/ui/cutplan-view.js`
- Modify: `index.html`

**Step 1: No direct JS unit test (DOM module)**

We will verify visually in Step 4.

**Step 2: Modify HTML layout**

Modify `index.html`:
```html
@@ -32,6 +32,7 @@
       <footer id="cutlist-panel"></footer>
     </main>
     <main id="view-cutlist" style="display: none;"></main>
+    <main id="view-cutplan" style="display: none;"></main>
     <main id="view-tools" style="display: none;"></main>
   </div>
```

**Step 3: Write cutplan view implementation**

```javascript
// src/ui/cutplan-view.js
import { packPlanks } from '../packer.js';
import { groupPlanks } from '../planks.js';
import { t } from '../i18n.js';

export function renderCutPlan(container, furniture, planks) {
  // Ensure config exists
  if (!furniture.panelConfig) {
    furniture.panelConfig = { width: 2440, height: 1220, kerf: 3 };
  }
  const config = furniture.panelConfig;

  // Group to get labels (A, B, C...)
  const groups = groupPlanks(planks);
  const labeledPlanks = planks.map(p => {
    const group = groups.find(g => g.ids.includes(p.id));
    return { ...p, label: group ? group.label : '' };
  });

  const panels = packPlanks(labeledPlanks, config.width, config.height, config.kerf);

  container.innerHTML = `
    <div class="cutplan-header" style="padding: 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border);">
      <h2 style="margin: 0 0 10px 0;">${t('cutplan.title') || 'Panel Cut Plan'}</h2>
      <div style="display: flex; gap: 15px;">
        <label>Panel Width: <input type="number" id="cp-width" value="${config.width}" style="width: 80px;"></label>
        <label>Panel Height: <input type="number" id="cp-height" value="${config.height}" style="width: 80px;"></label>
        <label>Kerf: <input type="number" id="cp-kerf" value="${config.kerf}" style="width: 80px;"></label>
        <button id="cp-apply" class="btn btn-primary">Apply</button>
      </div>
      <div style="margin-top: 10px; color: var(--text-secondary);">
        Total Boards Required: <strong>${panels.length}</strong>
      </div>
    </div>
    <div class="cutplan-body" style="padding: 20px; display: flex; flex-direction: column; gap: 30px; overflow-y: auto;">
      ${panels.map((panel, idx) => `
        <div class="panel-board">
          <h3 style="margin: 0 0 10px 0;">Board ${idx + 1}</h3>
          <svg viewBox="0 0 ${config.width} ${config.height}" style="width: 100%; max-width: 1000px; border: 2px solid #555; background: repeating-linear-gradient(45deg, #333, #333 10px, #222 10px, #222 20px);">
            ${panel.placements.map(plc => `
              <g class="panel-piece" title="${plc.item.name}: ${plc.rect.w}x${plc.rect.h}">
                <rect x="${plc.rect.x}" y="${plc.rect.y}" width="${plc.rect.w}" height="${plc.rect.h}" fill="var(--accent-primary)" stroke="#000" stroke-width="2" />
                <text x="${plc.rect.x + (plc.rect.w / 2)}" y="${plc.rect.y + (plc.rect.h / 2)}" fill="#fff" font-size="${Math.min(plc.rect.w, plc.rect.h) / 2}" dominant-baseline="middle" text-anchor="middle" font-weight="bold">
                  ${plc.item.label}
                </text>
              </g>
            `).join('')}
          </svg>
        </div>
      `).join('')}
    </div>
  `;

  // Provide way to listen to apply
  const btn = container.querySelector('#cp-apply');
  if (btn) {
    btn.addEventListener('click', () => {
      furniture.panelConfig.width = parseInt(container.querySelector('#cp-width').value, 10);
      furniture.panelConfig.height = parseInt(container.querySelector('#cp-height').value, 10);
      furniture.panelConfig.kerf = parseInt(container.querySelector('#cp-kerf').value, 10);
      // Let main.js know to trigger an update, we can dispatch a custom event
      container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
    });
  }
}
```

**Step 4: Run dev server and verify**
You can't verify till task 3, so just commit.

**Step 5: Commit**

```bash
git add index.html src/ui/cutplan-view.js
git commit -m "feat: add cut plan UI and SVG rendering"
```

---

### Task 3: Hook up to main application

**Files:**
- Modify: `src/main.js`
- Modify: `src/ui/toolbar.js`

**Step 1: Update main.js**

```javascript
// Modify imports
import { renderCutPlan } from './ui/cutplan-view.js';

// Around line 74 in appState
const appState = {
  // ...
  currentView: 'design',   // 'design', 'cut-list', 'cut-plan', 'tools'
};

// Around line 182 in fullUpdate()
  const designView = document.getElementById('view-design');
  const cutlistView = document.getElementById('view-cutlist');
  const cutplanView = document.getElementById('view-cutplan');
  const toolsView = document.getElementById('view-tools');

  // ... Update view toggling conditionals
  if (appState.currentView === 'design') {
      designView.style.display = '';
      cutlistView.style.display = 'none';
      cutplanView.style.display = 'none';
      toolsView.style.display = 'none';
      // ...
  } else if (appState.currentView === 'cut-list') {
      designView.style.display = 'none';
      toolsView.style.display = 'none';
      cutplanView.style.display = 'none';
      cutlistView.style.display = '';
      renderFullCutList(cutlistView, appState.planks);
  } else if (appState.currentView === 'cut-plan') {
      designView.style.display = 'none';
      toolsView.style.display = 'none';
      cutlistView.style.display = 'none';
      cutplanView.style.display = '';
      renderCutPlan(cutplanView, appState.furniture, appState.planks);
  } // ... tools view

// Anywhere in `init()`:
  document.getElementById('view-cutplan').addEventListener('config-updated', () => {
    saveAndUpdate();
  });
```

**Step 2: Update toolbar**

We should add a button to the toolbar to view the Cut Plan.

```javascript
// src/ui/toolbar.js
// Next to the tools button
btnTools.outerHTML + `
  <button class="btn btn-icon ${state.currentView === 'cut-plan' ? 'active' : ''}" id="btn-cut-plan" title="View Cut Plan">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
  </button>
`

// bindings
document.getElementById('btn-cut-plan')?.addEventListener('click', () => callbacks.onChangeView('cut-plan'));
```

**Step 3: Run app to verify it passes**

Run `npm run dev`, verify cut plan view works and configuration correctly recalculates panels.

**Step 4: Commit**

```bash
git add src/main.js src/ui/toolbar.js
git commit -m "feat: hook up panel cut plan view to main app and toolbar"
```
