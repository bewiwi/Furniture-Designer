/**
 * planks.js — Generation of the Cut List
 *
 * Algorithm to convert the hierarchical model into a list of physical planks.
 * Calculates dimensions and absolute positions.
 */

/**
 * Generates the full list of planks for a furniture item.
 *
 * @param {Object} furniture - The complete furniture object
 * @returns {Object[]} List of plank objects { name, w, h, x, y, z, type }
 */
export function generatePlanks(furniture) {
  const { width, height, depth, thickness: T, root } = furniture;
  const planks = [];

  // --- External Frame ---
  // Vertical uprights (Left & Right)
  // Full height
  planks.push(createPlank('plank.left_upright', T, height, depth, 0, 0, 0, 'frameV'));
  planks.push(createPlank('plank.right_upright', T, height, depth, width - T, 0, 0, 'frameV'));

  // Horizontal rails (Top & Bottom)
  // Inside the uprights
  const innerWidth = width - 2 * T;
  planks.push(createPlank('plank.bottom_rail', innerWidth, T, depth, T, 0, 0, 'frameH'));
  planks.push(createPlank('plank.top_rail', innerWidth, T, depth, T, height - T, 0, 'frameH'));

  // --- Recursive internal partitions ---
  generateInner(root, T, T, innerWidth, height - 2 * T, depth, T, planks);

  return planks;
}

/**
 * Recursive function to generate internal planks
 *
 * @param {Object} node - Current node
 * @param {number} x - Absolute X position of the compartment
 * @param {number} y - Absolute Y position of the compartment
 * @param {number} w - Available width of the compartment
 * @param {number} h - Available height of the compartment
 * @param {number} d - Depth
 * @param {number} T - Thickness
 * @param {Object[]} planks - Plank array to populate
 * @param {string} path - Recursive path string
 */
function generateInner(node, x, y, w, h, d, T, planks, path = '1') {
  if (!node.direction || !node.children.length) return;

  const count = node.children.length;

  if (node.direction === 'row') {
    // Horizontal subdivisions (rows stacked vertically)
    // Between each row, we add a shelf (full width of the compartment)
    let currentY = y;
    for (let i = 0; i < count; i++) {
      const childH = node.sizes[i];
      const childPath = `${path}.${i + 1}`;

      // Recurse into the sub-compartment
      generateInner(node.children[i], x, currentY, w, childH, d, T, planks, childPath);

      // Add a horizontal shelf if not the last child
      if (i < count - 1) {
        const shelfY = currentY + childH;
        planks.push(createPlank('plank.shelf', w, T, d, x, shelfY, 0, 'shelf', `${path}-${i + 1}`));
        currentY = shelfY + T;
      }
    }
  } else if (node.direction === 'col') {
    // Vertical subdivisions (columns side by side)
    // Between each column, we add a separator (full height of the compartment)
    let currentX = x;
    for (let i = 0; i < count; i++) {
      const childW = node.sizes[i];
      const childPath = `${path}.${i + 1}`;

      // Recurse into the sub-compartment
      generateInner(node.children[i], currentX, y, childW, h, d, T, planks, childPath);

      // Add a vertical separator if not the last child
      if (i < count - 1) {
        const separatorX = currentX + childW;
        planks.push(createPlank('plank.separator', T, h, d, separatorX, y, 0, 'separator', `${path}-${i + 1}`));
        currentX = separatorX + T;
      }
    }
  }
}

/**
 * Helper to create a plank object
 */
function createPlank(name, w, h, d, x, y, z, type, suffix = '') {
  return {
    name,
    suffix,
    w: Math.round(w * 10) / 10,
    h: Math.round(h * 10) / 10,
    d: Math.round(d * 10) / 10,
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    z: Math.round(z * 10) / 10,
    type,
    id: `plank-${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Groups identical planks for the cut list.
 * Identical means same dimensions (w, h, d) and type.
 *
 * @param {Object[]} planks - List of all planks
 * @returns {Object[]} Grouped list { name, w, h, d, type, count, totalArea }
 */
export function groupPlanks(planks) {
  const groups = new Map();

  for (const p of planks) {
    // Key based on dimensions and type
    const key = `${p.w}x${p.h}x${p.d}-${p.type}`;

    if (groups.has(key)) {
      const g = groups.get(key);
      g.count++;
      g.totalArea += (p.w * p.h) / 1000000;
    } else {
      // Clean name removes the suffix conceptually for grouping
      let cleanName = p.name;
      if (p.type === 'shelf') cleanName = 'plank.shelf';
      if (p.type === 'separator') cleanName = 'plank.separator';

      groups.set(key, {
        name: cleanName,
        suffix: p.suffix,
        w: p.w,
        h: p.h,
        d: p.d,
        type: p.type,
        count: 1,
        totalArea: (p.w * p.h) / 1000000,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => {
    // Sort by type then width
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return b.w - a.w;
  });
}
