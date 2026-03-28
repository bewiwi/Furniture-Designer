/**
 * src/ui/cutlist.js — Cut List Component
 *
 * Tabular representation of the planks and dimensions for fabrication.
 */

import { groupPlanks } from '../planks.js';
import { t } from '../i18n.js';

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
        <h3>${t('cutlist.title', { count: planks.length, unique: grouped.length })}</h3>
      </div>
      <button class="btn btn-ghost collapse" id="btn-toggle-cutlist">${t('cutlist.collapse')}</button>
    </div>
    
    <div class="cut-list-table-container">
      <table class="cut-list-table">
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
          ${grouped.map((g) => `
            <tr>
              <td class="qty">${g.count}</td>
              <td class="name">${t(g.name, { count: g.count, suffix: g.suffix || '' })} ${g.count > 1 ? '<span class="multi">(×' + g.count + ')</span>' : ''}</td>
              <td class="dim">${Math.round(g.h)} mm</td>
              <td class="dim">${Math.round(g.w)} mm</td>
              <td class="thick">${Math.round(g.d)} mm</td>
              <td class="type"><span class="badge ${g.type}">${t(`type.${g.type}`)}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="cut-list-footer">
      <div class="stats">
        ${t('cutlist.total_area', { area: totalArea.toFixed(2) })}
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
    btn.innerText = isCollapsed ? t('cutlist.expand') : t('cutlist.collapse');
  };
}


