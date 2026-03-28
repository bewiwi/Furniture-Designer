/**
 * src/ui/tree.js — Hierarchy Tree View
 *
 * Visual representation of the nested compartments.
 */

/**
 * Renders the tree of nodes in the container.
 *
 * @param {HTMLElement} container - Tree panel container
 * @param {Object} furniture - The complete furniture
 * @param {string} selectedId - Current selected node ID
 * @param {Function} onSelect - Callback when a node is clicked
 */
export function renderTree(container, furniture, selectedId, onSelect) {
  if (!container) return;

  const html = `
    <div class="tree-header">
      <h3>Hierarchy</h3>
    </div>
    <div class="tree-content">
      ${renderNode(furniture.root, 0, selectedId, furniture)}
    </div>
  `;

  container.innerHTML = html;

  // Add event listeners
  const items = container.querySelectorAll('.tree-item');
  items.forEach((item) => {
    item.onclick = () => onSelect(item.dataset.id);
  });
}

/**
 * Recursive function to render a node and its children
 *
 * @param {Object} node - Current node
 * @param {number} level - Current depth
 * @param {string} selectedId - Current selection
 * @param {Object} furniture - Furniture data
 * @returns {string} HTML string
 */
function renderNode(node, level, selectedId, furniture) {
  const isSelected = node.id === selectedId;
  const isRoot = node.id === furniture.root.id;

  // Determine icon and label
  let icon = '📦';
  let label = isRoot ? furniture.name : 'Compartment';

  if (node.direction === 'row') {
    icon = '↔';
    label = 'Rows';
  } else if (node.direction === 'col') {
    icon = '↕';
    label = 'Columns';
  }

  // Dimension summary
  const dimStr = getDimString(node, furniture);

  let html = `
    <div class="tree-item ${isSelected ? 'active' : ''}" 
         data-id="${node.id}" 
         style="padding-left: ${level * 16 + 12}px">
      <span class="icon">${icon}</span>
      <span class="label">${label}</span>
      <span class="dim">${dimStr}</span>
    </div>
  `;

  // Recursively render children
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      html += renderNode(child, level + 1, selectedId, furniture);
    });
  }

  return html;
}

/**
 * Helper to generate dimension strings (e.g., 100x200)
 */
function getDimString(node, furniture) {
  const isRoot = node.id === furniture.root.id;
  if (isRoot) {
    return `${furniture.width}×${furniture.height}mm`;
  }

  // For children, find dimensions
  // This is a bit expensive but okay for small trees
  const path = getNodePath(furniture.root, node.id);
  if (!path) return '';

  const parent = path[path.length - 2]; // Not available in this format
  // Simplified for now: we look at sizes from model.js if available
  // Real implementation uses getNodeDimensions
  return '';
}

/**
 * Copy of getNodePath from model.js (for layout use)
 */
function getNodePath(node, targetId) {
  if (node.id === targetId) return [node];
  for (let i = 0; i < node.children.length; i++) {
    const path = getNodePath(node.children[i], targetId);
    if (path) return [node, ...path];
  }
  return null;
}
