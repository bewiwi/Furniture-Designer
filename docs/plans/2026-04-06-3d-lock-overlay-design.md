# 3D View Lock Overlay Design

## Goal
Provide a visual way to see which dimensions are locked directly within the 3D representation of the furniture, eliminating the need to search the left-hand form tree.

## User Experience
- **Global Toggle:** A new button in the top toolbar or within the 3D viewer tools (e.g. "👁️🔒") that toggles the global visibility of lock overlays.
- **Visuals:** When active, small "🔒" SVG icons will statically float over the exact edges or faces of compartments that have a locked size, using the exact same robust 2D-projection system that `quotes.js` uses.

## Architecture & Implementation
* **State Management:** Add a generic boolean state `appState.showLocks3D` to track the toggle status.
* **SVG Engine Extension:** 
   Creates a new module (or extends `quotes.js`) to render the locked nodes. It will walk the furniture tree. For each node that is `locked === true`:
   - Determine its `parentNode` direction (`row` or `col`).
   - Calculate absolute dimensions `(x, y, w, h)`.
   - If `parent.direction === 'col'` (width is locked): place the 🔒 near the center-bottom edge.
   - If `parent.direction === 'row'` (height is locked): place the 🔒 near the center-right edge.
* **Component Projection:** Utilize the existing robust `project3DTo2D()` mechanism from `viewer.js` to snap the SVG text elements perfectly on top of the rotating 3D geometry.

## Edge Cases
- Compartments too small for the icon (can fade them or scale them down).
- The root node itself isn't technically "locked" in the tree array, only children are.
- Managing SVG pool memory to avoid thrashing DOM elements (similar constraint handled in `quotes.js`).
