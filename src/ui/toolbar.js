/**
 * src/ui/toolbar.js — Main Toolbar
 *
 * Icons and main actions (New, Open, Save, STL, DXF, Undo, Redo, Views).
 */

import { t } from '../i18n.js';

/**
 * Renders the toolbar.
 *
 * @param {HTMLElement} container - Toolbar container
 * @param {Object} callbacks - Interaction functions
 * @param {Object} state - State (canUndo, canRedo, currentLang)
 */
export function renderToolbar(container, callbacks, state) {
  if (!container) return;

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
      <div class="view-controls">
        <button class="btn view" data-view="front">${t('tool.view.front')}</button>
        <button class="btn view" data-view="top">${t('tool.view.top')}</button>
        <button class="btn view" data-view="right">${t('tool.view.side')}</button>
        <button class="divider-v"></button>
        <button class="btn view active" data-view="iso">${t('tool.view.iso')}</button>
      </div>
    </div>

    <div class="toolbar-right">
      <button class="btn export" id="btn-stl" title="${t('tool.export_stl.title')}">${t('tool.export_stl')}</button>
      <button class="btn export" id="btn-dxf" title="${t('tool.export_dxf.title')}">${t('tool.export_dxf')}</button>
      <div class="divider"></div>
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

function attachToolbarListeners(container, callbacks) {
  // New
  container.querySelector('#btn-new').onclick = () => {
    callbacks.onNew(); // confirmation is handled in main.js
  };

  // Open
  const fileInput = container.querySelector('#file-input');
  container.querySelector('#btn-open').onclick = () => fileInput.click();
  fileInput.onchange = (e) => {
    if (e.target.files.length > 0) {
      callbacks.onOpen(e.target.files[0]);
    }
  };

  // Save
  container.querySelector('#btn-save').onclick = () => callbacks.onSave();

  // Export
  container.querySelector('#btn-stl').onclick = () => callbacks.onExportSTL();
  container.querySelector('#btn-dxf').onclick = () => callbacks.onExportDXF();

  // Undo/Redo
  container.querySelector('#btn-undo').onclick = () => callbacks.onUndo();
  container.querySelector('#btn-redo').onclick = () => callbacks.onRedo();

  // Views
  const viewBtns = container.querySelectorAll('.btn.view');
  viewBtns.forEach((btn) => {
    btn.onclick = () => {
      viewBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      callbacks.onSetView(btn.dataset.view);
    };
  });

  // Theme Toggle
  const themeBtn = container.querySelector('#btn-theme');
  if (themeBtn) {
    themeBtn.onclick = () => {
      if (callbacks.onThemeToggle) {
        callbacks.onThemeToggle();
      }
    };
  }

  // Language Switcher
  const langSelect = container.querySelector('#lang-select');
  if (langSelect) {
    langSelect.onchange = (e) => {
      if (callbacks.onLanguageChange) {
        callbacks.onLanguageChange(e.target.value);
      }
    };
  }
}
