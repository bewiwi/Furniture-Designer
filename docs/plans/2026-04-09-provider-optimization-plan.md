# Provider Optimization Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Modify the Panel Plan page to group panels by Provider and run optimizations sequentially across providers instead of globally crossing their inventories.

**Architecture:** We will change `panelConfig` in `src/storage.js` to replace the `panelKinds` array with a `providers` array. We will update the layout sidebar in `cutplan-view.js` to render provider groups visually rather than independent panels. For algorithm execution, the root loop will iterate over active providers and delegate the `packPlanks` or `packPlanksSmartMix` algorithm to each provider's subset of panel variants, ultimately generating a provider-ranked summary output.

**Tech Stack:** JavaScript (Vanilla UI), Model Migrations

---

### Task 1: Update Storage Data Model & Migration

**Files:**
- Modify: `src/storage.js`

**Step 1: Write the failing test**

```javascript
import { describe, it, expect } from 'vitest';
import { migratePanelConfig } from './storage.js';

describe('migratePanelConfig', () => {
    it('migrates standard panelKinds array to a Default Provider', () => {
        const furniture = {
            panelConfig: {
                algorithm: 'smart-mix',
                panelKinds: [
                    { id: '1', name: 'Standard', width: 2000, height: 1000 }
                ]
            }
        };
        migratePanelConfig(furniture);
        expect(furniture.panelConfig.panelKinds).toBeUndefined();
        expect(furniture.panelConfig.providers).toHaveLength(1);
        expect(furniture.panelConfig.providers[0].name).toBe('Default Provider');
        expect(furniture.panelConfig.providers[0].kinds).toHaveLength(1);
    });

    it('creates empty config with default provider safely', () => {
        const furniture = {};
        migratePanelConfig(furniture);
        expect(furniture.panelConfig.providers).toBeDefined();
        expect(furniture.panelConfig.providers[0].kinds).toHaveLength(1);
    });
});
```
(Wait, we don't have a `storage.test.js` file yet, we should edit `src/model.test.js` where we test `migrateFurniture` or create `src/storage.test.js`). 

Since `src/storage.js` is pure JSON, let's create `src/storage.test.js` or just add a test block to `model.test.js`. We will create `src/storage.test.js`.

**Step 2: Run test to verify it fails**

Run: `npm test src/storage.test.js`
Expected: FAIL 

**Step 3: Write minimal implementation in `src/storage.js`**

Modify `migratePanelConfig`:
Replace `if (Array.isArray(cfg.panelKinds)) return;` logic and standard fallback with:
```javascript
export function migratePanelConfig(furniture) {
  if (!furniture) return;
  if (!furniture.panelConfig) {
    furniture.panelConfig = {
      kerf: 3,
      algorithm: 'smart-mix',
      providers: [{
        id: 'default',
        name: 'Default Provider',
        enabled: true,
        kinds: [{ id: 'k1', name: 'Standard', width: 2440, height: 1220, pricePerPanel: 0, count: 1 }],
      }]
    };
    return;
  }
  
  const cfg = furniture.panelConfig;
  
  // Phase 1 migration (flat width/height -> panelKinds list)
  if (!cfg.panelKinds && !cfg.providers) {
    cfg.panelKinds = [{
      id: 'migrated',
      name: 'Standard',
      width: cfg.width ?? 2440,
      height: cfg.height ?? 1220,
      pricePerPanel: 0,
      count: 1
    }];
    delete cfg.width;
    delete cfg.height;
  }

  // Phase 2 migration (panelKinds list -> providers list)
  if (cfg.panelKinds && !cfg.providers) {
    cfg.providers = [{
      id: 'default',
      name: 'Default Provider',
      enabled: true,
      kinds: [...cfg.panelKinds]
    }];
    delete cfg.panelKinds;
  }
}
```

**Step 4: Verify test passes**
Run: `npm test src/storage.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/storage.js src/storage.test.js
git commit -m "feat(storage): migrate panelConfig to hierarchical providers model"
```

---

### Task 2: Redesign Sidebar UI to handle Providers hierarchy

**Files:**
- Modify: `src/ui/cutplan-view.js`
- Modify: `src/style.css`

**Step 1: Convert `updateConfig()` logic**
Currently, `updateConfig` parses a flat list of DOM `.cp-kind-row` items. We must change it to nested:
```javascript
function updateConfig() {
  const kerf = parseFloat(container.querySelector('#cp-kerf').value) || 0;
  const alg = container.querySelector('#cp-algorithm').value;
  
  const providers = Array.from(container.querySelectorAll('.cp-provider-card')).map(pEl => {
      const id = pEl.dataset.id;
      const name = pEl.querySelector('.cp-provider-name').value;
      const enabled = pEl.classList.contains('provider-disabled') === false;

      const kinds = Array.from(pEl.querySelectorAll('.cp-kind-row')).map(r => ({
        id: r.dataset.id,
        name: r.querySelector('.cp-kind-name').value || r.querySelector('.cp-kind-name').placeholder,
        width: parseInt(r.querySelector('.cp-kind-w').value),
        height: parseInt(r.querySelector('.cp-kind-h').value),
        pricePerPanel: parseFloat(r.querySelector('.cp-kind-price').value),
        enabled: r.classList.contains('cp-kind-disabled') === false
      }));

      return { id, name, enabled, kinds };
  });

  furniture.panelConfig.kerf = kerf;
  furniture.panelConfig.algorithm = alg;
  furniture.panelConfig.providers = providers;
  saveWorkspace();
  renderResults();
}
```

**Step 2: Convert `renderSidebar()` logic**
Replace the `.cp-kinds-list` generation with a map over `config.providers`, creating `.cp-provider-card` containers, each containing the `.cp-kinds-list` for its panels. Add buttons for "Add Panel" within each provider and an "Add Provider" at the master list bottom.

**Step 3: Update Event Listeners**
Refactor the event bindings (`input`, `focus`, `click`) to handle additions/deletions at both nesting levels.

**Step 4: Update CSS layout**
Add minimal CSS in `src/style.css` to box the provider cards neatly to maintain the UI polish from the last update:
```css
.cp-provider-card { background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); padding: 12px; margin-bottom: 16px; }
.cp-provider-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
.cp-provider-name { flex-grow: 1; background: transparent; border: none; color: white; font-weight: bold; font-size: 1.05em; outline: none; }
.cp-provider-add-kind { display: block; width: 100%; border: 1px dashed rgba(255,255,255,0.2); background: transparent; padding: 6px; cursor: pointer; border-radius: 4px; color: #888; font-size: 0.85rem;}
.provider-disabled { opacity: 0.5; }
.provider-disabled .cp-provider-name { text-decoration: line-through; }
```

**Step 5: Commit**
```bash
git add src/ui/cutplan-view.js src/style.css
git commit -m "feat(ui): redesign settings sidebar for nested provider panel hierarchies"
```

---

### Task 3: Execute Algorithms per Provider

**Files:**
- Modify: `src/ui/cutplan-view.js`

**Step 1: Refactor `runResults()` logic**
Ditch `runCheapestForAll()` and `runSmartMix()` which operated on global `kinds`.
Create a main router `function calculateProviders(config, preparedPlanks)`:
```javascript
function calculateProviders(config, preparedPlanks) {
  const ranked = [];
  
  for (const provider of config.providers) {
    if (!provider.enabled) continue;
    const activeKinds = provider.kinds.filter(k => k.enabled !== false);
    if (!activeKinds.length) continue;

    if (config.algorithm === 'cheapest-for-all') {
      let optimal = null;
      for (const kind of activeKinds) {
         let subResult = packPlanks(preparedPlanks, [kind], config.kerf);
         // Find best individual panel type inside config
         // Calculate cost, compare against optimal 
      }
      ranked.push({ provider, ...optimal });
    } else {
      let mixResult = packPlanksSmartMix(preparedPlanks, activeKinds, config.kerf);
      ranked.push({ provider, ...mixResult });
    }
  }

  // Sort providers by total cost then by unplaced count
  ranked.sort((a, b) => { ... });
  return ranked;
}
```

**Step 2: Update `renderResults()` display**
Render provider rank cards (`cp-ranking-cards`), listing winner providers and their global sub-totals. Display the SVGs below solely for the #1 ranked provider.

**Step 3: Commit**
```bash
git add src/ui/cutplan-view.js
git commit -m "feat(packer): isolate optimization algorithm loops strictly per-provider and rank output"
```
