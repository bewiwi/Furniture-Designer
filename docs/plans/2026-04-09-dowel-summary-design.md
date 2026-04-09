# Adding Dowel Count to Cutlist Summary

## Goal
Display the exact amount of assembly dowels (tourillons) required for the furniture project as a single summary line within the Cutlist view.

## Approach: Mathematical Inference
Instead of piping new variables entirely through the 3D data model and exporters, the Cutlist generator receives the finalized list of `planks`. Every connection explicitly injects `hole` configurations into the resulting geometry of these planks.

Because flat-pack assembly dictates that exactly one dowel joins exactly two holes across two adjoining panels, we can accurately discover the total number of dowels by summing all array items.

**Formula**: 
`Total Dowels = floor(Sum(p.holes.length for all p in planks) / 2)`

## Implementation Strategy
1. **i18n Translation Setup (`src/i18n.js`)**:
   - Add new dictionary pairs under the cutlist category.
   - EN: `'cutlist.total_dowels': '{count} assembly dowels needed'`
   - FR: `'cutlist.total_dowels': '{count} tourillons d\\'assemblage nécessaires'`

2. **Calculate Hardware Quantity (`src/ui/cutlist.js`)**:
   - Inside `generateCutListHtml()`, loop through the provided `planks` and sum `p.holes?.length`.
   - Divide by 2, dropping any remaining fraction just in case of an orphaned manual intersection.

3. **UI Display**:
   - Append the string into the `<div class="stats">` line within the existing `cut-list-footer` element.
   - It will render as a secondary stat next to the "Total Area" read-out on the Cutlist view.

## Roll-out
Since this adds summary math safely inside the UI generator, no `model.js` structure patches are required and backward-compatibility with saved files holds true.
