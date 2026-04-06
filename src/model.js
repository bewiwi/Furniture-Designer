/**
 * model.js — Furniture Data Model
 *
 * Recursive structure of compartments.
 * A furniture item is defined by its global dimensions + a tree of nodes.
 * Each node can be subdivided into rows (horizontal) or columns (vertical).
 */

import { t } from './i18n.js';

/**
 * Generates a unique ID for nodes using crypto.randomUUID().
 * Globally unique across imports and sessions — no mutable counter needed.
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Creates a leaf node (unsubdivided compartment)
 */
export function createNode() {
  return {
    id: generateId(),
    name: '',
    direction: null, // null = leaf, "row" = rows, "col" = columns
    children: [], // recursive structure
    sizes: [],    // size in mm for each child
    locked: false, // UI layout preference
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
    dowelConfig: {
      diameter: 8,      // mm — dowel pin diameter
      depth: 15,        // mm — hole depth into each piece
      edgeMargin: 50,   // mm — distance from corner to first hole
      spacing: 200,     // mm — distance between consecutive holes
    },
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
    throw new Error(t('error.subdivisions_range'));
  }

  const separatorCount = count - 1;
  const usableSpace = availableSpace - (separatorCount * thickness);

  if (usableSpace <= 0) {
    throw new Error(t('error.not_enough_space'));
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
 * Removes a single child compartment from a subdivided node
 * and distributes its space to a neighbor.
 */
export function removeSingleChild(node, childIndex, thickness) {
  if (!node.sizes || childIndex < 0 || childIndex >= node.sizes.length) {
    throw new Error(t('error.invalid_child'));
  }

  // If only 2 children, removing one removes the subdivision altogether
  if (node.children.length === 2) {
    const survivingIndex = childIndex === 0 ? 1 : 0;
    const survivor = node.children[survivingIndex];
    
    // Parent inherently becomes the survivor (takes its direction, children, sizes)
    node.direction = survivor.direction;
    node.children = survivor.children;
    node.sizes = survivor.sizes;
    // We intentionally keep the parent's `id` and `name`!
    return;
  }

  // Find a neighbor to inherit the deleted child's space (prefer unlocked neighbors)
  let inheritIndex = -1;
  
  if (childIndex < node.sizes.length - 1 && !node.children[childIndex + 1].locked) {
    inheritIndex = childIndex + 1;
  } else if (childIndex > 0 && !node.children[childIndex - 1].locked) {
    inheritIndex = childIndex - 1;
  } else {
    // Search for any other unlocked child
    inheritIndex = node.children.findIndex((c, i) => i !== childIndex && !c.locked);
  }

  // Fallback if all other remaining children are locked
  if (inheritIndex === -1) {
    inheritIndex = childIndex < node.sizes.length - 1 ? childIndex + 1 : childIndex - 1;
  }

  const inheritSpace = node.sizes[childIndex] + thickness;
  node.sizes[inheritIndex] += inheritSpace;

  node.sizes.splice(childIndex, 1);
  node.children.splice(childIndex, 1);
}

/**
 * Appends a single new compartment to an already subdivided node.
 * Space is taken from the nearest unlocked neighbor that has enough space.
 *
 * @param {Object} node - The parent node (already subdivided)
 * @param {number} thickness - Plank thickness
 * @param {number} initialSize - Desired initial size in mm for the new child
 */
export function addSingleChild(node, thickness, initialSize = 100) {
  if (!node.direction) return; // Cannot add to a non-subdivided node

  const requiredSpace = initialSize + thickness;

  // Find a free neighbor that can safely give up requiredSpace
  // Scanning backwards (since we are appending at the end, it feels natural to steal from the bottom-most free space)
  let donorIndex = -1;
  for (let i = node.sizes.length - 1; i >= 0; i--) {
    if (!node.children[i].locked && node.sizes[i] > requiredSpace) {
      donorIndex = i;
      break;
    }
  }

  if (donorIndex === -1) {
    throw new Error(t('error.not_enough_space'));
  }

  // Deduct from donor
  node.sizes[donorIndex] -= requiredSpace;

  // Append new child
  node.children.push(createNode());
  node.sizes.push(initialSize);
}

/**
 * Reorders a child by moving it to a new index within the same parent.
 *
 * @param {Object} node - The parent node.
 * @param {number} oldIndex - Current index of the child.
 * @param {number} newIndex - Target index.
 */
export function reorderChild(node, oldIndex, newIndex) {
  if (!node.children || oldIndex < 0 || oldIndex >= node.children.length) {
    throw new Error('Invalid source index');
  }
  if (newIndex < 0 || newIndex >= node.children.length) {
    throw new Error('Invalid target index');
  }

  // Remove elements from the arrays
  const movedChild = node.children.splice(oldIndex, 1)[0];
  const movedSize = node.sizes.splice(oldIndex, 1)[0];

  // Insert them at the new index
  node.children.splice(newIndex, 0, movedChild);
  node.sizes.splice(newIndex, 0, movedSize);
}

/**
 * Toggles the 'locked' state of a child component.
 * Prevents locking the very last unlocked component.
 */
export function toggleChildLock(node, childIndex) {
  if (!node.children || childIndex < 0 || childIndex >= node.children.length) {
    throw new Error(t('error.invalid_child'));
  }

  const child = node.children[childIndex];
  const willLock = !child.locked;

  if (willLock) {
    let freeCount = 0;
    for (const c of node.children) {
      if (!c.locked) freeCount++;
    }
    // Cannot lock if it's the last free child
    // (At least one must remain free to absorb future resizes)
    if (freeCount <= 1) {
      throw new Error(t('error.last_free_child'));
    }
  }

  child.locked = willLock;
}

/**
 * Resizes a child.
 * The space delta is added/subtracted from the nearest unlocked neighbor.
 *
 * @param {Object} node - The parent node
 * @param {number} childIndex - Index of the child to resize
 * @param {number} newSize - New size in mm
 */
export function resizeChild(node, childIndex, newSize) {
  if (!node.sizes || childIndex < 0 || childIndex >= node.sizes.length) {
    throw new Error(t('error.invalid_child'));
  }

  const oldSize = node.sizes[childIndex];
  const delta = newSize - oldSize;

  if (delta === 0) return;

  // Find an unlocked neighbor to absorb the delta
  // First, look to the right
  let absorberIndex = -1;
  for (let i = childIndex + 1; i < node.sizes.length; i++) {
    if (!node.children[i].locked) {
      absorberIndex = i;
      break;
    }
  }

  // If none on the right, look to the left
  if (absorberIndex === -1) {
    for (let i = childIndex - 1; i >= 0; i--) {
      if (!node.children[i].locked) {
        absorberIndex = i;
        break;
      }
    }
  }

  if (absorberIndex === -1) {
    throw new Error(t('error.no_free_neighbor'));
  }

  const neighborNewSize = node.sizes[absorberIndex] - delta;

  if (neighborNewSize < 1) {
    throw new Error(t('error.neighbor_too_small'));
  }
  if (newSize < 1) {
    throw new Error(t('error.size_positive'));
  }

  node.sizes[childIndex] = newSize;
  node.sizes[absorberIndex] = neighborNewSize;
}

/**
 * Attempts to resize a node. If siblings are locked, it bubbles up
 * to the nearest ancestor that splits the space in the same direction,
 * steals space from that ancestor's siblings, and applies the delta tightly.
 * 
 * @param {Object} root - The root of the furniture tree
 * @param {string} targetId - ID of the node to resize
 * @param {number} newSize - Target new size in mm
 */
export function resizeNodeRecursively(root, targetId, newSize) {
  const path = getNodePath(root, targetId);
  if (!path || path.length < 2) {
    throw new Error(t('error.invalid_child'));
  }

  const parentEntry = path[path.length - 2];
  const parent = parentEntry.node;
  const childIndex = parent.children.findIndex(c => c.id === targetId);
  if (childIndex === -1) throw new Error(t('error.invalid_child'));

  const oldSize = parent.sizes[childIndex];
  const delta = newSize - oldSize;

  if (delta === 0) return;

  try {
    // Attempt local standard resize
    resizeChild(parent, childIndex, newSize);
  } catch (e) {
    // If it's a locked bounds error, we can try to bubble up
    if (e.message !== t('error.no_free_neighbor') && e.message !== t('error.neighbor_too_small')) {
      throw e; // some other error preventing resize
    }

    // Attempt to find an ancestor with the SAME direction
    const targetDirection = parent.direction; 
    let ancestorFound = false;

    // Walk up the path: path[path.length - 3] is the grandparent, etc.
    // root is path[0].
    for (let i = path.length - 3; i >= 0; i--) {
      const ancestorParent = path[i].node;
      if (ancestorParent.direction === targetDirection) {
        // We found an ancestor container dividing in the same dimension!
        const ancestorChildNode = path[i + 1].node;
        const ancestorIndex = ancestorParent.children.findIndex(c => c.id === ancestorChildNode.id);
        if (ancestorIndex === -1) continue;
        
        const ancestorCurrentSize = ancestorParent.sizes[ancestorIndex];
        
        // Attempt recursive resize on that ancestor
        // Note: this could recursively climb further if the ancestor's siblings are also locked!
        resizeNodeRecursively(root, ancestorChildNode.id, ancestorCurrentSize + delta);
        
        // If it succeeds (didn't throw), we forcefully apply the delta to our target
        parent.sizes[childIndex] = newSize;
        ancestorFound = true;
        break; // Stop climbing, we got our space!
      }
    }

    if (!ancestorFound) {
      // Nothing could provide the space
      throw e;
    }
  }
}

/**
 * Equalizes sizes of all unlocked children in a subdivided node.
 * Locked children retain their current size; the remaining space
 * is distributed equally among unlocked children.
 *
 * @param {Object} node - The parent node (must be subdivided)
 * @param {number} availableSpace - The actual space available for children in the parent
 * @param {number} T - Thickness
 */
export function equalizeSizes(node, availableSpace, T) {
  if (!node.direction || !node.sizes || node.sizes.length === 0) return;

  const count = node.sizes.length;
  const lockedIndices = node.children.map((c, i) => c.locked ? i : -1).filter(i => i !== -1);
  const lockedSpace = lockedIndices.reduce((sum, i) => sum + node.sizes[i], 0);
  const freeCount = count - lockedIndices.length;

  if (freeCount === 0) return;

  const totalT = (count - 1) * T;
  const targetFreeSpace = Math.max(0, availableSpace - totalT - lockedSpace);
  const equalSize = Math.floor(targetFreeSpace / freeCount);
  const remainder = targetFreeSpace - (equalSize * freeCount);

  for (let i = 0; i < count; i++) {
    if (!node.children[i].locked) {
      node.sizes[i] = equalSize;
    }
  }

  // Add remainder to the last free child
  const lastFreeIdx = [...Array(count).keys()].reverse().find(i => !node.children[i].locked);
  node.sizes[lastFreeIdx] += remainder;
}

/**
 * Recursively rescales the whole tree so all children fit their parent containers.
 * Useful when global dimensions or thickness change.
 *
 * @param {Object} node - Current node
 * @param {number} availableW - Available inner width
 * @param {number} availableH - Available inner height
 * @param {number} T - Thickness
 */
export function normalizeTree(node, availableW, availableH, T) {
  if (!node.direction || !node.children.length) return;

  const count = node.children.length;
  const availableDim = node.direction === 'row' ? availableH : availableW;
  const totalT = (count - 1) * T;
  
  const lockedIndices = node.children.map((c, i) => c.locked ? i : -1).filter(i => i !== -1);
  const freeIndices = node.children.map((c, i) => !c.locked ? i : -1).filter(i => i !== -1);
  const lockedSpace = lockedIndices.reduce((sum, i) => sum + Math.max(0, node.sizes[i]), 0);
  
  const targetSum = Math.max(0, availableDim - totalT);
  const targetFreeSpace = Math.max(0, targetSum - lockedSpace);
  const currentFreeSum = freeIndices.reduce((sum, i) => sum + Math.max(0, node.sizes[i]), 0);

  if (freeIndices.length > 0) {
    if (currentFreeSum > 0 && targetFreeSpace > 0) {
      const scale = targetFreeSpace / currentFreeSum;
      let newFreeSum = 0;
      for (const i of freeIndices) {
        node.sizes[i] = Math.round(node.sizes[i] * scale);
        newFreeSum += node.sizes[i];
      }
      // Adjust remainder on the last free child
      const diff = targetFreeSpace - newFreeSum;
      node.sizes[freeIndices[freeIndices.length - 1]] += diff;
    } else {
      // Free children have 0 size or targetFreeSpace is 0, equalize the free space
      const equalSize = Math.floor(targetFreeSpace / freeIndices.length);
      const remainder = targetFreeSpace - (equalSize * freeIndices.length);
      for (let j = 0; j < freeIndices.length; j++) {
        const i = freeIndices[j];
        node.sizes[i] = j === freeIndices.length - 1 ? equalSize + remainder : equalSize;
      }
    }
  } else {
    // Edge case: all children are locked OR targetSum is 0
    // They MUST be scaled otherwise they overflow the wrapper.
    const currentSum = node.sizes.reduce((sum, s) => sum + Math.max(0, s), 0);
    if (targetSum > 0 && currentSum > 0) {
      const scale = targetSum / currentSum;
      let newSum = 0;
      for (let i = 0; i < count; i++) {
        node.sizes[i] = Math.round(node.sizes[i] * scale);
        newSum += node.sizes[i];
      }
      const diff = targetSum - newSum;
      node.sizes[count - 1] += diff;
    } else if (targetSum > 0) {
      const equalSize = Math.floor(targetSum / count);
      const remainder = targetSum - (equalSize * count);
      for (let i = 0; i < count; i++) {
        node.sizes[i] = i === count - 1 ? equalSize + remainder : equalSize;
      }
    } else {
      // Spaces is 0, children must have size 0
      for (let i = 0; i < count; i++) {
        node.sizes[i] = 0;
      }
    }
  }

  // Recurse into children
  for (let i = 0; i < count; i++) {
    const childW = node.direction === 'col' ? node.sizes[i] : availableW;
    const childH = node.direction === 'row' ? node.sizes[i] : availableH;
    normalizeTree(node.children[i], childW, childH, T);
  }
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
  // The path returned by getNodePath is:
  // [ {node: root, childIndex: i}, {node: child1, childIndex: j}, ..., targetNode ]
  // We want to apply the subdivision of root to find child1's dims,
  // then apply child1's subdivision to find child2's dims, etc.
  for (let p = 0; p < path.length; p++) {
    const segment = path[p];
    if (segment.childIndex === undefined) break; // This is the target node itself

    const parentNode = segment.node;
    const childIndex = segment.childIndex;

    if (parentNode.direction === 'row') {
      // Rows are stacked vertically (along Y axis)
      // All children have the same width as the parent
      let offsetY = 0;
      for (let i = 0; i < childIndex; i++) {
        offsetY += parentNode.sizes[i] + T;
      }
      y += offsetY;
      h = parentNode.sizes[childIndex];
    } else if (parentNode.direction === 'col') {
      // Columns are side-by-side (along X axis)
      // All children have the same height as the parent
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
