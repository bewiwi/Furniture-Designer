import { getNodeDimensions } from '../model.js';

/**
 * Calculates and renders SVG dimension quotes (lines + text) 
 * floating natively over the 3D canvas via 2D projection.
 *
 * @param {Object} furniture
 * @param {string} selectedId
 * @param {Function} project3DTo2D
 */
export function renderQuotes(furniture, selectedId, project3DTo2D) {
  const overlay = document.getElementById('quotes-overlay');
  if (!overlay) return;

  // Clear previous quotes, but keep the <defs> for marker arrows!
  const defs = overlay.querySelector('defs');
  overlay.innerHTML = '';
  if (defs) overlay.appendChild(defs);

  if (!furniture || !selectedId || !project3DTo2D) return;

  const dim = getNodeDimensions(furniture, selectedId);
  if (!dim) return;

  // We place quotes on the front face of the furniture, slightly popping forward
  const zFront = furniture.depth + 10;
  const T = furniture.thickness;

  // --- INNER QUOTES (Clear Opening of the selected compartment) ---
  // Leave a tiny gap 'T/2' from edges so arrow heads don't merge into the wood
  const gap = T / 2;
  
  // Position the width quote near the top, and height quote near the left to avoid text overlap
  const topY = dim.y + dim.h - Math.min(40, dim.h * 0.2);
  const leftX = dim.x + Math.min(40, dim.w * 0.2);

  const p1_w = [dim.x + gap, topY, zFront];
  const p2_w = [dim.x + dim.w - gap, topY, zFront];

  const p1_h = [leftX, dim.y + gap, zFront];
  const p2_h = [leftX, dim.y + dim.h - gap, zFront];

  drawQuote(overlay, p1_w, p2_w, project3DTo2D, dim.w);
  drawQuote(overlay, p1_h, p2_h, project3DTo2D, dim.h);

  // --- OUTER QUOTES (Overall dimension of the item) ---
  // If the root is selected, we also show the global external dimensions
  const isRoot = selectedId === furniture.root.id;
  if (isRoot) {
    // Width Quote (50mm below the furniture)
    const p1_out_w = [0, -50, zFront];
    const p2_out_w = [furniture.width, -50, zFront];
    drawQuote(overlay, p1_out_w, p2_out_w, project3DTo2D, furniture.width);

    // Height Quote (50mm left of the furniture)
    const p1_out_h = [-50, 0, zFront];
    const p2_out_h = [-50, furniture.height, zFront];
    drawQuote(overlay, p1_out_h, p2_out_h, project3DTo2D, furniture.height);
  }
}

/**
 * Connects two 3D points with an SVG line and adds text in the middle.
 */
function drawQuote(svg, p1_3d, p2_3d, project3DTo2D, value) {
  if (value <= 20) return; // Hide dimension lines for extremely tiny spaces (they clutter)

  const sc1 = project3DTo2D(p1_3d[0], p1_3d[1], p1_3d[2]);
  const sc2 = project3DTo2D(p2_3d[0], p2_3d[1], p2_3d[2]);

  // If points are behind the camera entirely, skip drawing them
  if (!sc1 || !sc2) return;

  // SVG Line
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', sc1.x);
  line.setAttribute('y1', sc1.y);
  line.setAttribute('x2', sc2.x);
  line.setAttribute('y2', sc2.y);
  line.setAttribute('class', 'quote-line');
  svg.appendChild(line);

  // SVG Text (at midpoint)
  const tX = (sc1.x + sc2.x) / 2;
  const tY = (sc1.y + sc2.y) / 2;
  
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', tX);
  text.setAttribute('y', tY - 8); // Slightly offset so it doesn't cross the line directly
  text.setAttribute('class', 'quote-text');
  text.textContent = `${Math.round(value)} mm`;
  
  svg.appendChild(text);
}
