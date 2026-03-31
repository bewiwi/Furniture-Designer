# Assembly Holes (Dowel/Goupille) Design

## Goal

Automatically calculate and display dowel assembly holes on each plank in the 2D technical drawings (cut list view and exported plan). The system determines how many holes are needed and where to place them based on how planks connect to each other. Dowel dimensions (diameter, depth, spacing, edge margin) are configurable from the root furniture properties panel.

## Core Concepts

### Joints

A **joint** is where two planks meet. Each joint produces holes in both planks:

- **End holes** — drilled into the narrow edge of a plank (e.g., into the end-grain of a shelf)
- **Face holes** — drilled into the broad face of a plank (e.g., into the inner face of an upright where a shelf meets it)

### Hole Placement Rules

For each joint edge:
1. First hole placed at `edgeMargin` (default 50mm) from both corners
2. Subsequent holes spaced at `spacing` (default 200mm)
3. If the edge is too short for even 1 hole at the margin, place a single centered hole
4. Minimum 2 holes per joint (for structural alignment), unless the edge is very small (<100mm), then 1

### Plank Types and Their Joints

| Plank Type | Connects To | Hole Location on This Plank |
|---|---|---|
| `frameV` (upright) | Top rail, bottom rail, shelves, separators | **Face holes** on inner face at each connection Y-position |
| `frameH` (rail) | Left upright, right upright | **End holes** on both short edges |
| `shelf` | Left and right adjacent uprights/separators | **End holes** on both short edges |
| `separator` | Top and bottom adjacent rails/shelves | **End holes** on both short edges (top & bottom) |

## Data Model Changes

### Furniture Object

Add a `dowelConfig` property to the furniture object:

```js
{
  // ... existing properties
  dowelConfig: {
    diameter: 8,      // mm — dowel pin diameter
    depth: 15,        // mm — hole depth into each piece
    edgeMargin: 50,   // mm — distance from corner to first hole
    spacing: 200,     // mm — distance between consecutive holes
  }
}
```

Default values are applied when creating new furniture or loading old projects without this field.

### Plank Object

Each plank gains a `holes` array computed during plank generation:

```js
{
  // ... existing plank properties
  holes: [
    {
      face: 'top' | 'bottom' | 'left' | 'right' | 'front',
      x: number,  // position along the plank's length axis
      y: number,  // position along the plank's width axis
      diameter: number,
      depth: number,
    }
  ]
}
```

## New Module: `src/holes.js`

Responsible for computing hole positions for each plank based on adjacency analysis.

### Algorithm

```
1. For each plank, determine its connection edges by analyzing
   which other planks share an edge with it.

2. For each connection edge:
   a. Compute the joint length (the overlapping dimension)
   b. Calculate hole count: max(2, floor((jointLength - 2*edgeMargin) / spacing) + 1)
      — but if jointLength < 100, use 1 hole centered
   c. Distribute holes evenly along the edge within the margins
   d. For the depth axis, center the hole on the plank's thickness

3. Return the holes array for each plank.
```

### Edge Detection

Two planks share a joint when:
- One plank's edge aligns with another plank's face
- They are adjacent (touching or overlapping in position)

For this furniture model, joints are deterministic based on the recursive structure:
- Every `frameH` (rail) connects to both `frameV` (uprights) at its ends
- Every `shelf` connects to the nearest vertical plank on each side
- Every `separator` connects to the nearest horizontal plank above and below

Rather than doing geometric intersection, we compute joints from the **tree structure** — walking the recursive model to know which plank connects where.

## UI Changes

### Properties Form (`src/ui/form.js`)

Add 4 input fields in the root properties section, below thickness:

```
┌─ Furniture Dimensions ────────────┐
│ Name:      [My Furniture        ] │
│ Width:     [1000] mm              │
│ Height:    [2000] mm              │
│ Depth:     [300 ] mm              │
│ Thickness: [18  ] mm              │
├─ Assembly Dowels ─────────────────┤
│ Diameter:  [8   ] mm              │
│ Depth:     [15  ] mm              │
│ Margin:    [50  ] mm              │
│ Spacing:   [200 ] mm              │
└───────────────────────────────────┘
```

### Piece SVG (`src/ui/piece-svg.js`)

Enhanced to draw holes on the plank rectangle:

- **Face holes**: Small circles (⊕ with crosshairs) drawn on the main rectangle face
- **End holes**: Small circles drawn on a thin strip representing the plank edge (shown as a side-view strip at the edge of the rectangle)
- **Dimension quotes**: 
  - Distance from edge to first hole
  - Spacing between holes
  - One label per face: `nX Ø8 ↧15` (count × diameter, depth)

### Cut List View (`src/ui/cutlist-view.js`)

Each card's SVG now includes the hole markings. The stat section also shows total hole count.

### Export Plan (`src/exporter.js`)

The per-part SVGs in the printable plan include hole positions and dimensions.

## i18n Additions

New keys for both `en` and `fr`:

```
'form.dowel.title': 'Assembly Dowels' / 'Tourillons d\'assemblage'
'form.dowel.diameter': 'Diameter' / 'Diamètre'
'form.dowel.depth': 'Depth' / 'Profondeur'
'form.dowel.margin': 'Edge Margin' / 'Marge au bord'
'form.dowel.spacing': 'Spacing' / 'Espacement'
'cutlist.holes': 'Holes' / 'Perçages'
```

## File Changes Summary

| File | Change |
|---|---|
| `src/model.js` | Add `dowelConfig` to `createFurniture()` default |
| `src/holes.js` | **[NEW]** Hole calculation engine |
| `src/planks.js` | Call hole calculation after plank generation |
| `src/ui/form.js` | Add dowel config inputs in root form |
| `src/ui/piece-svg.js` | Draw holes with crosshairs + quotes |
| `src/ui/cutlist-view.js` | Pass holes to SVG, add hole count stat |
| `src/exporter.js` | Include holes in exported plan SVGs |
| `src/i18n.js` | Add dowel-related translation keys |
| `src/utils.js` | Add `validateFurniture` migration for `dowelConfig` |

## Backward Compatibility

Old saved projects without `dowelConfig` get default values applied during `validateFurniture()` in `utils.js`. This is the existing migration pattern used for other properties.

## Verification Plan

### Automated
- Unit tests for `holes.js`: verify hole count and positions for known plank configurations
- Unit tests for edge cases: very small planks, single-compartment furniture

### Manual / Browser
- Visual verification of hole placement in cut list view SVGs
- Verify exported plan shows holes correctly
- Verify old projects load without errors (migration)
- Verify dowel config changes in the form update the drawings in real-time
