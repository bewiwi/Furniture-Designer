# SVG Objects Overlay Implementation Plan

> **For Antigravity:** Use executing-plans to implement this plan task-by-task.

**Goal:** Provide an object library (TV, consoles) that users can overlay onto specific compartments, featuring 3D-to-2D projected SVG rendering that accurately scales directly with camera distance.

---

### Task 1: Catalog Definition & Tree State
**Files:** `src/objects.js` (NEW), `src/model.js`

1. **Create `src/objects.js`**:
   Define `export const OBJECT_CATALOG = [...]` containing elements like:
   - `tv_55`: { w: 1230, h: 710, d: 40, svg: `<svg>...</svg>` }
   - `tv_42`: { w: 930, h: 520, d: 40, svg: `<svg>...</svg>` }
   - `switch`: { w: 173, h: 104, d: 54, svg: `<svg>...</svg>` }
   - `xbox_x`: { w: 151, h: 301, d: 151, svg: `<svg>...</svg>` }
   - `ps5`: { w: 104, h: 390, d: 260, svg: `<svg>...</svg>` }

2. **Modify `src/model.js`**:
   - Provide helper functions: `addObjectToNode(node, objId)`, `removeObjectFromNode(node, objectIndex)`, `setObjectAlignment(node, objectIndex, align)`.
   - Update `cloneFurniture()` to deeply clone `node.objects`.

### Task 2: Properties Inspector UI
**Files:** `src/ui/form.js`

1. Inside `renderForm(node)`, append a section `<section class="form-section">` titled "Objets Témoins".
2. Include a `<select>` populated from `OBJECT_CATALOG` and an "Ajouter" button.
3. If `node.objects` has entries, map them to HTML rows displaying the object name, an alignment dropdown (`left`, `center`, `right`), and a deletion button.
4. Hook DOM events to trigger the respective model helpers and call `fullUpdate()`.

### Task 3: Spatial Screen Projection Engine
**Files:** `src/ui/objects-overlay.js` (NEW), `src/main.js`, `index.html`

1. **Create Overlay Container**: Add `<div id="objects-overlay-layer"></div>` to `index.html` right next to the canvas/lock overlays.
2. **Implement `objects-overlay.js`**:
   - `renderObjects(furniture, project3DTo2D)`
   - Iterates the tree finding `node.objects`.
   - For each object, pulls `dims = getNodeDimensions(root, node.id)`.
   - Calculates absolute `3D [X, Y, Z]`:
     - Y = `dims.y + thickness + object.h / 2`
     - Z = `thickness + object.d / 2`
     - X = (if `center`) `dims.x + dims.w/2`, (if `left`) `dims.x + thickness + object.w/2`.
   - To find screen pixel scale: project `(X - w/2)` and `(X + w/2)`. Take `pixel_width = Math.abs(xLeft - xRight)`.
   - Create/Update HTML `div` blocks carrying the SVG from the catalog, sized via `width: ${pixel_width}px`, translated visually via `transform: translate(-50%, -50%)`.
3. **Wire in `main.js`**: 
   - Call `renderObjects` inside `setRenderCallback` alongside locks and quotes.
