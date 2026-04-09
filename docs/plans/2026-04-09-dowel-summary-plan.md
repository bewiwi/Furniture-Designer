# Dowel Cutlist Summary Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Calculate the total number of required assembly dowels (tourillons) by halving the sum of all hole instances in the cutlist planks, resulting in a single summary stats line at the footer of the cutlist.

**Architecture:** Use `Array.prototype.reduce` within `generateCutListHtml` to sum all instances of `p.holes?.length` on the `planks` array, then divide by 2. Add English and French translations.

**Tech Stack:** Vanilla JS, i18n dictionary.

---

### Task 1: Add i18n Translations

**Files:**
- Modify: `src/i18n.js`

**Step 1: Write the failing test**

We don't strictly test translation keys mathematically, but we'll add the strings reliably.

**Step 2: Write minimal implementation**

Add `cutlist.total_dowels` string under the `// Cutlist` section.

```javascript
// Add to English dictionary inside cutlist block (~line 197)
'cutlist.total_dowels': '{count} assembly dowels needed',

// Add to French dictionary inside cutlist block (~line 369)
'cutlist.total_dowels': '{count} tourillons d\\'assemblage nécessaires',
```

**Step 3: Run test to verify app doesn't break**

Run: `npm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/i18n.js
git commit -m "feat(i18n): add key for total dowels summary in cutlist"
```

### Task 2: Calculate and Display Dowels in Cutlist HTML

**Files:**
- Modify: `src/ui/cutlist.js`

**Step 1: Write the failing test**

There isn't a direct unit test suite for the UI `cutlist.js` HTML string generator in this repo since it relies heavily on native DOM and string output matching, but we'll manually verify rendering.

**Step 2: Write minimal implementation**

Calculate the total dowels before the return statement inside `generateCutListHtml` around line 39:

```javascript
  const totalHoles = planks.reduce((sum, p) => sum + (p.holes?.length || 0), 0);
  const totalDowels = Math.floor(totalHoles / 2);
```

Then display it in the footer returned by `generateCutListHtml` around line 97:

```javascript
    <div class="cut-list-footer">
      <div class="stats">
        <strong>${t('cutlist.total_area', { area: totalArea.toFixed(2) })}</strong>
        ${totalDowels > 0 ? `<span> • ${t('cutlist.total_dowels', { count: totalDowels })}</span>` : ''}
      </div>
    </div>
```

**Step 3: Run test to verify it passes unit compilation**

Run: `npm test`
Expected: PASS

**Step 4: Commit**

```bash
git add src/ui/cutlist.js
git commit -m "feat(ui): calculate and render total dowels in cutlist footer"
```
