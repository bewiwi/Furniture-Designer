# Assembly Holes Unfolded View Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Enhance the SVGs in the Cut List to display an unfolded box (main face + 4 edges) and automatically compute safe hole depths using Dowel Length.

**Architecture:** 
1. `form.js` and `utils.js` (validation) will replace the `depth` setting with `dowelLength`.
2. `holes.js` will be updated so `detectJoint` identifies if each hole penetrates a face or an edge. It will automatically calculate `faceDepth` (max: thickness - 3mm) and `edgeDepth` (dowelLength - faceDepth + 1).
3. `piece-svg.js` will render 5 distinct SVG areas (Main face, Top edge, Bottom edge, Left edge, Right edge) and distribute the holes onto the exact plane they belong to.

**Tech Stack:** Vanilla JS, SVG DOM strings, Vitest.

---

### Task 1: Migrate Dowel Configuration

**Files:**
- Modify: `src/utils.js`
- Modify: `src/ui/form.js`
- Test: `src/model.test.js`

**Step 1: Write the failing test**

```javascript
// Add to src/model.test.js
import { validateFurniture } from './utils.js';

describe('dowelConfig migration', () => {
  it('migrates older depth to dowelLength', () => {
    const data = { width: 100, height: 100, depth: 100, thickness: 18, root: { id: 'root', children: [] }, dowelConfig: { depth: 15 } };
    const validated = validateFurniture(data);
    expect(validated.dowelConfig.dowelLength).toBeDefined();
    expect(validated.dowelConfig.depth).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/model.test.js`
Expected: FAIL, `dowelLength` is undefined.

**Step 3: Write minimal implementation**
In `src/utils.js`:
- In `validateFurniture`, replace references to `depth` with `dowelLength`, assigning a default of `30` if missing or converting previous `depth * 2`. Delete `depth` from `dowelConfig`.
In `src/ui/form.js`:
- Update the UI input field labels from "Profondeur" to "Longueur du tourillon".
- Map the input `dowelConfig.dowelLength`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/model.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/utils.js src/ui/form.js src/model.test.js
git commit -m "feat: migrate dowel hole depth to total dowel length"
```

---

### Task 2: Hole Calculation Engine Update

**Files:**
- Modify: `src/holes.js`
- Modify: `src/holes.test.js`

**Step 1: Write the failing test**

```javascript
// Add to src/holes.test.js
it('calculates face and edge depth correctly preventing pierce-through', () => {
  // Test logic for two planks of different orientations...
  // assert hole.isFace === true / false
  // assert hole.depth is calculated accurately
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run src/holes.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**
In `holes.js`:
- `detectJoint()` must now return `{ faceA, faceB, isFaceA, isFaceB, ... }` dynamically assessing the relative orientation. 
  - If a horizontal plank touches a vertical plank, the horizontal plank's Left/Right are edges (`!isFace`), the vertical plank's contact points are on its main face (`isFace`).
- `computeHoles()`: Use the plank thickness and `dowelLength`.
  - Check `isFace`: if `true`, drill `Math.min(dowelLength/2, plank.thickness - 3)`.
  - Check `isEdge`: drill `dowelLength - otherPlankFaceDepth + 1`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run src/holes.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/holes.js src/holes.test.js
git commit -m "feat: smart face vs edge depth calculation"
```

---

### Task 3: Unfolded SVG Generation

**Files:**
- Modify: `src/ui/piece-svg.js`

**Step 1: Write minimal implementation**
In `src/ui/piece-svg.js` `generatePieceSvg()`:
- Redefine bounding box mathematics: Give `padding` for 4 edges.
- Draw Main Rectangle (L x W).
- Draw Top Rectangle (L x Thickness), Left Rectangle (Thickness x W), etc.
- In `mapHolesToPlankLocal(plank, holes)`, read `hole.isFace`. If true, map to main coordinates. If false, map coordinates onto the respective Unfolded Edge coordinate space.
- Modify annotation drawing loop to draw quotas safely relative to each sub-rectangle.

**Step 2: Verify visually using Browser Testing**
- Load the app at `http://localhost:5178/`.
- Switch to Cut List.
- Validate visually.

**Step 3: Commit**
```bash
git add src/ui/piece-svg.js
git commit -m "feat: render unfolded drafting view for planks"
```
