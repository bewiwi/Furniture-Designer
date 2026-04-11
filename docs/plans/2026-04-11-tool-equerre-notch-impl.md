# Face Guide V-Notch Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Add a V-shaped notch completely traversing the outer angle of the face guide (équerre), pointing exactly to its center line (y=30) to allow precise alignment with a pencil mark.

**Architecture:** 
We will use `@jscad/modeling` inside `src/tools.js` to create the V-notch. 
By placing a rotated cuboid (diamond shape) centered at the internal angle (`x = vertThickness, z = -horizThickness`) and at the middle `y = width / 2`, we will subtract it from the `toolBody`.
A cuboid rotated 45° around the X axis and translated to `y = width / 2` will form a V pointing towards that center. 

**Tech Stack:** JavaScript, @jscad/modeling

---

### Task 1: Update SVG Preview for the Face Guide

**Files:**
- Modify: `src/ui/tools-view.js`

**Step 1: Write minimal implementation**
We will update the `generateFaceGuideSVG` to visually hint at the central notch. This is a nice-to-have visual cue in the UI that the 3D model will have a notch.
Instead of a simple L path, we'll just add a small triangle/arrow annotation pointing to the corner.

### Task 2: Implement the V-Notch in 3D Geometry

**Files:**
- Modify: `src/tools.js`

**Step 1: Write minimal implementation**
Add `rotateY` to the jscad transforms import:
```javascript
const { translate, rotateX, rotateY, rotateZ } = jscadModeling.transforms;
```

Inside `createFaceGuideGeometry`, create a V-notch cutter shape right after `cutout` and `hole`:
```javascript
  // Create a V-Notch cutter at the internal corner
  // The internal corner touches the wood at: X = vertThickness, Z = -horizThickness
  // The center is at Y = width / 2
  const notchSize = 12; // Controls the size of the notch
  let vNotchCutter = cuboid({
    size: [notchSize, notchSize, notchSize],
    center: [0, 0, 0]
  });
  
  // Rotate around X to form a V pointing to the middle in the Y direction
  vNotchCutter = rotateX(Math.PI / 4, vNotchCutter);
  
  // Position it exactly at the inner corner and the middle of the tool
  vNotchCutter = translate([vertThickness, width / 2, -horizThickness], vNotchCutter);

  // Subtract the notch from the toolBody
  toolBody = subtract(toolBody, cutout);
  toolBody = subtract(toolBody, vNotchCutter); // Note: must be done before creating the final 'guide'
  let guide = subtract(toolBody, hole);
```

**Step 2: Commit**
```bash
git add src/tools.js src/ui/tools-view.js
git commit -m "feat(tools): add V-notch to face guide for pencil mark alignment"
```
