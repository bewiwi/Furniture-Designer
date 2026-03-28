/**
 * model.js — Furniture Data Model
 *
 * Recursive structure of compartments.
 * A furniture item is defined by its global dimensions + a tree of nodes.
 * Each node can be subdivided into rows (horizontal) or columns (vertical).
 */

let idCounter = 0;

/**
 * Generates a unique ID for nodes
 */
export function generateId() {
  return `node-${Date.now()}-${idCounter++}`;
}

/**
 * Creates a leaf node (unsubdivided compartment)
 */
export function createNode() {
  return {
    id: generateId(),
    direction: null, // null = leaf, "row" = rows, "col" = columns
    children: [],
    sizes: [],       // size in mm for each child
  };
}

/**
 * Creates a furniture project with global dimensions and an empty root compartment
 */
export function createFurniture(name = 'My Furniture', width = 1000, height = 2000, depth = 300, thickness = 18) {
  return {
    id: generateId(),
    name,
    width,
    height,
    depth,
    thickness,
    root: createNode(),
  };
}

/**
 * Subdivides a node into `count` equal parts in the given direction.
 *
 * @param {Object} node - The node to subdivide
 * @param {string} direction - "row" (horizontal rows) or "col" (vertical columns)
 * @param {number} count - Number of subdivisions (2 to 20)
 * @param {number} availableSpace - Available space in mm in the subdivision direction
 * @param {number} thickness - Plank thickness in mm
 */
export function subdivide(node, direction, count, availableSpace, thickness) {
  if (count < 2 || count > 20) {
    throw new Error('Number of subdivisions must be between 2 and 20');
  }

  const separatorCount = count - 1;
  const usableSpace = availableSpace - (separatorCount * thickness);

  if (usableSpace <= 0) {
    throw new Error("Not enough space for this subdivision");
  }

  const equalSize = Math.floor(usableSpace / count);
  const remainder = usableSpace - (equalSize * count);

  node.direction = direction;
  node.children = [];
  node.sizes = [];

  for (let i = 0; i < count; i++) {
    node.children.push(createNode());
    // Remainder is added to the last child
    node.sizes.push(i === count - 1 ? equalSize + remainder : equalSize);
  }
}

/**
 * Removes subdivisions from a node (turns it back into a leaf)
 */
export function removeSubdivision(node) {
  node.direction = null;
  node.children = [];
  node.sizes = [];
}

/**
 * Resizes a child. The next neighbor is adjusted to keep the total dimension.
 * If it's the last child, the previous neighbor is adjusted.
 *
 * @param {Object} node - The parent node
 * @param {number} childIndex - Index of the child to resize
 * @param {number} newSize - New size in mm
 */
export function resizeChild(node, childIndex, newSize) {
  if (!node.sizes || childIndex < 0 || childIndex >= node.sizes.length) {
    throw new Error('Invalid child index');
  }

  const oldSize = node.sizes[childIndex];
  const delta = newSize - oldSize;

  if (delta === 0) return;

  // Find neighbor to adjust
  const neighborIndex = childIndex < node.sizes.length - 1 ? childIndex + 1 : childIndex - 1;
  const neighborNewSize = node.sizes[neighborIndex] - delta;

  if (neighborNewSize < 1) {
    throw new Error('Neighboring compartment would be too small');
  }
  if (newSize < 1) {
    throw new Error('Size must be positive');
  }

  node.sizes[childIndex] = newSize;
  node.sizes[neighborIndex] = neighborNewSize;
}

/**
 * Calculates available space in a node for a given direction
 *
 * @param {number} totalDimension - Total dimension of the compartment in the subdivision direction
 * @param {number} childCount - Number of existing children
 * @param {number} thickness - Plank thickness
 */
export function getAvailableSpace(totalDimension, childCount, thickness) {
  const separators = Math.max(0, childCount - 1);
  return totalDimension - (separators * thickness);
}

/**
 * Deep clone of furniture (for undo/redo history)
 */
export function cloneFurniture(furniture) {
  return JSON.parse(JSON.stringify(furniture));
}

/**
 * Search for a node by its ID in the tree (depth-first search)
 *
 * @param {Object} node - Root node of the search
 * @param {string} id - Searched ID
 * @returns {Object|null} The found node or null
 */
export function findNodeById(node, id) {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/**
 * Returns the path (list of nodes) from root to target node.
 * Useful for calculating absolute dimensions of a compartment.
 *
 * @param {Object} node - Root node
 * @param {string} targetId - Target node ID
 * @returns {Object[]|null} Path to the node or null if not found
 */
export function getNodePath(node, targetId) {
  if (node.id === targetId) return [node];
  for (let i = 0; i < node.children.length; i++) {
    const path = getNodePath(node.children[i], targetId);
    if (path) return [{ node, childIndex: i }, ...path];
  }
  return null;
}

/**
 * Calculates absolute dimensions (x, y, w, h) of a node in the furniture.
 *
 * @param {Object} furniture - The complete furniture object
 * @param {string} nodeId - Node ID
 * @returns {{ x, y, w, h } | null}
 */
export function getNodeDimensions(furniture, nodeId) {
  if (furniture.root.id === nodeId) {
    return {
      x: furniture.thickness,
      y: furniture.thickness,
      w: furniture.width - 2 * furniture.thickness,
      h: furniture.height - 2 * furniture.thickness,
    };
  }

  const path = getNodePath(furniture.root, nodeId);
  if (!path) return null;

  const T = furniture.thickness;
  let x = T;
  let y = T;
  let w = furniture.width - 2 * T;
  let h = furniture.height - 2 * T;

  // Traverse the path to accumulate offsets
  for (let p = 0; p < path.length - 1; p++) {
    const { node: parentNode, childIndex } = path[p];

    if (parentNode.direction === 'row') {
      // Vertically stacked rows: adjust y and h
      let offsetY = 0;
      for (let i = 0; i < childIndex; i++) {
        offsetY += parentNode.sizes[i] + T;
      }
      y += offsetY;
      h = parentNode.sizes[childIndex];
    } else if (parentNode.direction === 'col') {
      // Side-by-side columns: adjust x and w
      let offsetX = 0;
      for (let i = 0; i < childIndex; i++) {
        offsetX += parentNode.sizes[i] + T;
      }
      x += offsetX;
      w = parentNode.sizes[childIndex];
    }
  }

  return { x, y, w, h };
}
