import { packPlanks } from '../packer.js';
import { groupPlanks } from '../planks.js';
import { t } from '../i18n.js';

export function renderCutPlan(container, furniture, planks) {
  // Ensure config exists
  if (!furniture.panelConfig) {
    furniture.panelConfig = { width: 2440, height: 1220, kerf: 3 };
  }
  const config = furniture.panelConfig;

  // Group to get labels (A, B, C...)
  const groups = groupPlanks(planks);
  const labeledPlanks = planks.map(p => {
    const group = groups.find(g => g.ids.includes(p.id));
    return { ...p, label: group ? group.label : '' };
  });

  const { panels, unplaced } = packPlanks(labeledPlanks, config.width, config.height, config.kerf);

  let unplacedHtml = '';
  if (unplaced.length > 0) {
    unplacedHtml = `
      <div style="background: rgba(231, 76, 60, 0.1); border: 1px solid var(--danger); border-radius: var(--radius-md); padding: 15px; margin: 20px;">
        <h3 style="color: var(--danger); margin: 0 0 10px 0;">${t('cutplan.error.title')}</h3>
        <p style="margin: 0; color: var(--text-primary);">
          ${t('cutplan.error.desc', { count: unplaced.length, w: config.width, h: config.height })}
        </p>
        <ul style="margin: 10px 0 0 20px; color: var(--text-secondary);">
          ${unplaced.map(p => `<li>${p.label}: ${p.name} (${p.pw} × ${p.ph})</li>`).join('')}
        </ul>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="cutplan-header" style="padding: 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border);">
      <h2 style="margin: 0 0 10px 0;">${t('cutplan.title') || 'Panel Cut Plan'}</h2>
      <div style="display: flex; gap: 15px;">
        <label>${t('cutplan.panel_width')} <input type="number" id="cp-width" value="${config.width}" style="width: 80px;"></label>
        <label>${t('cutplan.panel_height')} <input type="number" id="cp-height" value="${config.height}" style="width: 80px;"></label>
        <label>${t('cutplan.kerf')} <input type="number" id="cp-kerf" value="${config.kerf}" style="width: 80px;"></label>
        <button id="cp-apply" class="btn btn-primary" style="margin-left: 10px;">${t('cutplan.recalculate')}</button>
      </div>
      <div style="margin-top: 15px; font-weight: bold; color: var(--text-primary);">
        ${t('cutplan.total_panels', { count: panels.length })}
      </div>
    </div>
    ${unplacedHtml}
    <div class="cutplan-body" style="padding: 20px; display: flex; flex-direction: column; gap: 40px; overflow-y: auto; flex: 1;">
      ${panels.map((panel, idx) => `
        <div class="panel-board">
          <h3 style="margin: 0 0 15px 0;">${t('cutplan.panel_number', { num: idx + 1 })}</h3>
          <svg viewBox="0 0 ${config.width} ${config.height}" style="width: 100%; max-width: 1200px; border: 2px solid #555; background: repeating-linear-gradient(45deg, #333, #333 10px, #222 10px, #222 20px);">
            ${panel.placements.map(plc => `
              <g class="panel-piece">
                <title>${plc.item.name} (${plc.rect.w} x ${plc.rect.h})</title>
                <rect x="${plc.rect.x}" y="${plc.rect.y}" width="${plc.rect.w}" height="${plc.rect.h}" fill="var(--accent-primary)" stroke="#000" stroke-width="2" />
                <text x="${plc.rect.x + (plc.rect.w / 2)}" y="${plc.rect.y + (plc.rect.h / 2)}" fill="#fff" font-size="${Math.min(Math.min(plc.rect.w, plc.rect.h) / 3, 120)}" dominant-baseline="middle" text-anchor="middle" pointer-events="none">
                  <tspan x="${plc.rect.x + (plc.rect.w / 2)}" dy="-0.2em" font-weight="bold">${plc.item.label}</tspan>
                  <tspan x="${plc.rect.x + (plc.rect.w / 2)}" dy="1.2em" font-size="0.4em" fill="rgba(255,255,255,0.8)">${plc.rect.w} × ${plc.rect.h}</tspan>
                </text>
              </g>
            `).join('')}
          </svg>
        </div>
      `).join('')}
    </div>
  `;

  // Provide way to listen to apply
  const btn = container.querySelector('#cp-apply');
  if (btn) {
    btn.addEventListener('click', () => {
      furniture.panelConfig.width = parseInt(container.querySelector('#cp-width').value, 10);
      furniture.panelConfig.height = parseInt(container.querySelector('#cp-height').value, 10);
      furniture.panelConfig.kerf = parseInt(container.querySelector('#cp-kerf').value, 10);
      container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
    });
  }
}
