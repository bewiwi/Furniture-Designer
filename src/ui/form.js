/**
 * src/ui/form.js — Properties Form
 *
 * Dynamic form to edit furniture dimensions and manage subdivisions
 * for the currently selected compartment.
 */

import { findNodeById, getNodeDimensions } from '../model.js';
import { t } from '../i18n.js';

/**
 * Renders the properties form for the selected node.
 *
 * @param {HTMLElement} container - Properties panel container
 * @param {Object} furniture - The complete furniture
 * @param {string} selectedId - Current selected node ID
 * @param {Object} callbacks - Interaction functions
 */
export function renderForm(container, furniture, selectedId, callbacks) {
  if (!container) return;

  const isRoot = selectedId === furniture.root.id;
  const node = isRoot ? furniture.root : findNodeById(furniture.root, selectedId);

  if (!node) {
    container.innerHTML = `<div class="empty">${t('form.empty')}</div>`;
    return;
  }

  // Calculate actual dimensions for the selected node
  const dims = getNodeDimensions(furniture, selectedId);

  let html = `
    <div class="form-header">
      <h3>${isRoot ? t('form.title.root') : t('form.title.node')}</h3>
    </div>
    <div class="form-content">
  `;

  // --- 1. Global Dimensions (only for root) ---
  if (isRoot) {
    html += `
      <section class="form-section">
        <legend>${t('form.dims.global')}</legend>
        <div class="form-group">
          <label>${t('form.dims.name')}</label>
          <input type="text" id="prop-name" value="${furniture.name}" placeholder="${t('form.dims.name')}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('form.dims.width')} <span>(mm)</span></label>
            <input type="number" id="prop-width" value="${furniture.width}" min="200" max="5000">
          </div>
          <div class="form-group">
            <label>${t('form.dims.height')} <span>(mm)</span></label>
            <input type="number" id="prop-height" value="${furniture.height}" min="200" max="5000">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('form.dims.depth')} <span>(mm)</span></label>
            <input type="number" id="prop-depth" value="${furniture.depth}" min="50" max="1000">
          </div>
          <div class="form-group">
            <label>${t('form.dims.thickness')} <span>(mm)</span></label>
            <input type="number" id="prop-thickness" value="${furniture.thickness}" min="10" max="50">
          </div>
        </div>
      </section>
    `;
  } else if (dims) {
    // Show actual dimensions for informational purposes
    html += `
      <section class="form-section info">
        <legend>${t('form.dims.actual')}</legend>
        <div class="info-grid">
          <div class="label">${t('form.dims.width')}:</div><div class="value">${Math.round(dims.w)} mm</div>
          <div class="label">${t('form.dims.height')}:</div><div class="value">${Math.round(dims.h)} mm</div>
          <div class="label">${t('form.dims.depth')}:</div><div class="value">${furniture.depth} mm</div>
        </div>
      </section>
    `;
  }

  // --- 2. Subdivisions Control ---
  if (!node.direction) {
    // If not subdivided, propose adding subdivisions
    html += `
      <section class="form-section">
        <legend>${t('form.sub.add')}</legend>
        <p class="help">${t('form.sub.help')}</p>
        
        <div class="subdivide-grid">
          <div class="sub-ctrl">
            <button class="btn accent" id="btn-sub-row">${t('form.sub.btn_row')}</button>
            <input type="number" id="input-sub-row" value="3" min="2" max="20">
          </div>
          <div class="sub-ctrl">
            <button class="btn accent" id="btn-sub-col">${t('form.sub.btn_col')}</button>
            <input type="number" id="input-sub-col" value="2" min="2" max="20">
          </div>
        </div>
      </section>
    `;
  } else {
    // If subdivided, allow editing children sizes or removing everything
    const dirLabel = node.direction === 'row' ? t('tree.rows') : t('tree.columns');
    const childPrefix = node.direction === 'row' ? t('form.sub.row_prefix') : t('form.sub.col_prefix');
    
    html += `
      <section class="form-section">
        <legend>${dirLabel}</legend>
        <div class="children-list">
          ${node.sizes.map((size, idx) => `
            <div class="form-group row">
              <label>${childPrefix} ${idx + 1}</label>
              <div class="input-unit">
                <input type="number" class="prop-child-size" data-index="${idx}" value="${size}" min="10">
                <span>mm</span>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="btn danger full" id="btn-remove-sub">${t('form.sub.remove')}</button>
      </section>
    `;
  }

  html += '</div>';
  container.innerHTML = html;

  attachListeners(container, furniture, selectedId, callbacks);
}

/**
 * Event Listeners for the form
 */
function attachListeners(container, furniture, selectedId, callbacks) {
  // Global Props (Root)
  const nameInput = container.querySelector('#prop-name');
  if (nameInput) {
    nameInput.addEventListener('change', (e) => callbacks.onChangeFurniture('name', e.target.value));
  }

  ['width', 'height', 'depth', 'thickness'].forEach((prop) => {
    const input = container.querySelector(`#prop-${prop}`);
    if (input) {
      input.addEventListener('change', (e) => callbacks.onChangeFurniture(prop, parseInt(e.target.value, 10)));
    }
  });

  // Subdivide Actions
  const btnSubRow = container.querySelector('#btn-sub-row');
  if (btnSubRow) {
    btnSubRow.onclick = () => {
      const count = parseInt(container.querySelector('#input-sub-row').value, 10);
      callbacks.onSubdivide(selectedId, 'row', count);
    };
  }

  const btnSubCol = container.querySelector('#btn-sub-col');
  if (btnSubCol) {
    btnSubCol.onclick = () => {
      const count = parseInt(container.querySelector('#input-sub-col').value, 10);
      callbacks.onSubdivide(selectedId, 'col', count);
    };
  }

  // Remove Subdivisions
  const btnRemove = container.querySelector('#btn-remove-sub');
  if (btnRemove) {
    btnRemove.onclick = () => callbacks.onRemoveSubdivision(selectedId);
  }

  // Resize Children
  const childSizeInputs = container.querySelectorAll('.prop-child-size');
  childSizeInputs.forEach((input) => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const val = parseInt(e.target.value, 10);
      callbacks.onResizeChild(selectedId, idx, val);
    });
  });
}
