# Dowel Hole Collision, Symmetry & Inversion Fixes

Based on deep physical analysis of the dowel placement logic in `holes.js` and visual evidence from `test.json`, there are three critical real-world assembly bugs that would ruin the physical furniture assemblies.

## Root Cause Analysis

1. **The Inversion Bug (The Y-Axis Mirroring)**
   The mathematical calculation for resolving joint faces was written assuming a Cartesian coordinate system (where Y grows *up*), but the structural model uses vertical web coordinates (where Y grows *down*).
   - Because of this reversed logic, the application thinks that if piece A sits visually above piece B, A's *Top* edge touches B's *Bottom* edge. But it's exactly the opposite!
   - **Result**: ALL vertical uprights get their "top" dowel holes drilled into the floor end, and their "bottom" holes drilled into the ceiling end. ALL horizontal shelves get their top-face holes drilled into their bottom faces! The furniture physically cannot be assembled.

2. **Catastrophic Intersection (The Collision Bug)**
   When two horizontal shelves exist at the exact same height on opposite sides of a vertical separator (e.g., a "Left" shelf and a "Right" shelf), they both attach to the separator's left and right faces at the exact same coordinates ($y=50, y=250$, etc.).
   - The standard dowel logic drills 15mm deep into the face.
   - 15mm from the left + 15mm from the right = 30mm total bore depth.
   - Because standard panels are only 18mm or 20mm thick, the drill will break entirely through the board, and opposing dowels will crash into each other inside the hole.

3. **Dangerous Symmetry (The Backward Shelf Bug)**
   Currently, holes are distributed symmetrically along the depth (e.g., 50mm from the front, 50mm from the back). 
   - While mathematically elegant, this means a shelf can be installed backwards.
   - In real-world woodworking, installing a shelf backwards puts the raw, unbanded edge facing the front, ruining the aesthetic. Professional cabinet makers intentionally make hole placements asymmetric to guarantee pieces only fit in the correct orientation.

---

## Proposed Changes

We must fix the `computeHoles` engine in `src/holes.js`.

### 1. Fix: Correct the Top/Bottom Inversion
Reverse the Top/Bottom face assignment logic in `detectJoint` to correctly respect a Y-down coordinate system. 
- A's bottom edge (visually `a.y + a.h`) touching B's top edge (visually `b.y`) means `faceA = 'bottom'`, `faceB = 'top'`.

### 2. Fix: Introduce Left/Right Collision Staggering
To prevent dowels from colliding inside a shared vertical separator, we will vertically stagger (offset) the holes along the depth axis depending on which side of the joint they belong to.
- If a shelf attaches to the **Right Face** of an upright, its dowel positions get a `+0mm` offset (e.g., 37mm, 237mm).
- If a shelf attaches to the **Left Face** of an upright, its dowel positions get a `+32mm` offset (e.g., 69mm, 269mm).
- **Result**: Dowels physically bypass each other safely inside the 18mm board, even if the shelves are perfectly level with one another.

### 3. Fix: Introduce Asymmetric Hole Placements
Instead of placing holes relative to a single symmetric `edgeMargin`, we will introduce a forced, industry-standard asymmetry.
- Front Dowel: `37mm` from the front edge (following the System 32 cabinet standard).
- Back Dowel: Asymmetric distance from the back edge (calculated based on remaining length).

### Files to Modify

#### [MODIFY] `src/holes.js`
- Fix the Y-axis inversion blocks inside `detectJoint`.
- Update `distributeHoles(length, edgeMargin, spacing, staggeredOffset)` to handle the asymmetric `37mm` front edge and the new staggering offset.
- Update `computeHoles()` to pass `offset = 0` or `offset = 32` depending on whether `joint.faceA` or `joint.faceB` implies a left-sided vs right-sided connection.

#### [NEW] `src/test-collision.test.js`
- Introduce a Vitest script that programmatically guarantees no two left/right face holes on a vertical board ever share the exact same `(contactPos, depthPos)` coordinates to prevent regression.

---

## Open Questions

**This will change the visual positions of holes on the SVG cut list completely. The drawings will show asymmetric layouts, and Top/Bottom holes will literally swap ends.**

1. Do you prefer the industry standard `37mm` setback from the front edge for the first dowel, or should we keep a broader `50mm` margin and just offset one side to `82mm`?
2. Are you comfortable with this massive structural change to the dowel calculations?
