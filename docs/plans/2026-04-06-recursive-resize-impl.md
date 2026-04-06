# Recursive Resize (Bubbling) Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Implement recursive `resizeNodeRecursively` in the model to steal space from ancestors when local siblings are completely locked.

**Architecture:** Model modification with recursive path lookup, using error-bubbling. TDD approach to verify structural logic before controller integration.

**Tech Stack:** Vanilla JS, Vitest.

---

### Task 1: Recursive Resize Algorithm & Tests

**Files:**
- Modify: `src/model.js`
- Modify: `src/model.test.js`

**Step 1: Write the failing test**

In `src/model.test.js`, add inside `describe('resizeChild')` (or create a new block for `resizeNodeRecursively`):

```javascript
  it('resizeNodeRecursively steals space from a matching ancestor when siblings are locked', () => {
    const f = createFurniture('Test', 1000, 1000, 300, 20);
    // Root is row: sizes [470, 470]
    subdivide(f.root, 'row', 2, 960, 20); 
    // Subdivide child 0 into cols (widths)
    subdivide(f.root.children[0], 'col', 2, 960, 20); // sizes [470, 470]
    // Subdivide child 0's child 0 into rows (heights)
    subdivide(f.root.children[0].children[0], 'row', 2, 470, 20); // sizes [225, 225]
    
    // We lock the sibling of the deep row
    f.root.children[0].children[0].children[1].locked = true;
    
    // So if we try to resize child 0 from 225 to 325, it normally fails.
    // resizeNodeRecursively should climb up to f.root (the nearest row parent) and steal 100 from f.root.children[1].
    const targetId = f.root.children[0].children[0].children[0].id;
    import { resizeNodeRecursively } from './model.js'; // Ensure imported!
    resizeNodeRecursively(f.root, targetId, 325);
    
    // The target child should now be 325
    expect(f.root.children[0].children[0].sizes[0]).toBe(325);
    
    // The grandparent's sibling (root's child 1) should have lost 100
    // initially it was 470, should now be 370
    expect(f.root.sizes[1]).toBe(370);
  });
```

**Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL because `resizeNodeRecursively` is not defined.

**Step 3: Write minimal implementation**

In `src/model.js`, export `resizeNodeRecursively`:
```javascript
export function resizeNodeRecursively(root, targetId, newSize) {
  const path = getNodePath(root, targetId);
  if (!path || path.length < 2) {
    throw new Error(t('error.invalid_child'));
  }

  const parentEntry = path[path.length - 2];
  const parent = parentEntry.node;
  const targetNode = path[path.length - 1].node;
  const childIndex = parent.children.findIndex(c => c.id === targetId);

  const oldSize = parent.sizes[childIndex];
  const delta = newSize - oldSize;

  if (delta === 0) return;

  try {
    // Attempt local standard resize
    resizeChild(parent, childIndex, newSize);
  } catch (e) {
    // If it's a locked bounds error, we can try to bubble up
    if (e.message !== t('error.no_free_neighbor') && e.message !== t('error.neighbor_too_small')) {
      throw e; // some other error
    }

    // Attempt to find an ancestor with the SAME direction
    const targetDirection = parent.direction; 
    let ancestorFound = false;

    // Walk up the path: path[path.length - 3] is the grandparent, etc.
    for (let i = path.length - 3; i >= 0; i--) {
      const ancestorParent = path[i].node;
      if (ancestorParent.direction === targetDirection) {
        // We found an ancestor container dividing in the same dimension!
        const ancestorChildNode = path[i + 1].node;
        const ancestorIndex = ancestorParent.children.findIndex(c => c.id === ancestorChildNode.id);
        const ancestorCurrentSize = ancestorParent.sizes[ancestorIndex];
        
        // Attempt recursive resize on that ancestor
        resizeNodeRecursively(root, ancestorChildNode.id, ancestorCurrentSize + delta);
        
        // If it succeeds, we forcefully apply the delta to our target
        parent.sizes[childIndex] = newSize;
        ancestorFound = true;
        break; // Stop climbing, we got our space!
      }
    }

    if (!ancestorFound) {
      // Nothing could provide the space
      throw e;
    }
  }
}
```

Don't forget to export it in `src/model.js` and add `t` dynamically if needed.

**Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/model.js src/model.test.js
git commit -m "feat(model): add resizeNodeRecursively bubbling algorithm"
```

---

### Task 2: Controller Integration

**Files:**
- Modify: `src/main.js`

**Step 1: Write minimal implementation**

In `src/main.js`:
- Import `resizeNodeRecursively`,
- Find `onResizeChild`:
```javascript
  onResizeChild(parentNodeId, childIndex, newSize) {
    const node = resolveNode(parentNodeId);
    if (!node) return;

    try {
      const childNode = node.children[childIndex];
      resizeNodeRecursively(appState.furniture.root, childNode.id, newSize);
      
      normalizeTree(
        appState.furniture.root,
        appState.furniture.width - 2 * appState.furniture.thickness,
        appState.furniture.height - 2 * appState.furniture.thickness,
        appState.furniture.thickness
      );

      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },
```

**Step 2: Commit**

```bash
git add src/main.js
git commit -m "feat(ui): hook up recursive resize in tool controller"
```
