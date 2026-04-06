# Recursive Resize (Bubbling) Design

## Overview
When users attempt to resize a child node whose siblings are all completely locked, the tree will now intelligently climb up the hierarchy to find the first ancestor dividing the space in the *same* direction. It will resize that ancestor (stealing space from its sibling), and dynamically allocate the gained space strictly to the targeted child, maintaining perfect physical modeling.

## 1. Architecture & API Changes
We will introduce a new model function: `resizeNodeRecursively(root, targetId, newSize)`.
Instead of just operating locally like `resizeChild`, this function has full tree context.

## 2. Components & Data Flow
1. **`resizeNodeRecursively(root, targetId, newSize)`**:
   - Computes `delta`. Try calling standard `resizeChild(parent, index, newSize)`.
   - If `resizeChild` throws `error.no_free_neighbor`:
     - Catch it.
     - Build path using `getNodePath`.
     - Go UP the path looking for an ancestor `parent` whose `direction` structurally aligns with the target parent (i.e. both are `row`s or both are `col`s).
     - Recursively call `resizeNodeRecursively(root, ancestorNode.id, ancestorNode.oldSize + delta)`.
     - If the ancestor succeeds, forcibly apply the `delta` to our local target node's `sizes[childIndex]` without throwing.
     - Important: Any errors from the top simply bubble down cleanly.
2. **`main.js` Controller**:
   - `onResizeChild` will swap its `resizeChild(node, childIndex, newSize)` call to `resizeNodeRecursively(appState.furniture.root, targetNodeId, newSize)`.
   - Since `main.js` correctly calls `normalizeTree` immediately after, all intermediate orthogonally laid out components (like `cols` mediating between the `rows`) will naturally expand to fit perfectly.

## 3. Error Handling
- Retains existing error strings like "no_free_neighbor" if the tree is fully constrained up to the root.
- Handles floating sizes and bounds recursively.

## 4. Testing
We will add standard unit tests in `src/model.test.js` to simulate a fully locked subdivision interacting with its grandparent.
