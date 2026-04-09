/**
 * src/ui/cutlist-view.js — Full Cut List View
 *
 * Displays all piece details in a dedicated scrollable layout.
 * Now includes assembly hole count and hole markings on SVG drawings.
 */

import { t } from '../i18n.js';
import { groupPlanks } from '../planks.js';
import { generatePieceViews } from './piece-svg.js';
import { openZoomModal } from './zoom-modal.js';

/**
 * Renders the full cut list view.
 *
 * @param {HTMLElement} container - View container
 * @param {Object[]} planks - All furniture planks
 */
export function renderFullCutList(container, planks) {
  if (!container) return;

  const grouped = groupPlanks(planks, { splitByHoles: true });
  const totalArea = grouped.reduce((sum, g) => sum + g.totalArea, 0);

  const totalHoles = planks.reduce((sum, p) => sum + (p.holes?.length || 0), 0);
  const totalDowels = Math.floor(totalHoles / 2);

  // Build a lookup: plank id → plank (for hole data)
  const plankById = new Map();
  for (const p of planks) {
    plankById.set(p.id, p);
  }

  let cardsHtml = grouped.map((g) => {
    const dims = [g.w, g.h, g.d].sort((a, b) => b - a);
    const L = Math.round(dims[0]);
    const W = Math.round(dims[1]);
    const T = Math.round(dims[2]);

    // Use the first plank instance for hole data in the SVG
    const representativePlank = plankById.get(g.ids[0]);

    // Count total holes across all instances of this plank group
    const holesPerInstance = representativePlank?.holes?.length || 0;
    const totalHoles = holesPerInstance * g.count;

    return `
      <div class="cutlist-card" data-label="${g.label}">
        <div class="card-header">
          <div class="card-title">
            <span class="card-label">${g.label}</span>
            <h3>${t(g.name)}</h3>
          </div>
          <span class="badge ${g.type}">${t(`type.${g.type}`)}</span>
        </div>
        <div class="card-content">
          <div class="card-viz">
            ${generatePieceViews(L, W, g.label, representativePlank)}
          </div>
          <div class="card-info">
            <div class="stat-row">
              <span class="label">${t('cutlist.qty')}</span>
              <span class="value">${g.count}</span>
            </div>
            <div class="stat-row">
              <span class="label">${t('cutlist.length')}</span>
              <span class="value">${L} mm</span>
            </div>
            <div class="stat-row">
              <span class="label">${t('cutlist.width')}</span>
              <span class="value">${W} mm</span>
            </div>
            <div class="stat-row">
              <span class="label">${t('cutlist.thickness')}</span>
              <span class="value">${T} mm</span>
            </div>
            <div class="stat-row">
              <span class="label">${t('piece_detail.total_area')}</span>
              <span class="value">${g.totalArea.toFixed(2)} m²</span>
            </div>
            ${holesPerInstance > 0 ? `
            <div class="stat-row holes-stat">
              <span class="label">${t('piece_detail.holes')}</span>
              <span class="value">${t('piece_detail.hole_spec', {
                count: holesPerInstance,
                diameter: representativePlank.holes[0].diameter,
                depth: representativePlank.holes[0].depth,
              })}</span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="full-cutlist-container">
      <div class="full-cutlist-header">
        <h2>${t('view.cutlist')}</h2>
        <div class="full-cutlist-stats">
          <span>${t('cutlist.title', { count: planks.length, unique: grouped.length })}</span>
          <span class="divider">|</span>
          <strong>${t('cutlist.total_area', { area: totalArea.toFixed(2) })}</strong>
          ${totalDowels > 0 ? `<span class="divider">|</span><span>${t('cutlist.total_dowels', { count: totalDowels })}</span>` : ''}
        </div>
      </div>
      <div class="full-cutlist-grid">
        ${cardsHtml}
      </div>
    </div>
  `;

  // Zoom modal — delegated click on SVGs
  container.querySelectorAll('.card-viz').forEach(viz => {
    viz.addEventListener('click', () => {
      openZoomModal(viz.innerHTML);
    });
  });
}
