/**
 * src/ui/toolbar.js — Main Toolbar
 *
 * Icons and main actions (New, Open, Save, Export, Undo, Redo, Views).
 */

import { t } from '../i18n.js';

// Track the outside-click handler so we can remove it on re-render
let _outsideClickHandler = null;

/**
 * Renders the toolbar.
 *
 * @param {HTMLElement} container - Toolbar container
 * @param {Object} callbacks - Interaction functions
 * @param {Object} state - State (canUndo, canRedo, currentLang, overlays)
 */
export function renderToolbar(container, callbacks, state) {
  if (!container) return;

  // Remove stale outside-click listener before re-render
  if (_outsideClickHandler) {
    document.removeEventListener('click', _outsideClickHandler, true);
    _outsideClickHandler = null;
  }

  const html = `
    <div class="toolbar-left">
      <button class="btn nav" id="btn-new" title="${t('tool.new.title')}">${t('tool.new')}</button>
      <div class="divider"></div>
      <button class="btn nav" id="btn-open" title="${t('tool.open.title')}">${t('tool.open')}</button>
      <button class="btn nav" id="btn-save" title="${t('tool.save.title')}">${t('tool.save')}</button>
      <div class="divider"></div>
      <button class="btn tool ${state.canUndo ? '' : 'disabled'}" id="btn-undo" title="${t('tool.undo.title')}">${t('tool.undo')}</button>
      <button class="btn tool ${state.canRedo ? '' : 'disabled'}" id="btn-redo" title="${t('tool.redo.title')}">${t('tool.redo')}</button>
    </div>

    <div class="toolbar-center">
      <div class="nav-switcher">
        <button class="btn btn-nav ${state.currentView === 'design'   ? 'active' : ''}" data-view="design">${t('view.design')}</button>
        <button class="btn btn-nav ${state.currentView === 'cut-list' ? 'active' : ''}" data-view="cut-list">${t('view.cutlist')}</button>
        <button class="btn btn-nav ${state.currentView === 'cut-plan' ? 'active' : ''}" data-view="cut-plan">${t('view.cutplan') || 'Panel Plan'}</button>
        <button class="btn btn-nav ${state.currentView === 'tools'    ? 'active' : ''}" data-view="tools">${t('view.tools')}</button>
      </div>
      <div class="view-controls" style="${state.currentView === 'design' ? '' : 'display: none;'}">
        <button class="btn view" data-view="front">${t('tool.view.front')}</button>
        <button class="btn view" data-view="top">${t('tool.view.top')}</button>
        <button class="btn view" data-view="right">${t('tool.view.side')}</button>
        <button class="divider-v"></button>
        <button class="btn view active" data-view="iso">${t('tool.view.iso')}</button>
        <button class="divider-v"></button>
        <!-- Affichage dropdown -->
        <div class="toolbar-dropdown" id="overlay-dropdown">
          <button class="btn view toolbar-dropdown-trigger" id="btn-overlay-menu"
            title="${t('tool.overlay.title') || 'Affichage'}">
            👁 ${t('tool.overlay.label') || 'Affichage'} ▾
          </button>
          <div class="toolbar-dropdown-panel" id="overlay-panel" hidden>
            <label class="dropdown-item">
              <input type="checkbox" data-overlay="quotes" ${state.overlays.has('quotes') ? 'checked' : ''}>
              <span>↔ ${t('tool.overlay.quotes')}</span>
            </label>
            <label class="dropdown-item">
              <input type="checkbox" data-overlay="locks" ${state.overlays.has('locks') ? 'checked' : ''}>
              <span>🔒 ${t('tool.overlay.locks')}</span>
            </label>
            <label class="dropdown-item">
              <input type="checkbox" data-overlay="objects" ${state.overlays.has('objects') ? 'checked' : ''}>
              <span>📦 ${t('tool.overlay.objects')}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="toolbar-right">
      <!-- Export dropdown -->
      <div class="toolbar-dropdown" id="export-dropdown">
        <button class="btn export toolbar-dropdown-trigger" id="btn-export-menu"
          title="${t('tool.export.title') || 'Exporter'}">
          ⬇ ${t('tool.export.label') || 'Export'} ▾
        </button>
        <div class="toolbar-dropdown-panel panel-left" id="export-panel" hidden>
          <button class="dropdown-item" id="btn-stl" title="${t('tool.export_stl.title')}">
            <span>${t('tool.export_stl')}</span>
          </button>
          <button class="dropdown-item" id="btn-dxf" title="${t('tool.export_dxf.title')}">
            <span>${t('tool.export_dxf')}</span>
          </button>
          <button class="dropdown-item" id="btn-plan" title="${t('tool.export_plan.title')}">
            <span>${t('tool.export_plan')}</span>
          </button>
        </div>
      </div>
      <div class="divider"></div>
      <button class="btn nav" id="btn-help" title="Aide [?]">❔ Aide</button>
      <button class="btn nav theme-toggle" id="btn-theme" title="${t('tool.theme.title')}">
        ${state.currentTheme === 'light' ? '☀️' : '🌙'}
      </button>
      <select id="lang-select" class="lang-switcher">
        <option value="en" ${state.currentLang === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
        <option value="fr" ${state.currentLang === 'fr' ? 'selected' : ''}>🇫🇷 FR</option>
      </select>
    </div>

    <input type="file" id="file-input" style="display: none" accept=".json">
  `;

  container.innerHTML = html;
  attachToolbarListeners(container, callbacks);
}

/**
 * Sets up a generic dropdown (trigger + panel + outside-close).
 * Returns the AbortController so callers can clean up.
 */
function setupDropdown(trigger, panel) {
  if (!trigger || !panel) return null;

  trigger.onclick = (e) => {
    e.stopPropagation();
    const isOpen = !panel.hidden;
    // Close all other panels first
    document.querySelectorAll('.toolbar-dropdown-panel').forEach(p => { p.hidden = true; });
    panel.hidden = isOpen;
  };

  // Prevent clicks inside panel from closing it
  panel.addEventListener('click', e => e.stopPropagation());

  return null; // caller will use shared handler
}

function attachToolbarListeners(container, callbacks) {
  // New
  container.querySelector('#btn-new').onclick = () => callbacks.onNew();

  // Open
  const fileInput = container.querySelector('#file-input');
  container.querySelector('#btn-open').onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    if (e.target.files.length > 0) callbacks.onOpen(e.target.files[0]);
  };

  // Save
  container.querySelector('#btn-save').onclick = () => callbacks.onSave();

  // Undo/Redo
  container.querySelector('#btn-undo').onclick = () => callbacks.onUndo();
  container.querySelector('#btn-redo').onclick = () => callbacks.onRedo();

  // View Switcher (Design / Cut List / …)
  container.querySelectorAll('.btn-nav').forEach(btn => {
    btn.onclick = () => { if (callbacks.onChangeView) callbacks.onChangeView(btn.dataset.view); };
  });

  // View Presets (front/top/right/iso) — exclude dropdown triggers
  const viewBtns = container.querySelectorAll('.btn.view:not(.toolbar-dropdown-trigger)');
  viewBtns.forEach(btn => {
    btn.onclick = () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.view) callbacks.onSetView(btn.dataset.view);
    };
  });

  // ── Affichage (overlay) dropdown ──────────────────────────────────────────
  const overlayTrigger = container.querySelector('#btn-overlay-menu');
  const overlayPanel   = container.querySelector('#overlay-panel');
  setupDropdown(overlayTrigger, overlayPanel);

  overlayPanel?.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.onchange = () => { if (callbacks.onToggleOverlay) callbacks.onToggleOverlay(cb.dataset.overlay); };
  });

  // ── Export dropdown ────────────────────────────────────────────────────────
  const exportTrigger = container.querySelector('#btn-export-menu');
  const exportPanel   = container.querySelector('#export-panel');
  setupDropdown(exportTrigger, exportPanel);

  container.querySelector('#btn-stl')?.addEventListener('click', () => {
    exportPanel.hidden = true;
    callbacks.onExportSTL();
  });
  container.querySelector('#btn-dxf')?.addEventListener('click', () => {
    exportPanel.hidden = true;
    callbacks.onExportDXF();
  });
  container.querySelector('#btn-plan')?.addEventListener('click', () => {
    exportPanel.hidden = true;
    callbacks.onExportPlan();
  });

  // ── Shared outside-click handler ──────────────────────────────────────────
  _outsideClickHandler = (e) => {
    // If the click target is inside the toolbar, do nothing — dropdown handlers manage that
    if (container.contains(e.target)) return;
    container.querySelectorAll('.toolbar-dropdown-panel').forEach(p => { p.hidden = true; });
  };
  // Use capture:true so we catch clicks on canvas/svg elements that don't bubble
  document.addEventListener('click', _outsideClickHandler, true);

  // ── Theme Toggle ──────────────────────────────────────────────────────────
  container.querySelector('#btn-theme')?.addEventListener('click', () => {
    if (callbacks.onThemeToggle) callbacks.onThemeToggle();
  });

  // ── Language Switcher ──────────────────────────────────────────────────────
  container.querySelector('#lang-select')?.addEventListener('change', (e) => {
    if (callbacks.onLanguageChange) callbacks.onLanguageChange(e.target.value);
  });

  // ── Help Modal ─────────────────────────────────────────────────────────────
  container.querySelector('#btn-help')?.addEventListener('click', () => {
    if (callbacks.onHelpToggle) callbacks.onHelpToggle();
  });
}
