/**
 * src/ui/cutlist.js — Cut List Component
 *
 * Tabular representation of the planks and dimensions for fabrication.
 */

import { groupPlanks } from '../planks.js';

/**
 * Renders the cut list.
 *
 * @param {HTMLElement} container - Cut list container
 * @param {Object[]} planks - All furniture planks
 */
export function renderCutList(container, planks) {
  if (!container) return;

  const grouped = groupPlanks(planks);
  const totalArea = grouped.reduce((sum, g) => sum + g.totalArea, 0);

  const html = `
    <div class="cut-list-header">
      <div class="title">
        <span class="icon">📋</span>
        <h3>Cut List — ${planks.length} pieces (${grouped.length} unique)</h3>
      </div>
      <button class="btn collapse" id="btn-toggle-cutlist">▲ Collapse</button>
    </div>
    
    <div class="cut-list-table-container">
      <table class="cut-list-table">
        <thead>
          <tr>
            <th class="qty">QTY</th>
            <th class="name">NAME</th>
            <th class="dim">LENGTH</th>
            <th class="dim">WIDTH</th>
            <th class="thick">THICKNESS</th>
            <th class="type">TYPE</th>
          </tr>
        </thead>
        <tbody>
          ${grouped.map((g) => `
            <tr>
              <td class="qty">${g.count}</td>
              <td class="name">${g.name} ${g.count > 1 ? '<span class="multi">(×' + g.count + ')</span>' : ''}</td>
              <td class="dim">${Math.round(g.h)} mm</td>
              <td class="dim">${Math.round(g.w)} mm</td>
              <td class="thick">${Math.round(g.d)} mm</td>
              <td class="type"><span class="badge ${g.type}">${getDisplayType(g.type)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="cut-list-footer">
      <div class="stats">
        Total surface area: <strong>${totalArea.toFixed(2)} m²</strong>
      </div>
    </div>
  `;

  container.innerHTML = html;

  attachCutlistListeners(container);
}

function attachCutlistListeners(container) {
  const btn = container.querySelector('#btn-toggle-cutlist');
  const table = container.querySelector('.cut-list-table-container');

  btn.onclick = () => {
    const isCollapsed = table.classList.toggle('collapsed');
    btn.innerText = isCollapsed ? '▼ Expand' : '▲ Collapse';
  };
}

/**
 * Helper to translate internal types to display labels
 */
function getDisplayType(type) {
  const map = {
    frameV: 'V Frame',
    frameH: 'H Frame',
    shelf: 'H Shelf',
    separator: 'V Sep.',
  };
  return map[type] || type;
}
