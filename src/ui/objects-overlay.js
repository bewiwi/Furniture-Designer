/**
 * objects-overlay.js — Projects physical objects with perspective-correct CSS onto the 3D scene.
 *
 * Uses a CSS matrix3d homography to distort each SVG so that it appears to sit
 * physically inside the compartment, tracking the camera in real time.
 */

import { getNodeDimensions } from '../model.js';
import { OBJECT_CATALOG } from '../objects.js';

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

/**
 * Solves an n×n linear system Ax = b using Gaussian elimination with partial
 * pivoting. Returns the solution vector x, or null if the matrix is singular.
 */
function gaussianElimination(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    if (Math.abs(M[col][col]) < 1e-10) return null; // singular

    // Eliminate
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/**
 * Computes the CSS matrix3d string that maps a srcW × srcH rectangle (at the
 * top-left of the element) to an arbitrary screen-space quadrilateral.
 *
 * dst corners order: [TL, TR, BR, BL], each {x, y} in screen pixels.
 *
 * The 3×3 homography H is embedded into a column-major CSS 4×4 matrix as:
 *   | a  b  0  c |
 *   | d  e  0  f |
 *   | 0  0  1  0 |
 *   | g  h  0  1 |
 */
function computeMatrix3d(srcW, srcH, dst) {
  const src = [
    [0,    0],
    [srcW, 0],
    [srcW, srcH],
    [0,    srcH],
  ];

  const A = [];
  const b = [];

  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i];
    const { x, y } = dst[i];
    A.push([u, v, 1, 0, 0, 0, -x * u, -x * v]);
    A.push([0, 0, 0, u, v, 1, -y * u, -y * v]);
    b.push(x);
    b.push(y);
  }

  const h = gaussianElimination(A, b);
  if (!h) return null;

  const [a, bC, c, d, e, f, g, hC] = h;
  // Column-major CSS matrix3d embedding of 3×3 homography:
  return `matrix3d(${a},${d},0,${g},${bC},${e},0,${hC},0,0,1,0,${c},${f},0,1)`;
}

/**
 * Returns the signed area of a polygon (array of {x,y}) using the shoelace
 * formula in screen-space (Y down). Positive = front-facing (CW on screen).
 */
function signedArea(pts) {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return area / 2;
}

/**
 * Extracts [vw, vh] from "viewBox='x y w h'" attribute in an SVG string.
 * Returns [100, 100] as a safe fallback.
 */
function parseViewBox(svgStr) {
  const m = svgStr.match(/viewBox="[^"]*?\s([0-9.]+)\s([0-9.]+)"/);
  return m ? [parseFloat(m[1]), parseFloat(m[2])] : [100, 100];
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Renders SVG placeholders perspective-correctly onto the 3D scene, once per
 * render frame via the viewer's onRender callback.
 *
 * @param {Object}   furniture     - Full furniture model
 * @param {Function} project3DTo2D - (x,y,z) => {x,y} | null
 */
export function renderObjectsOverlay(furniture, project3DTo2D) {
  let layer = document.getElementById('objects-overlay-layer');
  if (!layer) {
    const viewerPanel = document.getElementById('viewer-panel');
    if (!viewerPanel) return;
    layer = document.createElement('div');
    layer.id = 'objects-overlay-layer';
    Object.assign(layer.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', overflow: 'hidden',
    });
    viewerPanel.appendChild(layer);
  }

  layer.innerHTML = '';

  const T = furniture.thickness;

  function walk(node) {
    if (node.objects && node.objects.length > 0) {
      const dims = getNodeDimensions(furniture, node.id);
      if (!dims) return;

      node.objects.forEach(obj => {
        const catItem = OBJECT_CATALOG.find(c => c.id === obj.id);
        if (!catItem) return;

        // --- Horizontal centre of object in furniture space ---
        let xCenter = dims.x + dims.w / 2;
        if (obj.align === 'left')  xCenter = dims.x + catItem.w / 2;
        if (obj.align === 'right') xCenter = dims.x + dims.w - catItem.w / 2;

        const xL = xCenter - catItem.w / 2;
        const xR = xCenter + catItem.w / 2;
        const yBot = dims.y;               // floor of compartment
        const yTop = dims.y + catItem.h;   // top of object
        const zFace = T + catItem.d;       // front face of object (toward viewer)

        // Project 4 corners of the front face: TL, TR, BR, BL
        const dst = [
          project3DTo2D(xL, yTop,  zFace),  // TL
          project3DTo2D(xR, yTop,  zFace),  // TR
          project3DTo2D(xR, yBot,  zFace),  // BR
          project3DTo2D(xL, yBot,  zFace),  // BL
        ];
        if (dst.some(p => !p)) return; // any corner behind camera

        // Face culling: hide if back-facing (signedArea ≤ 0 in screen space)
        if (signedArea(dst) <= 0) return;

        // Source rect derives from SVG viewBox to preserve its proportions
        const [srcW, srcH] = parseViewBox(catItem.svg);
        const matrix = computeMatrix3d(srcW, srcH, dst);
        if (!matrix) return;

        const objDiv = document.createElement('div');
        Object.assign(objDiv.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width:  srcW + 'px',
          height: srcH + 'px',
          transformOrigin: '0 0',
          transform: matrix,
          overflow: 'hidden',
        });

        objDiv.innerHTML = catItem.svg;

        const svgEl = objDiv.querySelector('svg');
        if (svgEl) {
          svgEl.style.width  = '100%';
          svgEl.style.height = '100%';
          svgEl.setAttribute('preserveAspectRatio', 'none');
        }

        layer.appendChild(objDiv);
      });
    }

    if (node.children) node.children.forEach(walk);
  }

  walk(furniture.root);
}
