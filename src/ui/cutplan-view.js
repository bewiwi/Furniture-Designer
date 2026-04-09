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
  // Ensure config exists and is in the new provider format
  migratePanelConfig(furniture);
  const config = furniture.panelConfig;

  // Build labeled + dimension-normalized planks (pw/ph = two largest dims)
  const groups = groupPlanks(planks);
  const preparedPlanks = planks.map(p => {
    const group = groups.find(g => g.ids.includes(p.id));
    const dims = [p.w, p.h, p.d].sort((a, b) => b - a);
    return { ...p, label: group ? group.label : '?', pw: dims[0], ph: dims[1] };
  });

  // Build a stable color map: kindId → color
  const kindColorMap = {};
  let colorIndex = 0;
  config.providers.forEach(p => {
    p.kinds.forEach(k => {
      kindColorMap[k.id] = KIND_COLORS[colorIndex % KIND_COLORS.length];
      colorIndex++;
    });
  });

  // ── Build nested provider structure ──────────────────────────────────────────────────
  function buildProviders() {
    return config.providers.map((provider, pIdx) => {
      const pEnabled = provider.enabled !== false;
      return `
        <div class="cp-provider-card ${pEnabled ? '' : 'provider-disabled'}" data-pidx="${pIdx}">
          <div class="cp-provider-header">
            <button class="cp-provider-toggle" data-pidx="${pIdx}"
              title="${pEnabled ? 'Disable this provider' : 'Enable this provider'}"
              style="--dot-color:#4a9eca">
              <span class="cp-kind-toggle-dot ${pEnabled ? '' : 'cp-kind-toggle-dot--off'}"></span>
            </button>
            <input type="text" class="cp-provider-name" value="${provider.name}"
              placeholder="Provider Name" ${pEnabled ? '' : 'disabled'}>
            <button class="cp-remove-provider-btn" data-pidx="${pIdx}" title="Remove this provider"
              ${config.providers.length <= 1 ? 'disabled aria-disabled="true"' : ''}>✕</button>
          </div>
          <div class="cp-kinds-list">
            ${provider.kinds.map((kind, kIdx) => {
              const color = kindColorMap[kind.id];
              const enabled = kind.enabled !== false;
              return `
                <div class="cp-kind-row ${enabled ? '' : 'cp-kind-row--disabled'}" data-pidx="${pIdx}" data-kidx="${kIdx}" style="--kind-color:${color}">
                  <div class="cp-kind-row-top">
                    <button class="cp-kind-toggle" data-pidx="${pIdx}" data-kidx="${kIdx}"
                      title="${enabled ? 'Disable this panel' : 'Enable this panel'}"
                      style="--dot-color:${color}" ${pEnabled ? '' : 'disabled'}>
                      <span class="cp-kind-toggle-dot ${enabled ? '' : 'cp-kind-toggle-dot--off'}"></span>
                    </button>
                    <input type="text" class="cp-input cp-kind-name" value="${kind.name}"
                      placeholder="Name" ${enabled && pEnabled ? '' : 'disabled'}>
                    <button class="cp-remove-btn" data-pidx="${pIdx}" data-kidx="${kIdx}" title="Remove this panel"
                      ${provider.kinds.length <= 1 ? 'disabled' : ''} ${pEnabled ? '' : 'disabled'}>✕</button>
                  </div>
                  <div class="cp-kind-row-dims">
                    <div class="cp-dim-group">
                      <span class="cp-dim-label">W</span>
                      <input type="number" class="cp-input cp-input--num cp-kind-w" value="${kind.width}" min="100" max="10000" ${enabled && pEnabled ? '' : 'disabled'}>
                      <span class="cp-dim-unit">mm</span>
                    </div>
                    <div class="cp-dim-group">
                      <span class="cp-dim-label">H</span>
                      <input type="number" class="cp-input cp-input--num cp-kind-h" value="${kind.height}" min="100" max="10000" ${enabled && pEnabled ? '' : 'disabled'}>
                      <span class="cp-dim-unit">mm</span>
                    </div>
                    <div class="cp-dim-group cp-dim-group--price">
                      <span class="cp-dim-label">€</span>
                      <input type="number" class="cp-input cp-input--num cp-kind-price" value="${kind.pricePerPanel}" step="0.01" ${enabled && pEnabled ? '' : 'disabled'}>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <button class="cp-add-kind cp-provider-add-kind cp-add-btn" data-pidx="${pIdx}" ${pEnabled ? '' : 'disabled'}>
            <span>+</span> ${t('cutplan.add_panel_kind')}
          </button>
        </div>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="cp-layout">
      <!-- ── Settings sidebar ──────────────────────────────── -->
      <div class="cp-sidebar">
        <div class="cp-sidebar-inner">
          <div class="cp-section-title">Providers</div>
          <div id="cp-providers-list">
            ${buildProviders()}
          </div>
          <button id="cp-add-provider" class="cp-add-btn cp-add-btn--primary">
            <span>+</span> Add Provider
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
              ? '↕ Evaluates all enabled panels within a Provider independently. Ranks Providers based on their single best panel.'
              : '✦ Mixes all enabled panels within a Provider to minimize total spend. Ranks Providers based on mixed cart cost.'}
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
    const ranked = [];
    let allGlobalPricesZero = true;

    for (const provider of config.providers) {
      if (provider.enabled === false) continue;
      const activeKinds = provider.kinds.filter(k => k.enabled !== false);
      if (activeKinds.length === 0) continue;

      if (activeKinds.some(k => k.pricePerPanel > 0)) {
        allGlobalPricesZero = false;
      }

      if (config.algorithm === 'cheapest-for-all') {
         let providerBest = null;
         for (const kind of activeKinds) {
           const { panels, unplaced } = packPlanks(preparedPlanks, kind.width, kind.height, config.kerf);
           const totalCost = panels.length * kind.pricePerPanel;
           const result = { kind, panels, unplaced, totalCost, panelCount: panels.length };
           if (!providerBest || 
               result.unplaced.length < providerBest.unplaced.length || 
               (result.unplaced.length === providerBest.unplaced.length && result.totalCost < providerBest.totalCost)) {
             providerBest = result;
           }
         }
         
         if (providerBest) {
           ranked.push({
             provider,
             mode: 'single',
             totalCost: providerBest.totalCost,
             unplaced: providerBest.unplaced,
             winnerDetail: providerBest
           });
         }
      } else {
         const mixResult = packPlanksSmartMix(preparedPlanks, activeKinds, config.kerf);
         ranked.push({
            provider,
            mode: 'mix',
            totalCost: mixResult.totalCost,
            unplaced: mixResult.unplaced,
            winnerDetail: mixResult
         });
      }
    }

    // Sort providers
    ranked.sort((a, b) => {
      if (a.unplaced.length !== b.unplaced.length) return a.unplaced.length - b.unplaced.length;
      return a.totalCost - b.totalCost;
    });

    if (ranked.length === 0) {
       resultsEl.innerHTML = `<div class="cp-empty-state">
        <div class="cp-empty-icon">⚠️</div>
        <p>No active providers or panels available. Enable them in the settings.</p>
      </div>`;
      return;
    }

    html += `<div class="cp-results-header">
      <h2 class="cp-results-title">${t('cutplan.ranking_title') || 'Provider Ranking'}</h2>
      ${allGlobalPricesZero ? `<span class="cp-notice">${t('cutplan.no_price')}</span>` : ''}
    </div>`;

    html += `<div class="cp-ranking-cards">`;
    ranked.forEach((r, i) => {
      const isWinner = i === 0 && r.unplaced.length === 0;
      const costStr = allGlobalPricesZero ? '' : `${formatPrice(r.totalCost)}€`;

      html += `
        <div class="cp-rank-card ${isWinner ? 'cp-rank-card--winner' : ''}">
          <div class="cp-rank-medal">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</div>
          <div class="cp-rank-body">
            <div class="cp-rank-name">
              ${r.provider.name}
              ${isWinner ? `<span class="cp-winner-badge">${t('cutplan.winner')}</span>` : ''}
            </div>
            ${r.mode === 'single' ? `<div class="cp-rank-dims">Optimal unit: ${r.winnerDetail.kind.name}</div>` : ''}
            <div class="cp-rank-cost">${costStr}</div>
            ${r.unplaced.length > 0 ? `<div class="cp-rank-unplaced">⚠️ ${r.unplaced.length} piece(s) don't fit</div>` : ''}
          </div>
        </div>`;
    });
    html += `</div>`;

    // Show layouts for winner
    const winner = ranked[0];
    if (winner) {
      if (winner.unplaced.length > 0) {
        html += renderUnplacedWarning(winner.unplaced);
      }
      if (winner.mode === 'single') {
        const pBest = winner.winnerDetail;
        const winnerPanels = pBest.panels.map(p => ({ ...p, kind: pBest.kind }));
        html += `<div class="cp-panels-section">
          <div class="cp-panels-section-title">Layout for <span style="color:${kindColorMap[pBest.kind.id]}">${pBest.kind.name}</span> (${pBest.kind.width}×${pBest.kind.height} mm) from ${winner.provider.name}</div>
          <div class="cp-panels-grid">${renderPanelSVGs(winnerPanels, config, false, kindColorMap)}</div>
        </div>`;
      } else {
        const { panels, kindCosts } = winner.winnerDetail;
        const breakdownParts = Object.values(kindCosts).map(k => {
          const color = kindColorMap[k.kind.id] || '#e07a2f';
          return `<span class="cp-breakdown-item">
            <span class="cp-kind-dot" style="background:${color}"></span>
            ${k.count}× ${k.kind.name} ${!allGlobalPricesZero ? `(${formatPrice(k.subtotal)}€)` : ''}
          </span>`;
        });
        html += `<div class="cp-panels-section">
          <div class="cp-panels-section-title">Smart Mix from <strong>${winner.provider.name}</strong></div>
          <div class="cp-cost-breakdown" style="padding-bottom:15px">${breakdownParts.join('<span class="cp-plus"> + </span>')}</div>
          <div class="cp-panels-grid">${renderPanelSVGs(panels, config, true, kindColorMap)}</div>
        </div>`;
      }
    }

    resultsEl.innerHTML = html;
  }

  renderResults();

  // ── Events ─────────────────────────────────────────────────────────────────

  container.querySelectorAll('.cp-input--num').forEach(input => {
    input.addEventListener('focus', () => input.select());
  });

  // Add Provider
  container.querySelector('#cp-add-provider').addEventListener('click', () => {
    const nextIdx = config.providers.length + 1;
    config.providers.push({
      id: generateId(),
      name: `Provider ${nextIdx}`,
      enabled: true,
      kinds: [{
        id: generateId(),
        name: `Standard`,
        width: 2440, height: 1220, pricePerPanel: 0,
      }]
    });
    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });

  container.querySelector('#cp-providers-list').addEventListener('click', e => {
    const addKindBtn = e.target.closest('.cp-provider-add-kind');
    if (addKindBtn && !addKindBtn.disabled) {
      const pIdx = parseInt(addKindBtn.dataset.pidx, 10);
      const provider = config.providers[pIdx];
      provider.kinds.push({
        id: generateId(),
        name: `Type ${provider.kinds.length + 1}`,
        width: 2440, height: 1220, pricePerPanel: 0,
      });
      container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
      return;
    }

    const toggleProviderBtn = e.target.closest('.cp-provider-toggle');
    if (toggleProviderBtn) {
      const pIdx = parseInt(toggleProviderBtn.dataset.pidx, 10);
      const provider = config.providers[pIdx];
      provider.enabled = provider.enabled === false ? true : false;
      container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
      return;
    }

    const removeProviderBtn = e.target.closest('.cp-remove-provider-btn');
    if (removeProviderBtn && !removeProviderBtn.disabled) {
      const pIdx = parseInt(removeProviderBtn.dataset.pidx, 10);
      config.providers.splice(pIdx, 1);
      container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
      return;
    }

    const toggleKindBtn = e.target.closest('.cp-kind-toggle');
    if (toggleKindBtn && !toggleKindBtn.disabled) {
      const pIdx = parseInt(toggleKindBtn.dataset.pidx, 10);
      const kIdx = parseInt(toggleKindBtn.dataset.kidx, 10);
      const kind = config.providers[pIdx].kinds[kIdx];
      kind.enabled = kind.enabled === false ? true : false;
      container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
      return;
    }

    const removeKindBtn = e.target.closest('.cp-remove-btn');
    if (removeKindBtn && !removeKindBtn.disabled) {
      const pIdx = parseInt(removeKindBtn.dataset.pidx, 10);
      const kIdx = parseInt(removeKindBtn.dataset.kidx, 10);
      config.providers[pIdx].kinds.splice(kIdx, 1);
      container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
      return;
    }
  });

  container.querySelector('#cp-algorithm').addEventListener('change', e => {
    const desc = container.querySelector('#cp-algo-desc');
    if (desc) {
      desc.innerHTML = e.target.value === 'cheapest-for-all'
        ? '↕ Evaluates all enabled panels within a Provider independently. Ranks Providers based on their single best panel.'
        : '✦ Mixes all enabled panels within a Provider to minimize total spend. Ranks Providers based on mixed cart cost.';
    }
  });

  container.querySelector('#cp-apply').addEventListener('click', () => {
    config.kerf = parseInt(container.querySelector('#cp-kerf').value, 10) || 3;
    config.algorithm = container.querySelector('#cp-algorithm').value;

    const providers = [];
    container.querySelectorAll('.cp-provider-card').forEach((pCard) => {
      const pIdx = parseInt(pCard.dataset.pidx, 10);
      const originalProvider = config.providers[pIdx];
      if (!originalProvider) return;
      
      const pEnabled = !pCard.classList.contains('provider-disabled');
      const pName = pCard.querySelector('.cp-provider-name').value.trim() || 'Provider';
      
      const kinds = [];
      pCard.querySelectorAll('.cp-kind-row').forEach((kRow) => {
        const kIdx = parseInt(kRow.dataset.kidx, 10);
        const originalKind = originalProvider.kinds[kIdx];
        if (!originalKind) return;
        
        const enabled = !kRow.classList.contains('cp-kind-row--disabled');
        const name = kRow.querySelector('.cp-kind-name').value.trim() || 'Panel';
        const width = parseInt(kRow.querySelector('.cp-kind-w').value, 10) || 2440;
        const height = parseInt(kRow.querySelector('.cp-kind-h').value, 10) || 1220;
        const pricePerPanel = parseFloat(kRow.querySelector('.cp-kind-price').value) || 0;
        
        kinds.push({ ...originalKind, enabled, name, width, height, pricePerPanel });
      });
      
      providers.push({ ...originalProvider, enabled: pEnabled, name: pName, kinds });
    });
    
    config.providers = providers;
    container.dispatchEvent(new CustomEvent('config-updated', { bubbles: true }));
  });
}
