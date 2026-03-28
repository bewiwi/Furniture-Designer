/**
 * src/ui/tree.js — Hierarchy Tree View
 *
 * Visual representation of the nested compartments.
 */

import { t } from '../i18n.js';
import { getNodeDimensions } from '../model.js';
import { escapeHtml } from '../utils.js';

/**
 * Renders the tree of nodes in the container.
 *
 * @param {HTMLElement} container - Tree panel container
 * @param {Object} furniture - The complete furniture
 * @param {string} selectedId - Current selected node ID
 * @param {Function} onSelect - Callback when a node is clicked
 * @param {Function} onReorder - Callback when a node is drag-and-dropped
 */
export function renderTree(container, furniture, selectedId, onSelect, onReorder) {
  if (!container) return;

  const html = `
    <div class="tree-header">
      <h3>${t('tree.title')}</h3>
    </div>
    <div class="tree-content">
      ${renderNode(furniture.root, 0, selectedId, furniture, null, 0)}
    </div>
  `;

  container.innerHTML = html;

  // Add event listeners
  const items = container.querySelectorAll('.tree-node');
  items.forEach((item) => {
    item.onclick = (e) => {
      e.stopPropagation();
      onSelect(item.dataset.id);
    };

    if (item.getAttribute('draggable') === 'true') {
      item.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          id: item.dataset.id,
          parentId: item.dataset.parentId,
          index: parseInt(item.dataset.index, 10)
        }));
        e.dataTransfer.effectAllowed = 'move';
      };

      item.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.classList.add('drag-over');
      };

      item.ondragleave = (e) => {
        item.classList.remove('drag-over');
      };

      item.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        item.classList.remove('drag-over');

        const dataStr = e.dataTransfer.getData('text/plain');
        if (!dataStr) return;

        try {
          const source = JSON.parse(dataStr);
          const targetParentId = item.dataset.parentId;
          const targetIndex = parseInt(item.dataset.index, 10);

          if (source.parentId === targetParentId && source.index !== targetIndex && onReorder) {
            onReorder(targetParentId, source.index, targetIndex);
          }
        } catch (err) {
          console.error('Drag decoding failed:', err);
        }
      };
    }
  });
}

/**
 * Recursive function to render a node and its children
 *
 * @param {Object} node - Current node
 * @param {number} level - Current depth
 * @param {string} selectedId - Current selection
 * @param {Object} furniture - Furniture data
 * @param {string|null} parentId - ID of parent node
 * @param {number} index - Index of this relative to parent
 * @returns {string} HTML string
 */
function renderNode(node, level, selectedId, furniture, parentId = null, index = 0) {
  const isSelected = node.id === selectedId;
  const isRoot = node.id === furniture.root.id;

  // Determine icon and label
  let icon = '📦';
  let label = isRoot ? furniture.name : (node.name || t('tree.compartment'));

  if (node.direction === 'row') {
    icon = '↔';
    label = node.name || t('tree.rows');
  } else if (node.direction === 'col') {
    icon = '↕';
    label = node.name || t('tree.columns');
  }

  // Dimension summary from model
  const dimStr = getDimString(node, furniture);

  let html = `
    <div class="tree-node ${isSelected ? 'selected' : ''}" 
         data-id="${escapeHtml(node.id)}" 
         data-parent-id="${escapeHtml(parentId || '')}"
         data-index="${index}"
         draggable="${parentId ? 'true' : 'false'}"
         style="padding-left: ${level * 16 + 12}px">
      <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
        <span class="icon">${icon}</span>
        <span class="tree-label">${escapeHtml(label)}</span>
      </div>
      <span class="tree-size">${escapeHtml(dimStr)}</span>
    </div>
  `;

  // Recursively render children
  if (node.children && node.children.length > 0) {
    node.children.forEach((child, i) => {
      html += renderNode(child, level + 1, selectedId, furniture, node.id, i);
    });
  }

  return html;
}

/**
 * Helper to generate dimension strings using getNodeDimensions from model.js.
 */
function getDimString(node, furniture) {
  const isRoot = node.id === furniture.root.id;
  if (isRoot) {
    return `${furniture.width}×${furniture.height}mm`;
  }

  const dims = getNodeDimensions(furniture, node.id);
  if (!dims) return '';

  return `${Math.round(dims.w)}×${Math.round(dims.h)}mm`;
}
