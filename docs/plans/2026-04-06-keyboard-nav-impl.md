# Keyboard Navigation & Help Modal Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Implement full arrow-key DOM navigation and a modal visually displaying these shortcuts.

**Architecture:** Extend the existing `handleKeyboard` events in `main.js` using `model.js` path finders. Create a `src/ui/help-modal.js` that inserts and toggles an overlay layer.

**Tech Stack:** Vanilla JS, DOM manipulation.

---

### Task 1: Arrow Keys Navigation Logic
**Files:**
- Modify: `src/main.js`

**Step 1: Write the minimal implementation**
We will add standard checks to `src/main.js` inside `handleKeyboard(e)` before evaluating shortcuts:

```javascript
  // Ensure we have a valid node selected
  if (appState.selectedNodeId) {
    const node = findNodeById(appState.furniture.root, appState.selectedNodeId);
    if (!node) return;
    
    // Arrow Up -> Select parent
    if (e.key === 'ArrowUp') {
      const path = getNodePath(appState.furniture.root, appState.selectedNodeId);
      if (path && path.length > 1) {
        e.preventDefault();
        const parent = path[path.length - 2].node;
        onSelectNode(parent.id);
        return; // stop execution
      }
    }

    // Arrow Down -> Select first child
    if (e.key === 'ArrowDown') {
      if (node.children && node.children.length > 0) {
        e.preventDefault();
        onSelectNode(node.children[0].id);
        return;
      }
    }

    // Arrow Left / Arrow Right -> Sibling navigation
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const path = getNodePath(appState.furniture.root, appState.selectedNodeId);
      if (path && path.length > 1) {
        const parent = path[path.length - 2].node;
        const currentIndex = parent.children.findIndex(c => c.id === appState.selectedNodeId);
        
        if (currentIndex !== -1) {
          if (e.key === 'ArrowLeft' && currentIndex > 0) {
            e.preventDefault();
            onSelectNode(parent.children[currentIndex - 1].id);
            return;
          }
          if (e.key === 'ArrowRight' && currentIndex < parent.children.length - 1) {
            e.preventDefault();
            onSelectNode(parent.children[currentIndex + 1].id);
            return;
          }
        }
      }
    }
  }
```

**Step 2: Commit**
```bash
git add src/main.js
git commit -m "feat(ui): implement spatial logical arrow keyboard navigation"
```

---

### Task 2: Help / Shortcuts Modal
**Files:**
- Create: `src/ui/help-modal.js`
- Modify: `src/ui/toolbar.js`
- Modify: `src/main.js` (init call)

**Step 1: Write `src/ui/help-modal.js`**
Export an `initHelpModal(container)` function handling construction and click-listeners. Leverage the existing `.modal-overlay`, `.modal-content` from CSS.

**Step 2: Update `src/ui/toolbar.js`**
Append a `<li><button class="btn btn-ghost" id="btn-help" title="Aide [?]">❔ Aide</button></li>` into the header `<ul>`.

**Step 3: Commit**
```bash
git add src/ui/help-modal.js src/ui/toolbar.js src/main.js
git commit -m "feat(ui): add keyboard shortcuts help modal"
```
