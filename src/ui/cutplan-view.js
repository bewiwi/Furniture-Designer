import { packPlanks, packPlanksSmartMix } from '../packer.js';
import { groupPlanks } from '../planks.js';
import { t } from '../i18n.js';
import { migratePanelConfig } from '../storage.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/** Two accent colors for panels alternating (keeps SVGs visually distinct) */
const KIND_COLORS = [
  '#e07a2f', '#4a9eca', '#7cbb5e', '#c97dbf', '#e0b84a', '#6bbfb8',
];

function kindColor(kindId, kindIndex) {
  return KIND_COLORS[kindIndex % KIND_COLORS.length];
}

function formatPrice(num) {
  return Math.round(Number(num) * 100) / 100;
}

/**
 * Renders SVG layouts for a list of panels.
 * Each panel should have a .kind property.
 */
function renderPanelSVGs(panels, config, showKindLabel = false, kindColorMap = {}) {
  if (!panels || panels.length === 0) {
    return `<div class="cp-empty-state">
      <div class="cp-empty-icon">📋</div>
      <p>No panels to display. Add pieces to your furniture design first.</p>
    </div>`;
  }

  return panels.map((panel, idx) => {
    const kind = panel.kind || config.panelKinds[0];
    const panelW = kind.width;
    const panelH = kind.height;
    const color = kindColorMap[kind.id] || '#e07a2f';
    const kindLabel = showKindLabel && kind ? ` <span class="cp-kind-badge" style="background:${color}22;color:${color};border:1px solid ${color}44;">${kind.name}</span>` : '';

    // Waste % calculation
    const usedArea = panel.placements.reduce((s, p) => s + p.rect.w * p.rect.h, 0);
    const totalArea = panelW * panelH;
    const wastePercent = Math.round((1 - usedArea / totalArea) * 100);

    return `
      <div class="cp-panel-card">
        <div class="cp-panel-card-header">
          <div class="cp-panel-title">
            Panel ${idx + 1}${kindLabel}
          </div>
          <div class="cp-panel-meta">
            ${panelW} × ${panelH} mm &nbsp;·&nbsp; ${panel.placements.length} piece(s) &nbsp;·&nbsp;
            <span class="cp-waste ${wastePercent > 40 ? 'cp-waste--high' : ''}">${wastePercent}% waste</span>
          </div>
        </div>
        <div class="cp-svg-wrapper">
          <svg viewBox="0 0 ${panelW} ${panelH}" class="cp-panel-svg" preserveAspectRatio="xMidYMid meet">
            <!-- Hatch background = raw wood -->
            <defs>
              <pattern id="hatch-${idx}" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(45)">
                <rect width="40" height="40" fill="#1a1b28"/>
                <line x1="0" y1="0" x2="0" y2="40" stroke="#22233a" stroke-width="20"/>
              </pattern>
            </defs>
            <rect width="${panelW}" height="${panelH}" fill="url(#hatch-${idx})"/>
            ${panel.placements.map(plc => {
              const fw = Math.min(plc.rect.w, plc.rect.h) / 3;
              const fs = Math.min(fw, 120);
              const fsSmall = fs * 0.38;
              return `<g class="cp-plank-piece">
                <rect x="${plc.rect.x}" y="${plc.rect.y}" width="${plc.rect.w}" height="${plc.rect.h}"
                  fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="3" rx="4"/>
                <text x="${plc.rect.x + plc.rect.w / 2}" y="${plc.rect.y + plc.rect.h / 2}"
                  fill="#fff" font-family="Inter,sans-serif" dominant-baseline="middle" text-anchor="middle" pointer-events="none">
                  <tspan x="${plc.rect.x + plc.rect.w / 2}" dy="-0.3em" font-size="${fs}" font-weight="700">${plc.item.label}</tspan>
                  <tspan x="${plc.rect.x + plc.rect.w / 2}" dy="1.3em" font-size="${fsSmall}" fill="rgba(255,255,255,0.75)">${plc.rect.w} × ${plc.rect.h}</tspan>
                </text>
              </g>`;
            }).join('')}
          </svg>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Algorithm A: run packing independently per panel kind, return ranked results.
 */
function runCheapestForAll(preparedPlanks, config) {
  const activeKinds = config.panelKinds.filter(k => k.enabled !== false);
  const results = activeKinds.map(kind => {
    const { panels, unplaced } = packPlanks(preparedPlanks, kind.width, kind.height, config.kerf);
    const totalCost = panels.length * kind.pricePerPanel;
    return { kind, panels, unplaced, totalCost, panelCount: panels.length };
  });
  results.sort((a, b) => {
    if (a.unplaced.length !== b.unplaced.length) return a.unplaced.length - b.unplaced.length;
    const allZero = activeKinds.every(k => k.pricePerPanel === 0);
    return allZero ? a.panelCount - b.panelCount : a.totalCost - b.totalCost;
  });
  return results;
}

/**
 * Renders unplaced warning block.
 */
function renderUnplacedWarning(unplaced) {
  if (!unplaced || unplaced.length === 0) return '';
  return `
    <div class="cp-unplaced-warning">
      <div class="cp-unplaced-icon">⚠️</div>
      <div>
        <strong>${t('cutplan.error.title')}</strong>
        <ul>${unplaced.map(p => `<li>${p.label}: ${p.name} (${p.pw} × ${p.ph} mm)</li>`).join('')}</ul>
      </div>
    </div>`;
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderCutPlan(container, furniture, planks) {
  // Ensure config exists and is in the new multi-kind format
  migratePanelConfig(furniture);
  const config = furniture.panelConfig;

  // Build labeled + dimension-normalized planks (pw/ph = two largest dims)
  const groups = groupPlanks(planks);
  const preparedPlanks = planks.map(p => {
    const group = groups.find(g => g.ids.includes(p.id));
    const dims = [p.w, p.h, p.d].sort((a, b) => b - a);
    return { ...p, label: group ? group.label : '?', pw: dims[0], ph: dims[1] };
  });

  const activeKinds = config.panelKinds.filter(k => k.enabled !== false);
  const allPricesZero = activeKinds.every(k => k.pricePerPanel === 0);

  // Build a stable color map: kindId → color
  const kindColorMap = {};
  config.panelKinds.forEach((k, i) => { kindColorMap[k.id] = KIND_COLORS[i % KIND_COLORS.length]; });

  // ── Build panel kind rows ──────────────────────────────────────────────────
  function buildKindRows() {
    return config.panelKinds.map((kind, i) => {
      const color = KIND_COLORS[i % KIND_COLORS.length];
      const enabled = kind.enabled !== false;
      return `
        <div class="cp-kind-row ${enabled ? '' : 'cp-kind-row--disabled'}" data-idx="${i}" style="--kind-color:${color}">
          <div class="cp-kind-row-top">
            <button class="cp-kind-toggle" data-idx="${i}"
              title="${enabled ? 'Click to disable this panel type' : 'Click to enable this panel type'}"
              aria-label="${enabled ? 'Disable' : 'Enable'} ${kind.name}"
              style="--dot-color:${color}">
              <span class="cp-kind-toggle-dot ${enabled ? '' : 'cp-kind-toggle-dot--off'}"></span>
            </button>
            <input type="text" class="cp-input cp-kind-name" value="${kind.name}"
              placeholder="Name" aria-label="Panel kind name" title="Panel type name"
              ${enabled ? '' : 'disabled'}>
            <button class="cp-remove-btn" data-idx="${i}" title="Remove this panel type"
              ${config.panelKinds.length <= 1 ? 'disabled aria-disabled="true"' : ''}>✕</button>
          </div>
          <div class="cp-kind-row-dims">
            <div class="cp-dim-group">
              <span class="cp-dim-label">W</span>
              <input type="number" class="cp-input cp-input--num cp-kind-w" value="${kind.width}" min="100" max="10000" aria-label="Width (mm)" title="Panel width in mm" ${enabled ? '' : 'disabled'}>
              <span class="cp-dim-unit">mm</span>
            </div>
            <div class="cp-dim-group">
              <span class="cp-dim-label">H</span>
              <input type="number" class="cp-input cp-input--num cp-kind-h" value="${kind.height}" min="100" max="10000" aria-label="Height (mm)" title="Panel height in mm" ${enabled ? '' : 'disabled'}>
              <span class="cp-dim-unit">mm</span>
            </div>
            <div class="cp-dim-group cp-dim-group--price">
              <span class="cp-dim-label">€</span>
              <input type="number" class="cp-input cp-input--num cp-kind-price" value="${kind.pricePerPanel}"
                min="0" step="0.01" aria-label="Price per panel" placeholder="0" title="Price per panel sheet" ${enabled ? '' : 'disabled'}>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="cp-layout">
      <!-- ── Settings sidebar ──────────────────────────────── -->
      <div class="cp-sidebar">
        <div class="cp-sidebar-inner">
          <div class="cp-section-title">Panel Types</div>
          <div id="cp-kinds-list" class="cp-kinds-list">
            ${buildKindRows()}
          </div>
          <button id="cp-add-kind" class="cp-add-btn">
            <span>+</span> ${t('cutplan.add_panel_kind')}
          </button>

          <div class="cp-divider"></div>

          <div class="cp-section-title">Settings</div>

          <div class="cp-setting-row">
            <label class="cp-setting-label" for="cp-kerf">${t('cutplan.kerf')}</label>
            <div class="cp-dim-group">
              <input type="number" id="cp-kerf" class="cp-input cp-input--num" value="${config.kerf}" min="0" max="20">
              <span class="cp-dim-label">mm</span>
            </div>
          </div>

          <div class="cp-setting-row">
            <label class="cp-setting-label" for="cp-algorithm">${t('cutplan.algorithm')}</label>
            <select id="cp-algorithm" class="cp-select">
              <option value="cheapest-for-all" ${config.algorithm === 'cheapest-for-all' ? 'selected' : ''}>
                ${t('cutplan.algo.cheapest_all')}
              </option>
              <option value="smart-mix" ${config.algorithm === 'smart-mix' ? 'selected' : ''}>
                ${t('cutplan.algo.smart_mix')}
              </option>
            </select>
          </div>

          <div class="cp-algo-desc" id="cp-algo-desc">
            ${config.algorithm === 'cheapest-for-all'
              ? '↕ Packs all pieces on <em>each</em> type independently. Use to compare which type is cheapest for your project.'
              : '✦ Assigns each piece to the cheapest panel that has room. Minimizes total spend by mixing types.'}
          </div>

          <button id="cp-apply" class="cp-apply-btn">
            🔄 ${t('cutplan.recalculate')}
          </button>
        </div>
      </div>

      <!-- ── Results panel ─────────────────────────────────── -->
      <div class="cp-results-panel">
        <div id="cp-results" class="cp-results-scroll"></div>
      </div>
    </div>
  `;

  // ── Results renderer ───────────────────────────────────────────────────────
  function renderResults() {
    const resultsEl = container.querySelector('#cp-results');

    if (preparedPlanks.length === 0) {
      resultsEl.innerHTML = `<div class="cp-empty-state cp-empty-state--large">
        <div class="cp-empty-icon">🪵</div>
        <h3>No pieces to place</h3>
        <p>Design your furniture first, then come back here to generate a cut plan.</p>
      </div>`;
      return;
    }

    let html = '';

    if (config.algorithm === 'cheapest-for-all') {
      // ── Algorithm A ────────────────────────────────────────────────────────
      const ranked = runCheapestForAll(preparedPlanks, config);

      // Summary bar
      html += `<div class="cp-results-header">
        <h2 class="cp-results-title">${t('cutplan.ranking_title')}</h2>
        ${allPricesZero ? `<span class="cp-notice">${t('cutplan.no_price')}</span>` : ''}
      </div>`;

      // Ranking cards
      html += `<div class="cp-ranking-cards">`;
      ranked.forEach((r, i) => {
        const isWinner = i === 0 && r.unplaced.length === 0;
        const color = kindColorMap[r.kind.id] || '#e07a2f';
        const costStr = allPricesZero
          ? `${r.panelCount} panel(s)`
          : `${formatPrice(r.totalCost)}€ (${r.panelCount} × ${formatPrice(r.kind.pricePerPanel)}€)`;
        html += `
          <div class="cp-rank-card ${isWinner ? 'cp-rank-card--winner' : ''}" style="--kind-color:${color}">
            <div class="cp-rank-medal">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
            <div class="cp-rank-body">
              <div class="cp-rank-name">
                <span class="cp-kind-dot" style="background:${color}"></span>
                ${r.kind.name}
                ${isWinner ? `<span class="cp-winner-badge">${t('cutplan.winner')}</span>` : ''}
              </div>
              <div class="cp-rank-dims">${r.kind.width} × ${r.kind.height} mm</div>
              <div class="cp-rank-cost">${costStr}</div>
              ${r.unplaced.length > 0 ? `<div class="cp-rank-unplaced">⚠️ ${r.unplaced.length} piece(s) don't fit</div>` : ''}
            </div>
          </div>`;
      });
      html += `</div>`;

      // Show layouts for winner
      const winner = ranked[0];
      if (winner) {
        html += renderUnplacedWarning(winner.unplaced);
        const winnerPanels = winner.panels.map(p => ({ ...p, kind: winner.kind }));
        html += `<div class="cp-panels-section">
          <div class="cp-panels-section-title">Layout for <span style="color:${kindColorMap[winner.kind.id]}">${winner.kind.name}</span> (${winner.kind.width}×${winner.kind.height} mm)</div>
          <div class="cp-panels-grid">${renderPanelSVGs(winnerPanels, config, false, kindColorMap)}</div>
        </div>`;
      }

    } else {
      // ── Algorithm C: Smart Mix ─────────────────────────────────────────────
      const { panels, unplaced, totalCost, kindCosts } = packPlanksSmartMix(preparedPlanks, activeKinds, config.kerf);

      // Cost summary banner
      const breakdownParts = Object.values(kindCosts).map(k => {
        const color = kindColorMap[k.kind.id] || '#e07a2f';
        return `<span class="cp-breakdown-item">
          <span class="cp-kind-dot" style="background:${color}"></span>
          ${t('cutplan.cost_breakdown', { count: k.count, name: k.kind.name, subtotal: formatPrice(k.subtotal) })}
        </span>`;
      });
      const activeKindsForMix = config.panelKinds.filter(k => k.enabled !== false);

      html += `<div class="cp-results-header">
        <h2 class="cp-results-title">${t('cutplan.algo.smart_mix')}</h2>
        ${activeKindsForMix.length < config.panelKinds.length ? `<span class="cp-notice">${config.panelKinds.length - activeKindsForMix.length} type(s) disabled</span>` : ''}
      </div>`;

      if (allPricesZero) {
        html += `<div class="cp-cost-banner cp-cost-banner--neutral">
          <span class="cp-cost-icon">📋</span>
          <div>
            <div class="cp-cost-total">${panels.length} panel(s) needed</div>
            <div class="cp-cost-sub">${t('cutplan.no_price')}</div>
          </div>
        </div>`;
      } else {
        html += `<div class="cp-cost-banner">
          <span class="cp-cost-icon">💰</span>
          <div>
            <div class="cp-cost-total">${t('cutplan.cost_total', { cost: formatPrice(totalCost) })}</div>
            <div class="cp-cost-breakdown">${breakdownParts.join('<span class="cp-plus"> + </span>')}</div>
          </div>
        </div>`;
      }

      html += renderUnplacedWarning(unplaced);

      html += `<div class="cp-panels-section">
        <div class="cp-panels-section-title">${panels.length} panel(s) — optimized layout</div>
        <div class="cp-panels-grid">${renderPanelSVGs(panels, config, true, kindColorMap)}</div>
      </div>`;
    }

    resultsEl.innerHTML = html;
  }

  renderResults();

  // ── Events ─────────────────────────────────────────────────────────────────

  // Select-all on focus for number inputs (UX improvement)
  container.querySelectorAll('.cp-input--num').forEach(input => {
    input.addEventListener('focus', () => input.select());
  });

  container.querySelector('#cp-add-kind').addEventListener('click', () => {
    const nextIdx = config.panelKinds.length;
    config.panelKinds.push({
      id: generateId(),
      name: `Type ${nextIdx + 1}`,
      width: 2440, height: 1220, pricePerPanel: 0,
    });
    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });

  container.querySelector('#cp-kinds-list').addEventListener('click', e => {
    // Toggle enable/disable
    const toggleBtn = e.target.closest('.cp-kind-toggle');
    if (toggleBtn) {
      const idx = parseInt(toggleBtn.dataset.idx, 10);
      const kind = config.panelKinds[idx];
      if (kind) kind.enabled = kind.enabled === false ? true : false;
      container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
      return;
    }
    // Remove
    const btn = e.target.closest('.cp-remove-btn');
    if (!btn || btn.disabled) return;
    const idx = parseInt(btn.dataset.idx, 10);
    if (config.panelKinds.length <= 1) return;
    config.panelKinds.splice(idx, 1);
    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });

  // Update algo description inline when dropdown changes
  container.querySelector('#cp-algorithm').addEventListener('change', e => {
    const desc = container.querySelector('#cp-algo-desc');
    if (desc) {
      desc.innerHTML = e.target.value === 'cheapest-for-all'
        ? '↕ Packs all pieces on <em>each</em> type independently. Use to compare which type is cheapest for your project.'
        : '✦ Assigns each piece to the cheapest panel that has room. Minimizes total spend by mixing types.';
    }
  });

  container.querySelector('#cp-apply').addEventListener('click', () => {
    config.kerf = parseInt(container.querySelector('#cp-kerf').value, 10) || 3;
    config.algorithm = container.querySelector('#cp-algorithm').value;

    container.querySelectorAll('.cp-kind-row').forEach((row, i) => {
      const kind = config.panelKinds[i];
      if (!kind) return;
      // Only read input values if the kind is enabled (disabled inputs have stale DOM)
      if (kind.enabled !== false) {
        kind.name          = row.querySelector('.cp-kind-name').value.trim() || 'Panel';
        kind.width         = parseInt(row.querySelector('.cp-kind-w').value, 10) || 2440;
        kind.height        = parseInt(row.querySelector('.cp-kind-h').value, 10) || 1220;
        kind.pricePerPanel = parseFloat(row.querySelector('.cp-kind-price').value) || 0;
      }
    });

    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });
}
