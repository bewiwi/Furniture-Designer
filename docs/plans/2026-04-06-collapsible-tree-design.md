# Collapsible Tree Hierarchy Design

## Goal
Allow the user to collapse and expand branches of the compartment hierarchy in the left panel to reduce visual clutter. The state of each folder (expanded/collapsed) will be persistent across reloads and saved directly into the furniture data.

## User Experience
- Each tree node that has children will display a small clickable caret icon (e.g., `▼` when expanded, `▶` when collapsed) to the left of the compartment icon.
- Clicking the caret will toggle visibility of the node's children, and save this state in `node.collapsed`.
- If a child deep within the tree is selected (e.g., by clicking on it in the 3D viewer), its ancestor folders should automatically temporarily expand or permanently uncollapse to reveal the selection context.
- Leaf nodes (nodes without children) will have an invisible placeholder or dot instead of a caret to maintain alignment.

## Data Model & Architecture
- **Data addition:** We'll add an optional `collapsed: boolean` property to the node data structure in `model.js`. By default, it will be `false` or `undefined`.
- **UI Logic (`src/ui/tree.js`):** 
  - The `renderNode` function will check `node.collapsed`. If `true`, it will skip calling `renderNode` on its `node.children`, effectively hiding them from the left pane DOM.
  - A dedicated `span.tree-caret` will be rendered for nodes with `children.length > 0`.
- **Event Handling:** We'll need a new callback from `tree.js` (e.g., `onToggleCollapse`) that routes back to `main.js`.
- **State Mutation (`src/model.js` OR `src/main.js`):** `main.js` will export a mechanism or just mutate `node.collapsed = !node.collapsed` and call `saveAndUpdate()`.

## Edge Cases
- **3D Viewer Selection:** When clicking on a piece in 3D, the tree selects that piece. If it's currently hidden because its parent is collapsed, we should traverse the selection's parents and forcefully set `collapsed = false` on them so the selection becomes visible.
- **Drag and Drop:** Collapsed nodes shouldn't accidentally accept drops into their invisible children unless they auto-expand (for simplicity, drops target the parent itself, which remains valid).
