# Compartment Reordering Design

## Overview
This feature allows users to reorder subdivisions (rows or columns) within a single parent compartment. Reordering will be possible via two UI methods:
1. Up/Down arrow buttons in the Properties panel (Form).
2. Native HTML5 Drag & Drop directly within the Hierarchy Tree panel.

## Architecture

### Model Layer (`src/model.js`)
A new method `reorderChild(node, oldIndex, newIndex)` will be introduced.
- **Constraints**: Reordering is strictly limited to siblings within the identical parent node.
- **Data Mutation**: The method will sequentially un-splice and re-splice both `node.children[oldIndex]` and `node.sizes[oldIndex]` to ensure compartment dimensions and locked states physically travel with the compartment.

### State Orchestration (`src/main.js`)
- `onReorderChild(parentId, oldIndex, newIndex)` will be added to the universal callback system.
- It will trigger a full `saveState` (for Undo/Redo tracking) and a `fullUpdate` cycle to re-render the 3D geometry and UI.

### UI Layers

#### Properties Panel (`src/ui/form.js`)
- **Components**: For each child item rendered inside a composite node, two ghost buttons (`↑` and `↓`) will be appended next to the dimension input.
- **Logic**: The first child's `↑` button and the last child's `↓` button will be disabled to prevent out-of-bounds operations.

#### Tree Panel (`src/ui/tree.js`)
- **Drag Source**: Tree nodes will receive the `draggable="true"` HTML attribute.
- **Drop Target**: The `ondragover` and `ondrop` handlers will be implemented on the container to detect when an item is dropped onto another item.
- **Validation**: When dropping Node A onto Node B, the UI will verify that they share the exact same `parentId`. If not, the drop is silently rejected. If they do, their relative indices are calculated, and `onReorderChild` is fired.

## Error Handling
- Attempting to pass an invalid `newIndex` (e.g. `< 0` or `>= children.length`) will be short-circuited in `model.js`.
- Cross-parent dragged nodes will be rejected by evaluating their `parentId` derived from the tree path or DOM tracking.
