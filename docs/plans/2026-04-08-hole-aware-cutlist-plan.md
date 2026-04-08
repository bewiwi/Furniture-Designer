# Hole-Aware Cut List Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Modify the cutlist to group and visually separate planks of identical dimensions when they possess different assembly drill hole patterns.

**Architecture:** Introduce a non-breaking `splitByHoles` option to `groupPlanks()`. When true, serializes plank hole coords into string signatures. Uses these signatures to split up dimension-groups with secondary A:1, A:2 numbering labels. The UI merely passes the option flag and renders naturally.

**Tech Stack:** JavaScript (ES6+), Vanilla Web

---

### Task 1: Update the Planks Grouping Data Model

**Files:**
- Modify: `src/planks.js`

**Step 1: Write helper and update logic**

```javascript
// Add helper to src/planks.js
function getHoleSignature(plank) {
  if (!plank.holes || plank.holes.length === 0) return 'no-holes';
  
  // Create a copy to sort predictably
  const sortedHoles = [...plank.holes].sort((a, b) => {
    if (a.face !== b.face) return a.face.localeCompare(b.face);
    if (a.x !== b.x) return a.x - b.x;
    return a.y - b.y;
  });

  return sortedHoles.map(h => `${h.face}:${h.x},${h.y}`).join('|');
}
```

Update `groupPlanks(planks, options = { splitByHoles: false })` signature.
Update the dimension key logic:
```javascript
    let key = `${p.w}x${p.h}x${p.d}-${p.type}`;
    if (options.splitByHoles) {
      key += `-${getHoleSignature(p)}`;
    }
```

Update label assignment logic at the end of `groupPlanks` to track dimension signatures:
```javascript
  return Array.from(groups.values())
    .sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return b.w - a.w;
    })
    .map((g, index, arr) => {
      // Calculate continuous alphabetical sequence A, B, C for distinct dimensions
      let label = '';
      
      // Determine the dimension-only key of this group to check for dimension continuity
      const dimKey = `${g.w}x${g.h}x${g.d}-${g.type}`;
      g._dimKey = dimKey; // temporary storage for comparison
      
      // If we are at index 0, or this is a new dimension, increment base index
      if (index === 0) {
        g._baseIdx = 0;
        g._subIdx = 1;
      } else {
        const prev = arr[index - 1];
        if (prev._dimKey === dimKey) {
          g._baseIdx = prev._baseIdx;
          g._subIdx = prev._subIdx + 1;
        } else {
          g._baseIdx = prev._baseIdx + 1;
          g._subIdx = 1;
        }
      }

      // Convert base index to generic label A, B, C...
      let n = g._baseIdx;
      do {
        label = String.fromCharCode(65 + (n % 26)) + label;
        n = Math.floor(n / 26) - 1;
      } while (n >= 0);

      // Append subIdx natively if splitByHoles is true and there are variations (or unconditionally if requested)
      // For simplicity, if splitByHoles is true, we always format as A:1, A:2, B:1...
      if (options.splitByHoles) {
        label = `${label}:${g._subIdx}`;
      }
      
      delete g._dimKey;
      delete g._baseIdx;
      delete g._subIdx;

      return { ...g, label };
    });
```

**Step 2: Commit**

```bash
git add src/planks.js
git commit -m "feat(model): implement hole-aware grouping logic with splitByHoles option"
```

---

### Task 2: Pass Flag to Cutlist View UI

**Files:**
- Modify: `src/ui/cutlist-view.js`

**Step 1: Set option flag in renderFullCutList**

Find: `const grouped = groupPlanks(planks);`
Replace with: `const grouped = groupPlanks(planks, { splitByHoles: true });`

**Step 2: Commit**

```bash
git add src/ui/cutlist-view.js
git commit -m "feat(ui): toggle splitByHoles flag in full cutlist view page"
```

---

### Task 3: Unit Tests

**Files:**
- Modify: `src/planks.test.js`

**Step 1: Add new test to verify groupPlanks separation**

Add a test inside `groupPlanks` describe block mocking planks with the identical size but different holes:
```javascript
  it('groups identically sized panels with different holes separately when splitByHoles is true', () => {
    const planks = [
      { id: 1, w: 100, h: 50, d: 18, type: 'shelf', holes: [{ face: 'front', x: 10, y: 10 }] },
      { id: 2, w: 100, h: 50, d: 18, type: 'shelf', holes: [{ face: 'front', x: 20, y: 20 }] },
      { id: 3, w: 100, h: 50, d: 18, type: 'shelf', holes: [{ face: 'front', x: 10, y: 10 }] }, // matches 1
      { id: 4, w: 200, h: 50, d: 18, type: 'separator', holes: [] }
    ];
    
    const normalGroups = groupPlanks(planks);
    expect(normalGroups).toHaveLength(2); // Shelf (A) and Separator (B)
    
    const holeGroups = groupPlanks(planks, { splitByHoles: true });
    expect(holeGroups).toHaveLength(3); 
    
    // Validate labels
    const separatorLabel = holeGroups.find(g => g.type === 'separator').label;
    expect(separatorLabel.includes(':1')).toBe(true);
    
    const shelf1Label = holeGroups.find(g => g.count === 2).label;
    const shelf2Label = holeGroups.find(g => g.count === 1).label;
    expect(shelf1Label).not.toBe(shelf2Label);
    expect(shelf1Label[0]).toBe(shelf2Label[0]); // same base letter
  });
```

**Step 2: Verify test passes natively**

Run: `npm test`
Expected: Passes

**Step 3: Commit**

```bash
git add src/planks.test.js
git commit -m "test: add test confirming hole-aware grouping behavior functions properly"
```
