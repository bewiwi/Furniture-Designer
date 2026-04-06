# SVG Object Placeholders Design

## Overview
A lightweight system to decorate the 3D furniture view with dimensional placeholder objects (TVs, consoles) using CSS/SVG Overlays, enabling realistic proportion checks without compromising JSCAD engine performance.

## 1. Object Catalog (`src/objects.js`)
We will create a static library `OBJECT_CATALOG` defining standard items:
- Dimensions (w, h, d in mm).
- Base64 SVG or SVG String for aesthetics.
Example objects: PS5, Xbox Series X, Switch, TV 55", Platine Vinyle.

## 2. Model Extensions (`src/model.js`)
Furniture `node` entities will accept an `objects` property:
`node.objects = [{ id: 'tv_55', align: 'center' }]`
Alignments supported: `left`, `center`, `right`.

## 3. UI Form (`src/ui/form.js`)
When selecting a leaf node, the properties sidebar will display:
- A dropdown listing `OBJECT_CATALOG` items.
- An "Ajouter" button.
- A list of objects present in that node, allowing alignment alteration or deletion.

## 4. Billboard Overlay Rendering (`src/ui/objects-overlay.js`)
Hooked into the rendering loop (`main.js` `setRenderCallback`):
1. **Tree Traverse**: Find all nodes with `.objects`.
2. **Coordinate Calculation**: Determine the absolute 3D position of an object resting on the bottom shelf of its respective sub-compartment, respecting the `align` property.
3. **Projection & Scaling**: Project the `[center_x, center_y, center_z]` point to 2D screen coordinates (`X, Y`). Project extreme points (e.g. `[x - w/2, ...]` and `[x + w/2, ...]`) to calculate the screen-relative pixel width of the billboard based on current camera zoom.
4. **DOM Injection**: Spawn absolutely positioned `<img src="svg">` or `<div class="svg-wrapper">` elements mapping to those pixel coordinates, maintaining aspect ratio.
