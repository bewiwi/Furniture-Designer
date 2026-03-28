/**
 * main.js — Orchestrator and Entry Point
 *
 * Initializes all modules, manages data flow:
 * model → planks → 3D geometry + cut list
 */

import './style.css';
import {
  createFurniture,
  findNodeById,
  subdivide,
  removeSubdivision,
  addSingleChild,
  removeSingleChild,
  resizeChild,
  toggleChildLock,
  reorderChild,
  getNodeDimensions,
  cloneFurniture,
} from './model.js';
import { generatePlanks } from './planks.js';
import { planksToGeometries, highlightCompartment } from './geometry.js';
import { initViewer, updateEntities, fitCamera, setPresetView, setRenderCallback, project3DTo2D } from './viewer.js';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  exportJSON,
  importJSON,
  undo,
  redo,
  canUndo,
  canRedo,
  saveLanguage,
  loadLanguage,
} from './storage.js';
import { exportSTL, exportDXF } from './exporter.js';
import { renderTree } from './ui/tree.js';
import { renderForm } from './ui/form.js';
import { renderToolbar } from './ui/toolbar.js';
import { renderCutList } from './ui/cutlist.js';
import { renderQuotes } from './ui/quotes.js';
import { setLanguage, getLanguage, t } from './i18n.js';

// =============================================================================
// Application State
// =============================================================================

const appState = {
  furniture: null,
  selectedNodeId: null,
  planks: [],
  geometries: [],
};

// =============================================================================
// Initialization
// =============================================================================

function init() {
  // Initialize Language
  const savedLang = loadLanguage();
  setLanguage(savedLang);

  // Set document title
  document.title = t('app.title');

  // Load from localStorage or create default furniture
  const saved = loadFromLocalStorage();
  if (saved) {
    appState.furniture = saved;
  } else {
    appState.furniture = createFurniture(t('app.default_name'), 1000, 2000, 300, 18);
    saveToLocalStorage(appState.furniture);
  }

  // Select root by default
  appState.selectedNodeId = appState.furniture.root.id;

  // Initialize 3D viewer
  const container = document.getElementById('viewer-container');
  if (container) {
    initViewer(container);
    fitCamera(appState.furniture);

    // Attach dynamically projected quotes overlay to the render loop
    setRenderCallback(() => {
      renderQuotes(appState.furniture, appState.selectedNodeId, project3DTo2D);
    });
  }

  // First full update
  fullUpdate();

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);

  console.log('🪵 Furniture Designer initialized');
}

// =============================================================================
// Full Update Cycle
// =============================================================================

function fullUpdate() {
  // 1. Regenerate planks
  appState.planks = generatePlanks(appState.furniture);

  // 2. Convert to geometries
  appState.geometries = planksToGeometries(appState.planks);

  // 3. Add selection highlight for the current compartment
  const allGeometries = [...appState.geometries];
  if (appState.selectedNodeId) {
    const dims = getNodeDimensions(appState.furniture, appState.selectedNodeId);
    if (dims) {
      allGeometries.push(
        highlightCompartment(dims.x, dims.y, dims.w, dims.h, appState.furniture.depth)
      );
    }
  }

  // 4. Update 3D viewer
  updateEntities(allGeometries);

  // 5. Render UI components
  renderToolbar(
    document.getElementById('toolbar'),
    toolbarCallbacks,
    { canUndo: canUndo(), canRedo: canRedo(), currentLang: getLanguage() }
  );

  renderTree(
    document.getElementById('tree-panel'),
    appState.furniture,
    appState.selectedNodeId,
    onSelectNode,
    formCallbacks.onReorderChild
  );

  renderForm(
    document.getElementById('properties-panel'),
    appState.furniture,
    appState.selectedNodeId,
    formCallbacks
  );

  renderCutList(
    document.getElementById('cutlist-panel'),
    appState.planks
  );
}

/**
 * Save state and perform a full update
 */
function saveAndUpdate() {
  saveToLocalStorage(appState.furniture);
  fullUpdate();
}

// =============================================================================
// Callbacks
// =============================================================================

function onSelectNode(nodeId) {
  appState.selectedNodeId = nodeId;
  fullUpdate();
}

const formCallbacks = {
  onChangeFurniture(field, value) {
    appState.furniture[field] = value;
    saveAndUpdate();
  },

  onChangeNodeName(nodeId, newName) {
    const node = nodeId === appState.furniture.root.id
      ? appState.furniture.root
      : findNodeById(appState.furniture.root, nodeId);
    if (!node) return;
    
    node.name = newName;
    saveAndUpdate();
  },

  onSubdivide(nodeId, direction, count) {
    const node = nodeId === appState.furniture.root.id
      ? appState.furniture.root
      : findNodeById(appState.furniture.root, nodeId);

    if (!node) return;

    // Calculate available space
    const dims = getNodeDimensions(appState.furniture, nodeId);
    if (!dims) return;

    const availableSpace = direction === 'row' ? dims.h : dims.w;

    try {
      subdivide(node, direction, count, availableSpace, appState.furniture.thickness);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onRemoveSubdivision(nodeId) {
    const node = nodeId === appState.furniture.root.id
      ? appState.furniture.root
      : findNodeById(appState.furniture.root, nodeId);

    if (!node) return;
    removeSubdivision(node);
    saveAndUpdate();
  },

  onRemoveSingleChild(parentNodeId, childIndex) {
    const node = parentNodeId === appState.furniture.root.id
      ? appState.furniture.root
      : findNodeById(appState.furniture.root, parentNodeId);

    if (!node) return;

    try {
      removeSingleChild(node, childIndex, appState.furniture.thickness);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onResizeChild(parentNodeId, childIndex, newSize) {
    const node = parentNodeId === appState.furniture.root.id
      ? appState.furniture.root
      : findNodeById(appState.furniture.root, parentNodeId);

    if (!node) return;

    try {
      resizeChild(node, childIndex, newSize);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onToggleLock(parentNodeId, childIndex) {
    const node = parentNodeId === appState.furniture.root.id
      ? appState.furniture.root
      : findNodeById(appState.furniture.root, parentNodeId);

    if (!node) return;

    try {
      toggleChildLock(node, childIndex);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onAddSingleChild(parentNodeId) {
    const node = parentNodeId === appState.furniture.root.id
      ? appState.furniture.root
      : findNodeById(appState.furniture.root, parentNodeId);

    if (!node) return;

    try {
      addSingleChild(node, appState.furniture.thickness);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onReorderChild(parentNodeId, oldIndex, newIndex) {
    const node = parentNodeId === appState.furniture.root.id
      ? appState.furniture.root
      : findNodeById(appState.furniture.root, parentNodeId);

    if (!node) return;

    try {
      reorderChild(node, oldIndex, newIndex);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },
};

const toolbarCallbacks = {
  onNew() {
    if (confirm(t('tool.new.confirm'))) {
      appState.furniture = createFurniture(t('app.default_name'), 1000, 2000, 300, 18);
      appState.selectedNodeId = appState.furniture.root.id;
      fitCamera(appState.furniture);
      saveAndUpdate();
    }
  },

  onOpen(file) {
    importJSON(file)
      .then((furniture) => {
        appState.furniture = furniture;
        appState.selectedNodeId = furniture.root.id;
        fitCamera(furniture);
        saveAndUpdate();
      })
      .catch((e) => alert(e.message));
  },

  onSave() {
    exportJSON(appState.furniture);
  },

  onExportSTL() {
    exportSTL(appState.geometries, appState.furniture.name || 'furniture');
  },

  onExportDXF() {
    exportDXF(appState.geometries, appState.furniture.name || 'furniture');
  },

  onUndo() {
    const restored = undo();
    if (restored) {
      appState.furniture = restored;
      appState.selectedNodeId = restored.root.id;
      fullUpdate();
    }
  },

  onRedo() {
    const restored = redo();
    if (restored) {
      appState.furniture = restored;
      appState.selectedNodeId = restored.root.id;
      fullUpdate();
    }
  },

  onSetView(viewName) {
    setPresetView(viewName, appState.furniture);
  },

  onLanguageChange(lang) {
    saveLanguage(lang);
    setLanguage(lang);
    document.title = t('app.title');
    fullUpdate();
  }
};

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

function handleKeyboard(e) {
  // Ctrl+Z -> Undo
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    toolbarCallbacks.onUndo();
  }
  // Ctrl+Y or Ctrl+Shift+Z -> Redo
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
    e.preventDefault();
    toolbarCallbacks.onRedo();
  }
  // Ctrl+S -> Save
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    toolbarCallbacks.onSave();
  }
}

// =============================================================================
// Application Start
// =============================================================================

document.addEventListener('DOMContentLoaded', init);
