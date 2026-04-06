# 3D Lock Overlay Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Overlay SVG lock icons directly on the 3D model for all locked compartments using a togglable view mode.

**Architecture:** Extend the existing 2D projection engine (`quotes.js`) to parse the full compartment tree, check the `locked` property, and plot SVG emojis (`🔒`) on the specific dimension edges based on parental split directions. `appState.showLocks3D` will serve as the global toggle connected to a toolbar button.

**Tech Stack:** Vanilla JS, SVG DOM manipulation, 3D math projection via Three.js.

---

### Task 1: UI Toggle and State Hookup

**Files:**
- Modify: `src/i18n.js`
- Modify: `src/ui/toolbar.js`
- Modify: `src/main.js`

**Step 1: Write the failing tests / Check structure**
We can't easily unit test SVG DOM injection cleanly in JSDOM without intense mocking, but we can verify the state changes. Instead, we'll implement it strictly and use visual verification.

**Step 2: Add Translations**
In `src/i18n.js`, add:
```javascript
// en
toolbar: {
  // ... existing
  toggle_locks: "Show Locks",
},
// fr
toolbar: {
  // ... existing
  toggle_locks: "Afficher Verrous",
},
```

**Step 3: Add Toolbar Button**
In `src/ui/toolbar.js`, in `renderToolbar`:
```javascript
  const state = appState || {};
  // ...
  container.innerHTML = `
    <!-- existing buttons ... -->
    <div class="toolbar-group">
      <button id="btn-toggle-locks" class="btn btn-secondary ${state.showLocks3D ? 'btn-active' : ''}">
        🔒 ${t('toolbar.toggle_locks')}
      </button>
    </div>
  `;
  // ...
  const btnToggleLocks = document.getElementById('btn-toggle-locks');
  if (btnToggleLocks) {
    btnToggleLocks.addEventListener('click', () => {
      onAction('toggleLocks');
    });
  }
```

**Step 4: Handle State in main.js**
In `src/main.js`, add state `appState.showLocks3D = false;`.
In the `toolbar.renderToolbar(..., (action, payload) => {` callback:
```javascript
  if (action === 'toggleLocks') {
    appState.showLocks3D = !appState.showLocks3D;
    requestRender();
  }
```

**Step 5: Commit**
```bash
git add src/i18n.js src/ui/toolbar.js src/main.js
git commit -m "feat(ui): add state and toolbar toggle for 3D locks overlay"
```

---

### Task 2: Implement SVG Rendering Engine for Locks

**Files:**
- Modify: `src/ui/quotes.js`

**Step 1: Add the SVG logic in quotes.js**
In `src/ui/quotes.js`, underneath `renderQuotes`, add `renderLocks`. It uses its own pooled SVG text element array to avoid DOM thrashing.

```javascript
import { getNodeDimensions, getNodePath } from '../model.js';

const pooledLockNodes = [];
let usedLockNodes = 0;

export function renderLocks(furniture, showLocks, project3DTo2D) {
  const overlay = document.getElementById('quotes-overlay');
  if (!overlay) return;

  usedLockNodes = 0;

  if (furniture && showLocks && project3DTo2D) {
    function traverse(node) {
      if (node.locked && node.id !== furniture.root.id) {
        const dim = getNodeDimensions(furniture, node.id);
        const path = getNodePath(furniture.root, node.id);
        if (dim && path && path.length > 0) {
          // The parent is the second to last item in path
          const parentSegment = path[0]; 
          // Wait, path from root is [ {node: root}, {node: child1}, target ]
          // The parent of target is the last item with a childIndex.
          let parentNode = null;
          if (path.length >= 2) {
            parentNode = path[path.length - 2].node;
          }

          if (parentNode) {
            const zFront = furniture.depth + 10;
            let targetX, targetY;

            if (parentNode.direction === 'col') {
              // Width locked: bottom edge center
              targetX = dim.x + (dim.w / 2);
              targetY = dim.y + dim.h - 5;
            } else {
              // Height locked: right edge center
              targetX = dim.x + dim.w - 15;
              targetY = dim.y + (dim.h / 2);
            }

            const sc = project3DTo2D(targetX, targetY, zFront);
            if (sc) {
              if (usedLockNodes >= pooledLockNodes.length) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('class', 'quote-text lock-text');
                overlay.appendChild(text);
                pooledLockNodes.push(text);
              }
              const textNode = pooledLockNodes[usedLockNodes];
              textNode.setAttribute('x', sc.x);
              textNode.setAttribute('y', sc.y);
              textNode.textContent = '🔒';
              textNode.style.display = '';
              usedLockNodes++;
            }
          }
        }
      }
      for (const child of node.children) {
        traverse(child);
      }
    }
    traverse(furniture.root);
  }

  for (let i = usedLockNodes; i < pooledLockNodes.length; i++) {
    pooledLockNodes[i].style.display = 'none';
  }
}
```

**Step 2: Commit**
```bash
git add src/ui/quotes.js
git commit -m "feat(3d): implement visual SVG rendering of 3D lock icons"
```

---

### Task 3: Trigger Output & Style Enhancements

**Files:**
- Modify: `src/main.js`
- Modify: `src/style.css`

**Step 1: Wire up the render step**
In `src/main.js`, import `renderLocks` from `./ui/quotes.js`.
Inside `requestRender()` (specifically where `renderQuotes` is called around line 130), add:
```javascript
  renderQuotes(appState.furniture, appState.selectedId, project3DTo2D);
  renderLocks(appState.furniture, appState.showLocks3D, project3DTo2D);
```

**Step 2: Enhance Lock Overlay CSS**
In `src/style.css`, style the `.lock-text` class so it drops shadows effectively and stands out cleanly on top of 3D objects.
```css
.lock-text {
  font-size: 16px;
  filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.8));
  user-select: none;
  pointer-events: none;
}
```

**Step 3: Verification**
Run `npm run dev` and click the "🔒 Afficher Verrous" toolbar button. Lock an item in the form tree. The SVG should project directly onto the wood in the 3D scene exactly at the edge defining the restricted dimension.

**Step 4: Commit**
```bash
git add src/main.js src/style.css
git commit -m "feat: wire up lock rendering loop and css styles"
```
