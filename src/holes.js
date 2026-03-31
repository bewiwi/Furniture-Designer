/**
 * holes.js — Assembly Hole Calculation Engine
 *
 * Computes dowel hole positions for each plank based on how planks
 * connect to each other (edge-based joint detection).
 *
 * Key insight: In flat-pack furniture, dowel holes are distributed along
 * the DEPTH dimension (the furniture's depth), not along the visible
 * front-view thickness. The front-view overlap is only used to determine
 * which planks share an edge and WHERE on each plank the joint occurs.
 *
 * The piece-svg draws planks as Length × Width rectangles where:
 *   - Length (x-axis) = longest dimension
 *   - Width (y-axis) = second longest dimension (usually furniture depth)
 *   - Thickness = smallest dimension (not visible in the drawing)
 *
 * Holes are placed:
 *   - x = position along the plank's Length axis (end position or contact point)
 *   - y = distributed along the plank's Width axis (depth)
 */

/**
 * Default dowel configuration.
 */
const DEFAULT_CONFIG = {
  diameter: 8,
  dowelLength: 30,
  edgeMargin: 50,
  spacing: 200,
};

/**
 * Distributes hole positions evenly along a given length.
 *
 * @param {number} length - Edge length available for holes
 * @param {number} edgeMargin - Distance from edge to first/last hole
 * @param {number} spacing - Maximum spacing between consecutive holes
 * @returns {number[]} Array of positions (mm from edge start)
 */
export function distributeHoles(length, edgeMargin, spacing) {
  if (length <= 0) return [];

  // If edge is too small for even one margin on each side, place one centered hole
  if (length < edgeMargin * 2) {
    return [length / 2];
  }

  // Prevent infinite loops if spacing is 0 or negative
  const safeSpacing = Math.max(10, spacing || 200);

  const usable = length - 2 * edgeMargin;

  if (usable <= 0) {
    return [length / 2];
  }

  // Calculate number of holes: at least 2 (one near each end)
  const count = Math.max(2, Math.floor(usable / safeSpacing) + 1);

  // Distribute evenly within the usable range
  const positions = [];
  if (count === 1) {
    positions.push(length / 2);
  } else {
    const actualSpacing = usable / (count - 1);
    for (let i = 0; i < count; i++) {
      positions.push(Math.round((edgeMargin + i * actualSpacing) * 10) / 10);
    }
  }

  return positions;
}

/**
 * Computes holes for all planks based on adjacency analysis.
 *
 * @param {Object[]} planks - Array of plank objects from generatePlanks()
 * @param {Object} dowelConfig - { diameter, depth, edgeMargin, spacing }
 * @returns {Map<string, Object[]>} Map of plank.id → holes array
 */
export function computeHoles(planks, dowelConfig = DEFAULT_CONFIG) {
  const { diameter, dowelLength, edgeMargin, spacing } = dowelConfig;
  const standardDowelLength = dowelLength || 30; // fallback
  const holesMap = new Map();

  for (const p of planks) {
    holesMap.set(p.id, []);
  }

  const TOL = 1; // tolerance for edge alignment (mm)

  for (let i = 0; i < planks.length; i++) {
    for (let j = i + 1; j < planks.length; j++) {
      const a = planks[i];
      const b = planks[j];

      const joint = detectJoint(a, b, TOL);
      if (!joint) continue;

      // Distribute holes along the DEPTH of the joint (not the front-view overlap)
      const jointDepth = Math.min(a.d, b.d);
      const depthPositions = distributeHoles(jointDepth, edgeMargin, spacing);
      if (depthPositions.length === 0) continue;

      const thicknessA = Math.min(a.w, a.h);
      const thicknessB = Math.min(b.w, b.h);
      
      const faceDepthA = Math.max(5, Math.min(Math.floor(standardDowelLength / 2), thicknessA - 3));
      const faceDepthB = Math.max(5, Math.min(Math.floor(standardDowelLength / 2), thicknessB - 3));

      let depthA, depthB;
      
      if (joint.isFaceA && joint.isFaceB) {
        // Face to face (unusual, but split evenly)
        depthA = faceDepthA;
        depthB = faceDepthB;
      } else if (joint.isFaceA && !joint.isFaceB) {
        // A is Face, B is Edge
        depthA = faceDepthA;
        depthB = standardDowelLength - faceDepthA + 1;
      } else if (!joint.isFaceA && joint.isFaceB) {
        // A is Edge, B is Face
        depthB = faceDepthB;
        depthA = standardDowelLength - faceDepthB + 1;
      } else {
        // Edge to Edge (split evenly)
        depthA = Math.floor(standardDowelLength / 2);
        depthB = Math.floor(standardDowelLength / 2);
      }

      // Create holes on both planks
      for (const depthPos of depthPositions) {
        holesMap.get(a.id).push({
          face: joint.faceA,
          isFace: joint.isFaceA,
          // Position along the plank's front-view axis where joint occurs
          contactPos: joint.contactPosA,
          // Position along the depth axis
          depthPos,
          diameter,
          depth: depthA,
        });

        holesMap.get(b.id).push({
          face: joint.faceB,
          isFace: joint.isFaceB,
          contactPos: joint.contactPosB,
          depthPos,
          diameter,
          depth: depthB,
        });
      }
    }
  }

  // Post-processing: detect opposing-face collisions on the same board.
  // If a board has face holes on both sides at the same (contactPos, depthPos),
  // reduce drilling depth so they don't physically collide inside the panel.
  for (const p of planks) {
    const holes = holesMap.get(p.id);
    if (!holes || holes.length === 0) continue;

    const thickness = Math.min(p.w, p.h);

    // Group face holes by opposing pairs
    const faceHolesByPos = new Map(); // key: "contactPos|depthPos" → { faces: Set }
    for (const h of holes) {
      if (!h.isFace) continue;
      const key = `${h.contactPos}|${h.depthPos}`;
      if (!faceHolesByPos.has(key)) {
        faceHolesByPos.set(key, { faces: new Set(), holes: [] });
      }
      faceHolesByPos.get(key).faces.add(h.face);
      faceHolesByPos.get(key).holes.push(h);
    }

    // If any position has holes on opposing faces, cap depth
    for (const [, entry] of faceHolesByPos) {
      const hasOpposing =
        (entry.faces.has('left') && entry.faces.has('right')) ||
        (entry.faces.has('top') && entry.faces.has('bottom'));
      if (hasOpposing) {
        const safeDepth = Math.max(5, Math.floor(thickness / 2) - 1);
        for (const h of entry.holes) {
          h.depth = safeDepth;
        }
      }
    }
  }

  return holesMap;
}

/**
 * Detects if two planks share a joint edge.
 *
 * Returns joint info including which face, and where on each plank
 * the contact point is (relative to the plank's own coordinate system).
 *
 * @param {Object} a - First plank { x, y, w, h, d }
 * @param {Object} b - Second plank
 * @param {number} tol - Position tolerance
 * @returns {Object|null} Joint descriptor or null
 */
function detectJoint(a, b, tol) {
  const isVertA = a.h > a.w;
  const isVertB = b.h > b.w;
  
  // Case 1: a's right edge touches b's left edge (horizontal adjacency)
  if (Math.abs((a.x + a.w) - b.x) < tol) {
    const overlap = getOverlap(a.y, a.y + a.h, b.y, b.y + b.h);
    if (overlap && overlap.length > 0) {
      return {
        faceA: 'right',
        faceB: 'left',
        isFaceA: isVertA,
        isFaceB: isVertB,
        // Contact position = midpoint of overlap relative to plank A's bottom edge
        contactPosA: overlap.midRelA,
        contactPosB: overlap.midRelB,
      };
    }
  }

  // Case 2: b's right edge touches a's left edge
  if (Math.abs((b.x + b.w) - a.x) < tol) {
    const overlap = getOverlap(a.y, a.y + a.h, b.y, b.y + b.h);
    if (overlap && overlap.length > 0) {
      return {
        faceA: 'left',
        faceB: 'right',
        isFaceA: isVertA,
        isFaceB: isVertB,
        contactPosA: overlap.midRelA,
        contactPosB: overlap.midRelB,
      };
    }
  }

  // Case 3: a's top edge touches b's bottom edge (vertical adjacency)
  if (Math.abs((a.y + a.h) - b.y) < tol) {
    const overlap = getOverlap(a.x, a.x + a.w, b.x, b.x + b.w);
    if (overlap && overlap.length > 0) {
      return {
        faceA: 'bottom',
        faceB: 'top',
        isFaceA: !isVertA,
        isFaceB: !isVertB,
        contactPosA: overlap.midRelA,
        contactPosB: overlap.midRelB,
      };
    }
  }

  // Case 4: b's top edge touches a's bottom edge
  if (Math.abs((b.y + b.h) - a.y) < tol) {
    const overlap = getOverlap(a.x, a.x + a.w, b.x, b.x + b.w);
    if (overlap && overlap.length > 0) {
      return {
        faceA: 'top',
        faceB: 'bottom',
        isFaceA: !isVertA,
        isFaceB: !isVertB,
        contactPosA: overlap.midRelA,
        contactPosB: overlap.midRelB,
      };
    }
  }

  return null;
}

/**
 * Computes the overlap between two 1D ranges.
 *
 * @returns {Object|null} { length, midRelA, midRelB } or null
 */
function getOverlap(a1, a2, b1, b2) {
  const start = Math.max(a1, b1);
  const end = Math.min(a2, b2);
  const length = end - start;

  if (length <= 0) return null;

  const mid = (start + end) / 2;

  return {
    length,
    midRelA: mid - a1,   // Midpoint of overlap relative to range A start
    midRelB: mid - b1,   // Midpoint of overlap relative to range B start
  };
}

/**
 * Converts raw hole data into plank-local SVG coordinates.
 *
 * The piece-svg draws planks as Length × Width rectangles where:
 *   Length (x-axis) = longest dimension
 *   Width (y-axis) = second longest dimension (typically depth)
 *
 * @param {Object} plank - The plank object { w, h, d }
 * @param {Object[]} holes - Raw holes from computeHoles
 * @returns {Object[]} Holes with { x, y, face, diameter, depth } in SVG coords
 */
export function mapHolesToPlankLocal(plank, holes) {
  if (!holes || holes.length === 0) return [];

  // Sort dimensions: Length > Width > Thickness
  const dims = [plank.w, plank.h, plank.d].sort((a, b) => b - a);
  const plankLength = dims[0];
  const plankWidth = dims[1]; // This is usually the furniture depth

  // Determine which physical axis corresponds to the SVG Length axis
  const isHorizontal = plank.w >= plank.h; // horizontal plank: w is along Length

  return holes.map(hole => {
    let x, y;

    // Y-axis on SVG = depth position (this is always along the depth)
    y = hole.depthPos;

    // X-axis on SVG depends on which face the hole is on
    if (isHorizontal) {
      // Horizontal plank (e.g., rail/shelf): w >= h
      // SVG x-axis = plank width direction (w), SVG y-axis = depth (d)
      switch (hole.face) {
        case 'left':
          x = 0; // drilled into the left end
          break;
        case 'right':
          x = plankLength; // drilled into the right end
          break;
        case 'top':
        case 'bottom':
          // Face/edge hole — contactPos is relative to the plank's X origin
          // in front view, which maps directly to SVG x
          x = hole.contactPos;
          break;
        default:
          x = 0;
      }
    } else {
      // Vertical plank (e.g., upright/separator): h > w
      // The SVG draws it lying on its side: Length=h along x-axis
      switch (hole.face) {
        case 'bottom':
          x = 0; // drilled into the bottom end
          break;
        case 'top':
          x = plankLength; // drilled into the top end
          break;
        case 'left':
        case 'right':
          // Face/edge hole — contactPos is relative to the plank's Y origin
          // which maps to SVG x-axis (since plank is rotated to lie horizontally)
          x = hole.contactPos;
          break;
        default:
          x = 0;
      }
    }

    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      face: hole.face,
      diameter: hole.diameter,
      depth: hole.depth,
    };
  });
}
