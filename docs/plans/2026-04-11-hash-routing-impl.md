# Hash Routing Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Sync the application's view and selection state with the URL hash to allow reliable refresh behavior and browser history back/forward navigation.

**Architecture:** We will implement simple hash routing in `src/main.js`. 
- An `updateHashFromState()` helper will parse the `appState.currentView` and `appState.selectedNodeId` into a string like `#view=cut-list&node=123`. It will use `history.pushState` when the hash changes to avoid adding redundant history entries.
- An `applyHashToState()` helper will read the hash, update `appState`, and call `fullUpdate()`. This function will be triggered on initialization (`init()`) and whenever the `hashchange` window event fires.
- We will modify `onSelectNode()` and `onChangeView()` to append to the history.

**Tech Stack:** JavaScript, URLSearchParams, DOM History API

---

### Task 1: Add State-to-Hash and Hash-to-State Helpers

**Files:**
- Modify: `src/main.js`

**Step 1: Write helper functions**
Add the `updateHashFromState` and `applyHashToState` functions inside `src/main.js` in the `Helpers` section (around line 90-110).

```javascript
/**
 * Updates the URL hash to match current application state.
 * Only pushes to history if the hash has actually changed to prevent history spam.
 */
function updateHashFromState() {
  const params = new URLSearchParams();
  
  if (appState.currentView && appState.currentView !== 'design') {
    params.set('view', appState.currentView);
  }
  
  // Only store node ID if it's not the root, to keep URL clean on initial load
  if (appState.selectedNodeId && appState.furniture && appState.selectedNodeId !== appState.furniture.root.id) {
    params.set('node', appState.selectedNodeId);
  }
  
  const hashString = params.toString();
  const newHash = hashString ? '#' + hashString : '';
  
  // Compare to current hash (ignoring window.location.hash format quirks if empty)
  const currentHash = window.location.hash === '#' ? '' : window.location.hash;
  if (currentHash !== newHash) {
    history.pushState(null, '', newHash || window.location.pathname);
  }
}

/**
 * Updates application state based on the URL hash.
 */
function applyHashToState(triggerUpdate = true) {
  const hashString = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
  const params = new URLSearchParams(hashString);
  
  const newView = params.get('view') || 'design';
  const newNodeId = params.get('node') || (appState.furniture ? appState.furniture.root.id : null);
  
  let stateChanged = false;
  
  if (appState.currentView !== newView) {
    appState.currentView = newView;
    stateChanged = true;
  }
  
  if (appState.selectedNodeId !== newNodeId) {
    appState.selectedNodeId = newNodeId;
    stateChanged = true;
  }
  
  if (stateChanged && triggerUpdate) {
    fullUpdate();
  }
  return stateChanged;
}
```

### Task 2: Wire up the History and App Lifecycle

**Files:**
- Modify: `src/main.js`

**Step 1: Add listener and initialization in `init()`**

Update `init()` to read the hash at load time, and listen to `hashchange`.
Around line 178 `fullUpdate();`, insert hook:

```javascript
  // Override selectedNodeId and currentView based on URL Hash
  applyHashToState(false); // Don't trigger fullUpdate inside, do it manually below

  // First full update
  fullUpdate();

  // Listen to browser Back/Forward navigation
  window.addEventListener('hashchange', () => {
    applyHashToState(true);
  });
```

**Step 2: Add `updateHashFromState` to trigger points**

In `onSelectNode(nodeId)` (around line ~342), insert `updateHashFromState()` inside:
```javascript
function onSelectNode(nodeId) {
  appState.selectedNodeId = appState.selectedNodeId === nodeId ? null : nodeId;
  // ... rest of path code
  fullUpdate();
  updateHashFromState();
}
```

In `toolbarCallbacks.onChangeView(view)` (around line ~618):
```javascript
  onChangeView(view) {
    appState.currentView = view;
    fullUpdate();
    updateHashFromState();
  },
```

### Task 3: Commit

**Files:**
- Modify: `src/main.js`
- Create: `docs/plans/2026-04-11-hash-routing-impl.md`

**Step 1: Commit**
```bash
git add src/main.js docs/plans/2026-04-11-hash-routing-impl.md
git commit -m "feat(routing): implement hash-based routing for view and selection state"
```
