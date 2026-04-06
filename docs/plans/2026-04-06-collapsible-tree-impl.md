# Collapsible Tree Hierarchy Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Allow users to safely fold/unfold folders in the tree view to stay organized, saving the fold state reliably to local storage and the exported furniture JSON.

**Architecture:** We add a `.collapsed` boolean on node descriptors. `tree.js` will read this flag and skip rendering children, instead throwing a ▶ icon instead of ▼. 

**Tech Stack:** Vanilla JS, DOM manipulation, existing state management.

---

### [x] Task 1: DOM Elements and CSS for Folding

**Files:**
- Modify: `src/ui/tree.js`
- Modify: `src/style.css`

**Step 1: Write the visual logic**
In `src/ui/tree.js`:
- Update the parameters of `renderTree` to accept `onToggleCollapse` as a new callback.
- In `renderNode`, check `const hasChildren = node.children && node.children.length > 0;`.
- Render a caret `span` before the icon: `<span class="tree-caret" data-action="toggle" title="Toggle fold">${hasChildren ? (node.collapsed ? '▶' : '▼') : ''}</span>`.
- Update the DOM listener logic in `renderTree` to catch clicks specifically on elements with `data-action="toggle"`. Prevent bubbling so it doesn't also select the node, and call `onToggleCollapse(nodeId)`.
- If `node.collapsed` is true, omit calling `renderNode` on its children.

**Step 2: Add CSS rules**
In `src/style.css`, style `.tree-caret`:
```css
.tree-caret {
  display: inline-block;
  width: 16px;
  text-align: center;
  font-size: 10px;
  cursor: pointer;
  color: var(--text-muted);
  user-select: none;
}
.tree-caret:hover {
  color: var(--text-primary);
}
```

**Step 3: Commit**
```bash
git add src/ui/tree.js src/style.css
git commit -m "feat(ui): add caret html and css for collapsing tree nodes"
```

---

### [x] Task 2: State Handler in Main

**Files:**
- Modify: `src/main.js`

**Step 1: Bind the toggle action**
In `src/main.js`, update the `renderTree` call inside `fullUpdate` to pass `onToggleCollapse`.
```javascript
    renderTree(
      document.getElementById('tree-panel'),
      appState.furniture,
      appState.selectedNodeId,
      onSelectNode,
      formCallbacks.onReorderChild,
      (nodeId) => {
        const node = findNodeById(appState.furniture.root, nodeId);
        if (node) {
          node.collapsed = !node.collapsed;
          saveAndUpdate();
        }
      }
    );
```

**Step 2: Commit**
```bash
git add src/main.js
git commit -m "feat: hook up state mutation for collapsing tree nodes"
```

---

### [x] Task 3: Auto-Uncollapse on Selection

**Files:**
- Modify: `src/main.js`

**Step 1: Uncollapse Ancestors on 3D Click**
In `src/main.js`, inside the `onSelectNode` function, before doing anything else:
```javascript
  // Auto-expand parents if selecting a node from 3D that might be hidden
  const path = getNodePath(appState.furniture.root, nodeId);
  if (path) {
    let changed = false;
    // Iterate from root to parent
    for (let i = 0; i < path.length - 1; i++) {
      const ancestor = path[i].node || path[i]; // Handling array elements cleanly
      if (ancestor.collapsed) {
        ancestor.collapsed = false;
        changed = true;
      }
    }
    if (changed) saveToLocalStorage(appState.furniture); // persist expansion
  }
```

*Note: we need to import `getNodePath` from `./model.js` at the top of `src/main.js` if it isn't already.*

**Step 2: Verification**
- Subdivide root heavily. Collapse root (everything disappears from list). 
- In the 3D Viewer, click on any compartment. 
- The tree should automatically uncollapse and highlight that selection!

**Step 3: Commit**
```bash
git add src/main.js
git commit -m "feat: auto-expand parent nodes when their collapsed children are selected"
```
