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
  equalizeSizes,
  normalizeTree,
  getNodeDimensions,
  cloneFurniture,
  getNodePath,
  resizeNodeRecursively,
} from './model.js';
import { generatePlanks } from './planks.js';
import { planksToGeometries, highlightCompartment } from './geometry.js';
import {
  initViewer,
  updateEntities,
  fitCamera,
  setPresetView,
  setRenderCallback,
  setOnSelectNode,
  getPickedNodeId,
  project3DTo2D,
} from './viewer.js';
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
  saveTheme,
  loadTheme,
} from './storage.js';
import { exportSTL, exportDXF, exportPlan } from './exporter.js';
import { renderTree } from './ui/tree.js';
import { renderForm } from './ui/form.js';
import { renderToolbar } from './ui/toolbar.js';
import { renderCutList } from './ui/cutlist.js';
import { renderFullCutList } from './ui/cutlist-view.js';
import { renderCutPlan } from './ui/cutplan-view.js';
import { renderToolsView, cleanupToolsView } from './ui/tools-view.js';
import { renderQuotes, renderLocks } from './ui/quotes.js';
import { initResizers } from './ui/resizer.js';
import { initZoomModal } from './ui/zoom-modal.js';
import { setLanguage, getLanguage, t } from './i18n.js';
import { groupPlanks } from './planks.js';

// =============================================================================
// Application State
// =============================================================================

const appState = {
  furniture: null,
  selectedNodeId: null,
  planks: [],
  geometries: [],
  currentTheme: 'dark',
  highlightedPlankIds: [],
  currentView: 'design',   // 'design', 'cut-list', 'cut-plan' or 'tools'
  showLocks3D: false,
};

// =============================================================================
// Helpers
// =============================================================================

/** Whitelist of allowed furniture-level fields for direct mutation */
const ALLOWED_FURNITURE_FIELDS = new Set(['name', 'width', 'height', 'depth', 'thickness']);

/**
 * Resolves a node by ID from the furniture tree.
 * Handles the root-vs-child lookup pattern in one place.
 *
 * @param {string} nodeId
 * @returns {Object|null}
 */
function resolveNode(nodeId) {
  if (!appState.furniture) return null;
  return nodeId === appState.furniture.root.id
    ? appState.furniture.root
    : findNodeById(appState.furniture.root, nodeId);
}

// =============================================================================
// Initialization
// =============================================================================

function init() {
  // Initialize Language
  const savedLang = loadLanguage();
  setLanguage(savedLang);

  // Set document title
  document.title = t('app.title');

  // Initialize Theme
  appState.currentTheme = loadTheme();
  if (appState.currentTheme === 'light') {
    document.body.classList.add('theme-light');
  }

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

  // Initialize 3D viewer with error boundary
  const container = document.getElementById('viewer-container');
  if (container) {
    try {
      initViewer(container);
      fitCamera(appState.furniture);

      // Attach dynamically projected quotes overlay to the render loop
      setRenderCallback(() => {
        renderQuotes(appState.furniture, appState.selectedNodeId, project3DTo2D);
        renderLocks(appState.furniture, appState.showLocks3D, project3DTo2D);
      });

      // Handle selection via click on 3D viewer
      setOnSelectNode((x, y) => {
        const pickedId = getPickedNodeId(x, y, appState.furniture);
        if (pickedId) {
          onSelectNode(pickedId);
        } else {
          // Reset selection to root when clicking empty space
          onSelectNode(appState.furniture.root.id);
        }
      });
    } catch (e) {
      console.error('Failed to initialize 3D viewer:', e);
      container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);padding:2em;text-align:center;">⚠️ 3D preview requires WebGL support.<br>Please use a modern browser with hardware acceleration enabled.</div>`;
    }
  }

  // First full update
  fullUpdate();

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);

  // Initialize resizers
  initResizers(document.getElementById('workspace'));

  // Initialize zoom modal for cut list drawings
  initZoomModal();

  document.getElementById('view-cutplan').addEventListener('config-updated', () => {
    saveAndUpdate();
  });

  console.log('🪵 Furniture Designer initialized');
}

// =============================================================================
// Full Update Cycle
// =============================================================================

function fullUpdate() {
  // 1. Regenerate planks
  appState.planks = generatePlanks(appState.furniture);

  // 2. Toggle main views visibility
  const designView = document.getElementById('view-design');
  const cutlistView = document.getElementById('view-cutlist');
  const cutplanView = document.getElementById('view-cutplan');
  const toolsView = document.getElementById('view-tools');

  // Clean up viewers when switching out of tools view
  if (appState.currentView !== 'tools') {
    cleanupToolsView();
  }

  if (appState.currentView === 'design') {
    designView.style.display = '';
    cutlistView.style.display = 'none';
    cutplanView.style.display = 'none';
    toolsView.style.display = 'none';
    
    // Convert to geometries with optional highlighting
    appState.geometries = planksToGeometries(appState.planks, appState.highlightedPlankIds);

    // Add selection highlight for the current compartment
    const allGeometries = [...appState.geometries];
    if (appState.selectedNodeId) {
      const dims = getNodeDimensions(appState.furniture, appState.selectedNodeId);
      if (dims) {
        allGeometries.push(
          highlightCompartment(dims.x, dims.y, dims.w, dims.h, appState.furniture.depth)
        );
      }
    }

    // Update 3D viewer
    updateEntities(allGeometries);
  } else if (appState.currentView === 'cut-list') {
    designView.style.display = 'none';
    toolsView.style.display = 'none';
    cutplanView.style.display = 'none';
    cutlistView.style.display = '';
    renderFullCutList(cutlistView, appState.planks);
  } else if (appState.currentView === 'cut-plan') {
    designView.style.display = 'none';
    toolsView.style.display = 'none';
    cutlistView.style.display = 'none';
    cutplanView.style.display = '';
    renderCutPlan(cutplanView, appState.furniture, appState.planks);
  } else if (appState.currentView === 'tools') {
    designView.style.display = 'none';
    cutlistView.style.display = 'none';
    cutplanView.style.display = 'none';
    toolsView.style.display = '';
    renderToolsView(toolsView, appState.furniture);
  }

  // 5. Render UI components
    renderToolbar(
      document.getElementById('toolbar'),
      toolbarCallbacks,
      {
        canUndo: canUndo(),
        canRedo: canRedo(),
        currentLang: getLanguage(),
        currentTheme: appState.currentTheme,
        currentView: appState.currentView,
        showLocks3D: appState.showLocks3D,
      }
    );

  if (appState.currentView === 'design') {
    renderTree(
      document.getElementById('tree-panel'),
      appState.furniture,
      appState.selectedNodeId,
      onSelectNode,
      formCallbacks.onReorderChild,
      (nodeId) => {
        const node = findNodeById(appState.furniture.root, nodeId);
        if (node) {
          node.collapsed = !node.collapsed;
          saveAndUpdate();
        }
      }
    );

    renderForm(
      document.getElementById('properties-panel'),
      appState.furniture,
      appState.selectedNodeId,
      formCallbacks
    );

    renderCutList(
      document.getElementById('cutlist-panel'),
      appState.planks,
      {
        onHover: (ids) => {
          appState.highlightedPlankIds = ids;
          // We don't want to perform a full re-render of the DOM for a simple hover
          // Update only the 3D geometries for smoothness
          const newGeometries = planksToGeometries(appState.planks, appState.highlightedPlankIds);
          const allNew = [...newGeometries];
          if (appState.selectedNodeId) {
            const dims = getNodeDimensions(appState.furniture, appState.selectedNodeId);
            if (dims) {
              allNew.push(
                highlightCompartment(dims.x, dims.y, dims.w, dims.h, appState.furniture.depth)
              );
            }
          }
          updateEntities(allNew);
        },
        onOpenDetail: (label) => {
          appState.currentView = 'cut-list';
          fullUpdate();
          // Optional: scroll to the specific piece after view switch
          setTimeout(() => {
            const el = document.querySelector(`[data-label="${label}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
        }
      }
    );
  }
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
  appState.selectedNodeId = appState.selectedNodeId === nodeId ? null : nodeId;

  if (appState.selectedNodeId) {
    const path = getNodePath(appState.furniture.root, appState.selectedNodeId);
    if (path) {
      let changed = false;
      for (let i = 0; i < path.length - 1; i++) {
        const ancestor = path[i].node || path[i];
        if (ancestor.collapsed) {
          ancestor.collapsed = false;
          changed = true;
        }
      }
      if (changed) saveToLocalStorage(appState.furniture);
    }
  }

  fullUpdate();
}

const formCallbacks = {
  onChangeFurniture(field, value) {
    if (!ALLOWED_FURNITURE_FIELDS.has(field)) return;
    if (field === 'name') {
      appState.furniture[field] = value;
      saveAndUpdate();
      return;
    }
    // Numeric fields: guard against NaN
    const numVal = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(numVal) || numVal < 1) return;
    appState.furniture[field] = numVal;

    if (field === 'width' || field === 'height' || field === 'thickness') {
      normalizeTree(
        appState.furniture.root,
        appState.furniture.width - 2 * appState.furniture.thickness,
        appState.furniture.height - 2 * appState.furniture.thickness,
        appState.furniture.thickness
      );
    }

    saveAndUpdate();
  },

  onChangeNodeName(nodeId, newName) {
    const node = resolveNode(nodeId);
    if (!node) return;
    
    node.name = newName;
    saveAndUpdate();
  },

  onSubdivide(nodeId, direction, count) {
    const node = resolveNode(nodeId);
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
    const node = resolveNode(nodeId);
    if (!node) return;
    removeSubdivision(node);
    saveAndUpdate();
  },

  onRemoveSingleChild(parentNodeId, childIndex) {
    const node = resolveNode(parentNodeId);
    if (!node) return;

    try {
      removeSingleChild(node, childIndex, appState.furniture.thickness);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onResizeChild(parentNodeId, childIndex, newSize) {
    const node = resolveNode(parentNodeId);
    if (!node) return;

    try {
      const childNode = node.children[childIndex];
      resizeNodeRecursively(appState.furniture.root, childNode.id, newSize);
      
      // We must normalize the tree starting from the parent to cascade size limits to children
      normalizeTree(
        appState.furniture.root,
        appState.furniture.width - 2 * appState.furniture.thickness,
        appState.furniture.height - 2 * appState.furniture.thickness,
        appState.furniture.thickness
      );

      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onToggleLock(parentNodeId, childIndex) {
    const node = resolveNode(parentNodeId);
    if (!node) return;

    try {
      toggleChildLock(node, childIndex);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onAddSingleChild(parentNodeId) {
    const node = resolveNode(parentNodeId);
    if (!node) return;

    try {
      addSingleChild(node, appState.furniture.thickness);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onReorderChild(parentNodeId, oldIndex, newIndex) {
    const node = resolveNode(parentNodeId);
    if (!node) return;

    try {
      reorderChild(node, oldIndex, newIndex);
      saveAndUpdate();
    } catch (e) {
      alert(e.message);
    }
  },

  onEqualizeSizes(nodeId) {
    const node = resolveNode(nodeId);
    if (!node) return;

    const dims = getNodeDimensions(appState.furniture, nodeId);
    if (!dims) return;

    const availableSpace = node.direction === 'row' ? dims.h : dims.w;
    equalizeSizes(node, availableSpace, appState.furniture.thickness);
    saveAndUpdate();
  },

  onChangeDowelConfig(key, value) {
    if (!appState.furniture.dowelConfig) {
      appState.furniture.dowelConfig = { diameter: 8, depth: 15, edgeMargin: 50, spacing: 200 };
    }
    appState.furniture.dowelConfig[key] = value;
    saveAndUpdate();
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

  onExportPlan() {
    exportPlan(appState.furniture, appState.planks);
  },

  onUndo() {
    const restored = undo();
    if (restored) {
      appState.furniture = restored;
      // Preserve selection if the node still exists, otherwise reset to root
      if (!findNodeById(restored.root, appState.selectedNodeId)) {
        appState.selectedNodeId = restored.root.id;
      }
      fullUpdate();
    }
  },

  onRedo() {
    const restored = redo();
    if (restored) {
      appState.furniture = restored;
      // Preserve selection if the node still exists, otherwise reset to root
      if (!findNodeById(restored.root, appState.selectedNodeId)) {
        appState.selectedNodeId = restored.root.id;
      }
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
  },

  onThemeToggle() {
    appState.currentTheme = appState.currentTheme === 'light' ? 'dark' : 'light';
    saveTheme(appState.currentTheme);
    document.body.classList.toggle('theme-light', appState.currentTheme === 'light');
    fullUpdate();
  },

  onChangeView(view) {
    appState.currentView = view;
    fullUpdate();
  },

  onToggleLocks() {
    appState.showLocks3D = !appState.showLocks3D;
    fullUpdate();
  }
};

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

function handleKeyboard(e) {
  // Don't intercept shortcuts when user is typing in form fields
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  // Support both Ctrl (Windows/Linux) and ⌘/Meta (macOS)
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  // Ctrl/⌘+Z -> Undo
  if (mod && key === 'z' && !e.shiftKey) {
    e.preventDefault();
    toolbarCallbacks.onUndo();
  }
  // Ctrl/⌘+Y or Ctrl/⌘+Shift+Z -> Redo
  if ((mod && key === 'y') || (mod && e.shiftKey && key === 'z')) {
    e.preventDefault();
    toolbarCallbacks.onRedo();
  }
  // Ctrl/⌘+S -> Save
  if (mod && key === 's') {
    e.preventDefault();
    toolbarCallbacks.onSave();
  }
}

// =============================================================================
// Application Start
// =============================================================================

document.addEventListener('DOMContentLoaded', init);
