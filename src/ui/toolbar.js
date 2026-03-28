/**
 * src/ui/toolbar.js — Main Toolbar
 *
 * Icons and main actions (New, Open, Save, STL, DXF, Undo, Redo, Views).
 */

/**
 * Renders the toolbar.
 *
 * @param {HTMLElement} container - Toolbar container
 * @param {Object} callbacks - Interaction functions
 * @param {Object} state - State (canUndo, canRedo)
 */
export function renderToolbar(container, callbacks, state) {
  if (!container) return;

  const html = `
    <div class="toolbar-left">
      <button class="btn nav" id="btn-new" title="New Furniture">📄 New</button>
      <div class="divider"></div>
      <button class="btn nav" id="btn-open" title="Open JSON">📂 Open</button>
      <button class="btn nav" id="btn-save" title="Save JSON (Ctrl+S)">💾 Save</button>
      <div class="divider"></div>
      <button class="btn tool ${state.canUndo ? '' : 'disabled'}" id="btn-undo" title="Undo (Ctrl+Z)">↩ Undo</button>
      <button class="btn tool ${state.canRedo ? '' : 'disabled'}" id="btn-redo" title="Redo (Ctrl+Y)">↪ Redo</button>
    </div>
    
    <div class="toolbar-center">
      <div class="view-controls">
        <button class="btn view" data-view="front">Front</button>
        <button class="btn view" data-view="top">Top</button>
        <button class="btn view" data-view="right">Side</button>
        <button class="divider-v"></button>
        <button class="btn view active" data-view="iso">3D View</button>
      </div>
    </div>

    <div class="toolbar-right">
      <button class="btn export" id="btn-stl" title="Export STL">⬇ STL</button>
      <button class="btn export" id="btn-dxf" title="Export DXF">⬇ DXF</button>
    </div>

    <input type="file" id="file-input" style="display: none" accept=".json">
  `;

  container.innerHTML = html;
  attachToolbarListeners(container, callbacks);
}

function attachToolbarListeners(container, callbacks) {
  // New
  container.querySelector('#btn-new').onclick = () => {
    if (confirm('Create new furniture? Unsaved changes will be lost.')) {
      callbacks.onNew();
    }
  };

  // Open
  const fileInput = container.querySelector('#file-input');
  container.querySelector('#btn-open').onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
      callbacks.onOpen(e.target.files[0]);
    }
  };

  // Save
  container.querySelector('#btn-save').onclick = () => callbacks.onSave();

  // Export
  container.querySelector('#btn-stl').onclick = () => callbacks.onExportSTL();
  container.querySelector('#btn-dxf').onclick = () => callbacks.onExportDXF();

  // Undo/Redo
  container.querySelector('#btn-undo').onclick = () => callbacks.onUndo();
  container.querySelector('#btn-redo').onclick = () => callbacks.onRedo();

  // Views
  const viewBtns = container.querySelectorAll('.btn.view');
  viewBtns.forEach((btn) => {
    btn.onclick = () => {
      viewBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      callbacks.onSetView(btn.dataset.view);
    };
  });
}
