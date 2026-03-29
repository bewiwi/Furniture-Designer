/**
 * src/ui/resizer.js — Resizable Panels
 *
 * Implements mouse dragging logic to resize workspace columns.
 */

import { 
  saveTreeWidth, loadTreeWidth,
  savePropsWidth, loadPropsWidth 
} from '../storage.js';

/**
 * Initializes resizers for the workspace panels.
 *
 * @param {HTMLElement} workspace - The workspace grid container
 */
export function initResizers(workspace) {
  if (!workspace) return;

  const treeResizer = document.getElementById('tree-resizer');
  const propsResizer = document.getElementById('props-resizer');

  const MIN_WIDTH = 150;
  const MAX_WIDTH = 600;

  // Initial State
  let treeWidth = loadTreeWidth();
  let propsWidth = loadPropsWidth();
  
  updateGrid();

  // Resize Logic
  setupResizer(treeResizer, 'left');
  setupResizer(propsResizer, 'right');

  function setupResizer(handle, side) {
    if (!handle) return;

    let isDragging = false;

    handle.addEventListener('mousedown', () => {
      isDragging = true;
      handle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const rect = workspace.getBoundingClientRect();
      let newWidth;

      if (side === 'left') {
        newWidth = e.clientX - rect.left;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
        treeWidth = newWidth;
      } else {
        newWidth = rect.right - e.clientX;
        if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
        if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
        propsWidth = newWidth;
      }

      requestAnimationFrame(updateGrid);
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      if (side === 'left') {
        saveTreeWidth(treeWidth);
      } else {
        savePropsWidth(propsWidth);
      }
    });
  }

  function updateGrid() {
    // Layout: [Tree] [Resizer] [Viewer] [Resizer] [Properties]
    workspace.style.gridTemplateColumns = `${Math.round(treeWidth)}px 4px 1fr 4px ${Math.round(propsWidth)}px`;
  }
}
