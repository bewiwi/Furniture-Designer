/**
 * src/ui/form.js — Properties Form
 *
 * Dynamic form to edit furniture dimensions and manage subdivisions
 * for the currently selected compartment.
 */

import { findNodeById, getNodeDimensions, getNodePath } from '../model.js';
import { t } from '../i18n.js';
import { escapeHtml } from '../utils.js';

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
          <input type="text" id="prop-name" value="${escapeHtml(furniture.name)}" placeholder="${t('form.dims.name')}">
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

      <section class="form-section">
        <legend>${t('form.dowel.title')}</legend>
        <div class="form-row">
          <div class="form-group">
            <label>${t('form.dowel.diameter')} <span>(mm)</span></label>
            <input type="number" id="prop-dowel-diameter" value="${furniture.dowelConfig?.diameter ?? 8}" min="3" max="20" step="1">
          </div>
          <div class="form-group">
            <label>${t('form.dowel.dowelLength')} <span>(mm)</span></label>
            <input type="number" id="prop-dowel-length" value="${furniture.dowelConfig?.dowelLength ?? 30}" min="10" max="100" step="1">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('form.dowel.margin')} <span>(mm)</span></label>
            <input type="number" id="prop-dowel-margin" value="${furniture.dowelConfig?.edgeMargin ?? 50}" min="10" max="200" step="5">
          </div>
          <div class="form-group">
            <label>${t('form.dowel.spacing')} <span>(mm)</span></label>
            <input type="number" id="prop-dowel-spacing" value="${furniture.dowelConfig?.spacing ?? 200}" min="50" max="500" step="10">
          </div>
        </div>
      </section>
    `;
  } else if (dims) {
    const path = getNodePath(furniture.root, selectedId);
    const parentEntry = path && path.length > 1 ? path[path.length - 2] : null;
    const parent = parentEntry ? parentEntry.node : null;
    const childIndex = parent ? parent.children.indexOf(node) : -1;
    const isLocked = !!node.locked;
    const freeCount = parent ? parent.children.filter(c => !c.locked).length : 0;
    const isOnlyFree = !isLocked && freeCount === 1;
    const lockIcon = isLocked ? '🔒' : '🔓';

    let widthHtml = `<div class="value">${Math.round(dims.w)} mm</div>`;
    let heightHtml = `<div class="value">${Math.round(dims.h)} mm</div>`;

    if (parent && childIndex !== -1) {
      const lockToggleHtml = `
        <button class="btn btn-ghost btn-lock-toggle-self btn-lock-inline ${isLocked ? 'is-locked' : ''}" data-parent-id="${escapeHtml(parent.id)}" data-index="${childIndex}" title="${t('form.sub.lock_toggle')}">
          ${lockIcon}
        </button>
      `;

      if (parent.direction === 'col') {
        widthHtml = `
          <div class="editable-dim">
            <input type="number" class="prop-self-size dim-input" data-parent-id="${escapeHtml(parent.id)}" data-index="${childIndex}" value="${Math.round(dims.w)}" min="10" ${isLocked || isOnlyFree ? 'disabled' : ''}>
            <span class="dim-unit">mm</span>
            ${lockToggleHtml}
          </div>
        `;
      } else if (parent.direction === 'row') {
        heightHtml = `
          <div class="editable-dim">
            <input type="number" class="prop-self-size dim-input" data-parent-id="${escapeHtml(parent.id)}" data-index="${childIndex}" value="${Math.round(dims.h)}" min="10" ${isLocked || isOnlyFree ? 'disabled' : ''}>
            <span class="dim-unit">mm</span>
            ${lockToggleHtml}
          </div>
        `;
      }
    }

    // Show actual dimensions for informational purposes and editable node name
    html += `
      <section class="form-section info">
        <legend>${t('form.dims.actual')}</legend>
        <div class="form-group form-group-spaced">
          <label>${t('form.dims.name')}</label>
          <input type="text" id="prop-node-name" value="${escapeHtml(node.name || '')}" placeholder="${t('form.dims.name')}">
        </div>
        <div class="info-grid">
          <div class="label">${t('form.dims.width')}:</div>${widthHtml}
          <div class="label">${t('form.dims.height')}:</div>${heightHtml}
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
    const freeCount = node.children.filter(c => !c.locked).length;
    
    html += `
      <section class="form-section">
        <div class="legend-row">
          <legend>${dirLabel}</legend>
          <button class="btn btn-small" id="btn-equalize" title="${t('form.sub.equalize')}">⚖</button>
        </div>
        <div class="children-list">
          ${node.sizes.map((size, idx) => {
            const childNode = node.children[idx];
            const childName = childNode?.name || `${childPrefix} ${idx + 1}`;
            const escapedChildName = escapeHtml(childName);
            const isLocked = !!childNode.locked;
            const isOnlyFree = !isLocked && freeCount === 1;
            const lockIcon = isLocked ? '🔒' : '🔓';

            return `
            <div class="form-group row">
              <label title="${escapedChildName}">${escapedChildName}</label>
              <div class="child-controls">
                <div class="reorder-controls">
                  <button class="btn btn-ghost btn-move-up btn-compact" data-index="${idx}" ${idx === 0 ? 'disabled' : ''} title="${t('form.sub.move_up') ?? '↑'}">▲</button>
                  <button class="btn btn-ghost btn-move-down btn-compact" data-index="${idx}" ${idx === node.children.length - 1 ? 'disabled' : ''} title="${t('form.sub.move_down') ?? '↓'}">▼</button>
                </div>
                <button class="btn btn-ghost btn-lock-toggle btn-lock-inline ${isLocked ? 'is-locked' : ''}" data-index="${idx}" title="${t('form.sub.lock_toggle')}">
                  ${lockIcon}
                </button>
                <div class="input-unit">
                  <input type="number" class="prop-child-size" data-index="${idx}" value="${size}" min="10" ${isLocked || isOnlyFree ? 'disabled' : ''}>
                  <span>mm</span>
                </div>
                <button class="btn btn-ghost btn-remove-single" data-index="${idx}" title="${t('form.sub.remove_single') ?? 'Remove'}">
                  <span class="danger-icon">🗑️</span>
                </button>
              </div>
            </div>
            `;
          }).join('')}
        </div>
        <div class="add-child-wrap">
          <button class="btn btn-primary full btn-add-single">
            ${node.direction === 'row' ? t('form.sub.add_single_row') : t('form.sub.add_single_col')}
          </button>
        </div>
        <button class="btn btn-danger full" id="btn-remove-sub">${t('form.sub.remove')}</button>
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
  const nameInput = container.querySelector('#prop-name');
  if (nameInput) {
    nameInput.addEventListener('change', (e) => callbacks.onChangeFurniture('name', e.target.value));
  }

  // Node Name (Non-Root)
  const nodeNameInput = container.querySelector('#prop-node-name');
  if (nodeNameInput) {
    nodeNameInput.addEventListener('change', (e) => {
      // Check if the callback exists for backward compatibility, although we will provide it
      if (callbacks.onChangeNodeName) {
        callbacks.onChangeNodeName(selectedId, e.target.value);
      }
    });
  }

  ['width', 'height', 'depth', 'thickness'].forEach((prop) => {
    const input = container.querySelector(`#prop-${prop}`);
    if (input) {
      input.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) return;
        callbacks.onChangeFurniture(prop, val);
      });
    }
  });

  // Dowel Config Listeners
  const dowelInputs = [
    { id: 'prop-dowel-diameter', key: 'diameter' },
    { id: 'prop-dowel-length', key: 'dowelLength' },
    { id: 'prop-dowel-margin', key: 'edgeMargin' },
    { id: 'prop-dowel-spacing', key: 'spacing' },
  ];
  for (const { id, key } of dowelInputs) {
    const input = container.querySelector(`#${id}`);
    if (input) {
      input.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) return;
        if (callbacks.onChangeDowelConfig) {
          callbacks.onChangeDowelConfig(key, val);
        }
      });
    }
  }

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

  // Remove Subdivisions (All)
  const btnRemove = container.querySelector('#btn-remove-sub');
  if (btnRemove) {
    btnRemove.onclick = () => callbacks.onRemoveSubdivision(selectedId);
  }

  // Equalize Sizes
  const btnEqualize = container.querySelector('#btn-equalize');
  if (btnEqualize) {
    btnEqualize.onclick = () => {
      if (callbacks.onEqualizeSizes) {
        callbacks.onEqualizeSizes(selectedId);
      }
    };
  }

  // Remove Single Subdivision
  const btnRemoveSingles = container.querySelectorAll('.btn-remove-single');
  btnRemoveSingles.forEach((btn) => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      if (callbacks.onRemoveSingleChild) {
        callbacks.onRemoveSingleChild(selectedId, idx);
      }
    };
  });

  // Toggle Lock
  const btnLockToggles = container.querySelectorAll('.btn-lock-toggle');
  btnLockToggles.forEach((btn) => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      if (callbacks.onToggleLock) {
        callbacks.onToggleLock(selectedId, idx);
      }
    };
  });

  // Reorder (Move Up / Down)
  const btnMoveUp = container.querySelectorAll('.btn-move-up');
  btnMoveUp.forEach((btn) => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      if (callbacks.onReorderChild && idx > 0) {
        callbacks.onReorderChild(selectedId, idx, idx - 1);
      }
    };
  });

  const btnMoveDown = container.querySelectorAll('.btn-move-down');
  btnMoveDown.forEach((btn) => {
    btn.onclick = (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      if (callbacks.onReorderChild) {
        callbacks.onReorderChild(selectedId, idx, idx + 1);
      }
    };
  });

  // Self Resize and Lock
  const btnLockSelf = container.querySelector('.btn-lock-toggle-self');
  if (btnLockSelf && callbacks.onToggleLock) {
    btnLockSelf.onclick = (e) => {
      const parentId = e.currentTarget.dataset.parentId;
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      callbacks.onToggleLock(parentId, idx);
    };
  }

  const inputSelfSize = container.querySelector('.prop-self-size');
  if (inputSelfSize && callbacks.onResizeChild) {
    inputSelfSize.addEventListener('change', (e) => {
      const parentId = e.target.dataset.parentId;
      const idx = parseInt(e.target.dataset.index, 10);
      const val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) return;
      callbacks.onResizeChild(parentId, idx, val);
    });
  }

  // Add Single Subdivision
  const btnAddSingle = container.querySelector('.btn-add-single');
  if (btnAddSingle) {
    btnAddSingle.onclick = () => {
      if (callbacks.onAddSingleChild) {
        callbacks.onAddSingleChild(selectedId);
      }
    };
  }

  // Resize Children
  const childSizeInputs = container.querySelectorAll('.prop-child-size');
  childSizeInputs.forEach((input) => {
    input.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.index, 10);
      const val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) return;
      callbacks.onResizeChild(selectedId, idx, val);
    });
  });
}
