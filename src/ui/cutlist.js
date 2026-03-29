/**
 * src/ui/cutlist.js — Cut List Component
 *
 * Tabular representation of the planks and dimensions for fabrication.
 */

import { groupPlanks } from '../planks.js';
import { t } from '../i18n.js';
import { escapeHtml } from '../utils.js';

/**
 * Renders the cut list.
 *
 * @param {HTMLElement} container - Cut list container
 * @param {Object[]} planks - All furniture planks
 * @param {Function} onHover - Callback when a plank group is hovered (ids[]) => void
 */
export function renderCutList(container, planks, onHover) {
  if (!container) return;

  container.innerHTML = generateCutListHtml(planks);

  attachCutlistListeners(container, onHover);
}

/**
 * Generates the HTML for the cut list table and footer.
 *
 * @param {Object[]} planks 
 * @returns {string}
 */
export function generateCutListHtml(planks) {
  const grouped = groupPlanks(planks);
  const totalArea = grouped.reduce((sum, g) => sum + g.totalArea, 0);

  return `
    <div class="cutlist-header">
      <div class="title">
        <span class="icon">📋</span>
        <h3>${t('cutlist.title', { count: planks.length, unique: grouped.length })}</h3>
      </div>
      <button class="btn btn-ghost collapse" id="btn-toggle-cutlist">${t('cutlist.collapse')}</button>
    </div>
    
    <div class="cutlist-body">
      <table class="cutlist-table">
        <thead>
          <tr>
            <th class="qty">${t('cutlist.qty')}</th>
            <th class="name">${t('cutlist.name')}</th>
            <th class="dim">${t('cutlist.length')}</th>
            <th class="dim">${t('cutlist.width')}</th>
            <th class="thick">${t('cutlist.thickness')}</th>
            <th class="type">${t('cutlist.type')}</th>
          </tr>
        </thead>
        <tbody>
          ${grouped.map((g) => {
            // Sort 3D dimensions to get proper cut list values:
            // length = longest, width = middle, thickness = thinnest (board thickness)
            const dims = [g.w, g.h, g.d].sort((a, b) => b - a);
            const length = Math.round(dims[0]);
            const width = Math.round(dims[1]);
            const thickness = Math.round(dims[2]);
            return `
            <tr data-plank-ids="${g.ids.join(',')}">
              <td class="qty">${g.count}</td>
              <td class="name">${t(g.name, { count: g.count, suffix: g.suffix || '' })} ${g.count > 1 ? '<span class="multi">(\u00d7' + g.count + ')</span>' : ''}</td>
              <td class="dim">${length} mm</td>
              <td class="dim">${width} mm</td>
              <td class="thick">${thickness} mm</td>
              <td class="type"><span class="badge ${g.type}">${t(`type.${g.type}`)}</span></td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>

    <div class="cut-list-footer">
      <div class="stats">
        <strong>${t('cutlist.total_area', { area: totalArea.toFixed(2) })}</strong>
      </div>
    </div>
  `;
}

function attachCutlistListeners(container, onHover) {
  const btn = container.querySelector('#btn-toggle-cutlist');
  const tableBody = container.querySelector('.cutlist-body');

  btn.onclick = () => {
    const isCollapsed = tableBody.classList.toggle('collapsed');
    btn.innerText = isCollapsed ? t('cutlist.expand') : t('cutlist.collapse');
  };

  if (onHover) {
    const rows = container.querySelectorAll('.cutlist-table tbody tr');
    rows.forEach((row) => {
      const ids = row.dataset.plankIds ? row.dataset.plankIds.split(',') : [];
      
      row.onmouseenter = () => onHover(ids);
      row.onmouseleave = () => onHover([]);
    });
  }
}


