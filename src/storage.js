/**
 * storage.js — History and Persistence
 *
 * Manage localStorage snapshots and undo/redo logic.
 * Support for JSON import/export.
 */

import { cloneFurniture } from './model.js';
import { validateFurniture, downloadBlob, sanitizeFileName } from './utils.js';

const STORAGE_KEY = 'furniture-designer-app-v1';
const LANG_KEY = 'furniture-designer-lang';
const THEME_KEY = 'furniture-designer-theme';
const TREE_WIDTH_KEY = 'furniture-designer-tree-width';
const PROPS_WIDTH_KEY = 'furniture-designer-props-width';
const HISTORY_LIMIT = 50;

const state = {
  history: [],
  currentIndex: -1,
};

/**
 * Saves the user's tree panel width preference.
 * @param {number} width 
 */
export function saveTreeWidth(width) {
  try {
    localStorage.setItem(TREE_WIDTH_KEY, width.toString());
  } catch (e) {
    console.error('Failed to save tree width:', e);
  }
}

/**
 * Loads the user's tree panel width preference (defaults to 220).
 * @returns {number} 
 */
export function loadTreeWidth() {
  try {
    const val = localStorage.getItem(TREE_WIDTH_KEY);
    return val ? parseInt(val, 10) : 220;
  } catch (e) {
    return 220;
  }
}

/**
 * Saves the user's properties panel width preference.
 * @param {number} width 
 */
export function savePropsWidth(width) {
  try {
    localStorage.setItem(PROPS_WIDTH_KEY, width.toString());
  } catch (e) {
    console.error('Failed to save props width:', e);
  }
}

/**
 * Loads the user's properties panel width preference (defaults to 260).
 * @returns {number} 
 */
export function loadPropsWidth() {
  try {
    const val = localStorage.getItem(PROPS_WIDTH_KEY);
    return val ? parseInt(val, 10) : 260;
  } catch (e) {
    return 260;
  }
}

/**
 * Saves the user's theme preference.
 * @param {string} theme ('dark' | 'light')
 */
export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
}

/**
 * Loads the user's theme preference (defaults to 'dark').
 * @returns {string} 
 */
export function loadTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'dark';
  } catch (e) {
    return 'dark';
  }
}

/**
 * Saves the user's language preference.
 * @param {string} lang 
 */
export function saveLanguage(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    console.error('Failed to save language:', e);
  }
}

/**
 * Loads the user's language preference (defaults to 'en').
 * @returns {string} 
 */
export function loadLanguage() {
  try {
    return localStorage.getItem(LANG_KEY) || 'en';
  } catch (e) {
    return 'en';
  }
}

/**
 * Saves a snapshot of the current furniture to history and localStorage.
 *
 * @param {Object} furniture - The furniture object to save
 */
export function saveToLocalStorage(furniture) {
  if (!furniture) return;

  const snapshot = cloneFurniture(furniture);

  // If there's already an existing history beyond current index, discard it
  if (state.currentIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.currentIndex + 1);
  }

  // Add the new snapshot to history
  state.history.push(snapshot);

  // Enforce history size limit
  if (state.history.length > HISTORY_LIMIT) {
    state.history.shift();
  } else {
    state.currentIndex++;
  }

  // Save to localStorage (only the current state)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Loads the last saved furniture from localStorage.
 */
export function loadFromLocalStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const furniture = JSON.parse(data);
      migratePanelConfig(furniture);
      // Initialize state with this initial load
      state.history = [cloneFurniture(furniture)];
      state.currentIndex = 0;
      return furniture;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}

/**
 * Checks if Undo is possible.
 */
export function canUndo() {
  return state.currentIndex > 0;
}

/**
 * Checks if Redo is possible.
 */
export function canRedo() {
  return state.currentIndex < state.history.length - 1;
}

/**
 * Undo: Go back to the previous state.
 *
 * @returns {Object|null} The previous state or null
 */
export function undo() {
  if (canUndo()) {
    state.currentIndex--;
    const furniture = state.history[state.currentIndex];
    // Sync localStorage with current position in history
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(furniture));
    } catch (e) {
      console.error('Failed to sync undo to localStorage:', e);
    }
    return cloneFurniture(furniture);
  }
  return null;
}

/**
 * Redo: Restore the next state in history.
 *
 * @returns {Object|null} The next state or null
 */
export function redo() {
  if (canRedo()) {
    state.currentIndex++;
    const furniture = state.history[state.currentIndex];
    // Sync localStorage with current position in history
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(furniture));
    } catch (e) {
      console.error('Failed to sync redo to localStorage:', e);
    }
    return cloneFurniture(furniture);
  }
  return null;
}

/**
 * Downloads the current furniture as a JSON file.
 *
 * @param {Object} furniture - The furniture to export
 */
export function exportJSON(furniture) {
  const data = JSON.stringify(furniture, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  downloadBlob(blob, `${sanitizeFileName(furniture.name)}.json`);
}

/**
 * Imports a furniture object from a JSON file.
 *
 * @param {File} file - The file to import
 * @returns {Promise<Object>} Promise resolving to the furniture object
 */
export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const furniture = validateFurniture(parsed);
        migratePanelConfig(furniture);
        resolve(furniture);
      } catch (err) {
        reject(new Error(err.message || 'Invalid JSON file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Migrates old single-panel panelConfig to multi-kind format.
 * Safe to call on already-migrated configs (idempotent).
 *
 * @param {Object} furniture
 */
export function migratePanelConfig(furniture) {
  if (!furniture) return;
  if (!furniture.panelConfig) {
    furniture.panelConfig = {
      kerf: 3,
      algorithm: 'smart-mix',
      providers: [{
        id: 'default',
        name: 'Default Provider',
        enabled: true,
        kinds: [{ id: 'k1', name: 'Standard', width: 2440, height: 1220, pricePerPanel: 0, count: 1 }],
      }]
    };
    return;
  }
  
  const cfg = furniture.panelConfig;
  
  // Phase 1 migration (flat width/height -> panelKinds list)
  if (!cfg.panelKinds && !cfg.providers) {
    cfg.panelKinds = [{
      id: 'migrated',
      name: 'Standard',
      width: cfg.width ?? 2440,
      height: cfg.height ?? 1220,
      pricePerPanel: 0,
      count: 1
    }];
    delete cfg.width;
    delete cfg.height;
  }

  // Phase 2 migration (panelKinds list -> providers list)
  if (cfg.panelKinds && !cfg.providers) {
    cfg.providers = [{
      id: 'default',
      name: 'Default Provider',
      enabled: true,
      kinds: [...cfg.panelKinds]
    }];
    delete cfg.panelKinds;
  }
}
