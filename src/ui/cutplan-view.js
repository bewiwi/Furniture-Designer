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

  const panels = packPlanks(labeledPlanks, config.width, config.height, config.kerf);

  container.innerHTML = `
    <div class="cutplan-header" style="padding: 20px; background: var(--bg-secondary); border-bottom: 1px solid var(--border);">
      <h2 style="margin: 0 0 10px 0;">${t('cutplan.title') || 'Panel Cut Plan'}</h2>
      <div style="display: flex; gap: 15px;">
        <label>Panel Width: <input type="number" id="cp-width" value="${config.width}" style="width: 80px;"></label>
        <label>Panel Height: <input type="number" id="cp-height" value="${config.height}" style="width: 80px;"></label>
        <label>Kerf: <input type="number" id="cp-kerf" value="${config.kerf}" style="width: 80px;"></label>
        <button id="cp-apply" class="btn btn-primary" style="margin-left: 10px;">Recalculate</button>
      </div>
      <div style="margin-top: 15px; font-weight: bold; color: var(--text-primary);">
        Total Panels Required: ${panels.length}
      </div>
    </div>
    <div class="cutplan-body" style="padding: 20px; display: flex; flex-direction: column; gap: 40px; overflow-y: auto; flex: 1;">
      ${panels.map((panel, idx) => `
        <div class="panel-board">
          <h3 style="margin: 0 0 15px 0;">Panel ${idx + 1}</h3>
          <svg viewBox="0 0 ${config.width} ${config.height}" style="width: 100%; max-width: 1200px; border: 2px solid #555; background: repeating-linear-gradient(45deg, #333, #333 10px, #222 10px, #222 20px);">
            ${panel.placements.map(plc => `
              <g class="panel-piece">
                <title>${plc.item.name} (${plc.rect.w} x ${plc.rect.h})</title>
                <rect x="${plc.rect.x}" y="${plc.rect.y}" width="${plc.rect.w}" height="${plc.rect.h}" fill="var(--accent-primary)" stroke="#000" stroke-width="2" />
                <text x="${plc.rect.x + (plc.rect.w / 2)}" y="${plc.rect.y + (plc.rect.h / 2)}" fill="#fff" font-size="${Math.min(plc.rect.w, plc.rect.h) / 2}" dominant-baseline="middle" text-anchor="middle" font-weight="bold" pointer-events="none">
                  ${plc.item.label}
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
