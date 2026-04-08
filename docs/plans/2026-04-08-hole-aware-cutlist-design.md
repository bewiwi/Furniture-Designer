# Design: Hole-Aware Cut List Sub-Grouping

## Overview
Currently, the furniture planks are grouped entirely by their physical dimensions (width x height x depth) and type. This causes a problem in the Full Cut List view where pieces with identical dimensions but varying drill hole configurations are grouped together under a single letter (e.g., "A"). 

The new goal is to introduce hole-aware sub-grouping specifically for the Full Cut List (generating "A:1", "A:2"), while keeping the other views (Panel Plan, Export, simple Sidebar Cutlist) grouped solely by physical dimensions exactly as they currently are.

## Component Architecture

### Data Layer (`src/planks.js`)
We will introduce a non-breaking optional flag to the `groupPlanks` function:
`export function groupPlanks(planks, options = { splitByHoles: false })`

1. **Hole Signature Helper:**
   A new `getHoleSignature(plank)` function will generate a unique string based on the exact arrangement of holes for a piece. 
   - It will serialize the array of `plank.holes` by sorting them predictably (by `face`, then `x`, then `y`).
   - If a plank has no holes, it returns `"no-holes"`.

2. **Grouping Behavior:**
   - If `splitByHoles` is false (default): The grouping key remains `${p.w}x${p.h}x${p.d}-${p.type}`. 
   - If `splitByHoles` is true: The grouping key becomes `${p.w}x${p.h}x${p.d}-${p.type}-${getHoleSignature(p)}`.

3. **Label Assignment Logic:**
   When allocating labels sequentially to the sorted groups, we will track the base dimension signature of the *previous* group.
   - **Dimension match:** If the physical dimensions and type are identical to the previous sorted item (meaning only the holes differ), we keep the *same base letter* but increment a secondary counter: producing "A:1", "A:2".
   - **Dimension change:** We move to the next letter (A -> B) and drop the secondary counter entirely if there's only 1 variation (just "B"). Or we can optionally always assign "B:1" if `splitByHoles` is true, to be consistent. We will use the consistent format of standard letter "A" if there are no variations, and "A:1", "A:2" only when variations within the group exist. Wait, the user specifically requested: "Name it with letter:number like A:1 A:2. if multiple panel has exact same size/hole keep it together with quantity number." To be straightforward, we may just always use `:1` if the flag is true.

### Presentation Layer (`src/ui/cutlist-view.js`)
- We simply pass `{ splitByHoles: true }` when calling `groupPlanks(planks, { splitByHoles: true })`.
- The presentation layer requires zero structural HTML changes because `g.label` will now natively contain the correctly computed label ("A", "B:1", "B:2", etc.) based on the new logic in `groupPlanks`.

## Testing
- Ensure the Panel Plan view and exporters are not affected.
- Modify `src/planks.test.js` to assert that pieces with different holes are split into separate letters with colon-subsets when the flag is passed.
