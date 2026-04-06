/**
 * viewer.js — 3D Rendering with @jscad/regl-renderer
 *
 * Initializes a WebGL canvas within a container div, handles camera (orbit controls),
 * and displays JSCAD geometries.
 */

import reglRenderer from '@jscad/regl-renderer';
import { getNodeDimensions } from './model.js';
const { prepareRender, drawCommands, cameras, controls, entitiesFromSolids } = reglRenderer;

const perspectiveCamera = cameras.perspective;
const orbitControls = controls.orbit;

/**
 * Viewer State
 */
const state = {
  camera: null,
  controls: null,
  rotateDelta: [0, 0],
  panDelta: [0, 0],
  zoomDelta: 0,
  entities: [],
  render: null,
  container: null,
  animFrame: null,
  isDragging: false,
  dragButton: -1,
  lastMouse: [0, 0],
  initialized: false,
  onRender: null,
  onSelectNode: null,
  resizeObserver: null,
  // Idle throttling: reduce GPU work when nothing is happening
  lastActivityTime: 0,
  dirty: true,
  // Picking support
  mouseStart: [0, 0],
};

// ... (rest of the file constants)

// Idle threshold: after this many ms of no interaction, drop to low-fps mode
const IDLE_THRESHOLD_MS = 2000;
const IDLE_FRAME_INTERVAL_MS = 500; // ~2fps when idle

// Static scene entities (created once, reused every frame to prevent WebGL buffer leaks)
const GRID_ENTITY = Object.freeze({
  visuals: {
    drawCmd: 'drawGrid',
    show: true,
    color: [0.3, 0.3, 0.3, 1],
    subColor: [0.2, 0.2, 0.2, 1],
    fadeOut: true,
    transparent: true,
  },
  size: [5000, 5000],
  ticks: [100, 50],
});

const AXIS_ENTITY = Object.freeze({
  visuals: {
    drawCmd: 'drawAxis',
    show: true,
  },
});

// Pre-allocated DOMMatrix/DOMPoint objects to avoid creating new ones every frame
// Initialized lazily to avoid ReferenceErrors in non-browser environments (like Vitest)
let _viewMatrix, _projMatrix, _point;

function initGlobals() {
  if (_viewMatrix) return;
  if (typeof DOMMatrix !== 'undefined') {
    _viewMatrix = new DOMMatrix();
    _projMatrix = new DOMMatrix();
    _point = new DOMPoint();
  } else {
    // Fallback for Node.js/Vitest
    _viewMatrix = { a: 1 };
    _projMatrix = { a: 1 };
    _point = { x: 0 };
  }
}

/**
 * Initialize the 3D viewer in a container element (div).
 * regl-renderer creates its own canvas inside.
 *
 * @param {HTMLElement} container - The container div
 */
export function initViewer(container) {
  state.container = container;

  // Initialize camera
  state.camera = { ...perspectiveCamera.defaults };
  state.camera.position = [500, 500, 1500];
  state.camera.target = [500, 1000, 150];
  state.camera.up = [0, 1, 0];

  // Initialize orbit controls
  state.controls = { ...orbitControls.defaults };

  // Initialize renderer — container receives an auto-created canvas
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;

  const setupOptions = {
    glOptions: { container },
  };

  state.render = prepareRender(setupOptions);

  // Update projection with correct dimensions
  state.camera.viewport = [0, 0, width, height];

  perspectiveCamera.setProjection(state.camera, state.camera, { width, height });
  perspectiveCamera.update(state.camera);

  // Attach mouse events to the container
  attachMouseEvents(container);

  // Observe container resizes to update projection
  state.resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0 && state.camera) {
        state.camera.viewport = [0, 0, w, h];
        perspectiveCamera.setProjection(state.camera, state.camera, { width: w, height: h });
        perspectiveCamera.update(state.camera);
      }
    }
  });
  state.resizeObserver.observe(container);

  // Start the render loop
  state.initialized = true;
  startRenderLoop();
}

/**
 * Update the geometries to render.
 *
 * @param {Object[]} geometries - JSCAD solids
 */
export function updateEntities(geometries) {
  if (!geometries || geometries.length === 0) {
    state.entities = [];
    state.dirty = true;
    return;
  }

  try {
    state.entities = entitiesFromSolids({}, ...geometries);
    state.dirty = true;
  } catch (e) {
    console.warn('Entity conversion error:', e);
    state.entities = [];
  }
}

/**
 * Re-center the camera to view the entire furniture item.
 *
 * @param {Object} furniture - The furniture object
 */
export function fitCamera(furniture) {
  if (!state.camera) return;

  const cx = furniture.width / 2;
  const cy = furniture.height / 2;
  const cz = furniture.depth / 2;

  // Distance based on largest dimension
  const maxDim = Math.max(furniture.width, furniture.height, furniture.depth);
  const dist = maxDim * 1.8;

  state.camera.position = [cx, cy, dist];
  state.camera.target = [cx, cy, cz];

  // Reset controls
  state.controls = { ...orbitControls.defaults };

  perspectiveCamera.update(state.camera);
}

/**
 * Changes camera view to a preset.
 *
 * @param {string} viewName - "front" | "top" | "right" | "iso"
 * @param {Object} furniture - The furniture object (for centering)
 */
export function setPresetView(viewName, furniture) {
  if (!state.camera || !furniture) return;

  const cx = furniture.width / 2;
  const cy = furniture.height / 2;
  const cz = furniture.depth / 2;
  const maxDim = Math.max(furniture.width, furniture.height, furniture.depth);
  const dist = maxDim * 1.8;

  state.camera.target = [cx, cy, cz];

  switch (viewName) {
    case 'front':
      state.camera.position = [cx, cy, dist];
      state.camera.up = [0, 1, 0];
      break;
    case 'top':
      state.camera.position = [cx, dist, cz];
      state.camera.up = [0, 0, -1];
      break;
    case 'right':
      state.camera.position = [dist, cy, cz];
      state.camera.up = [0, 1, 0];
      break;
    case 'iso':
      state.camera.position = [cx + dist * 0.6, cy + dist * 0.4, dist * 0.7];
      state.camera.up = [0, 1, 0];
      break;
  }

  // Reset controls
  state.controls = { ...orbitControls.defaults };
  perspectiveCamera.update(state.camera);
}

/**
 * Destroy the viewer (cleanup).
 */
export function destroyViewer() {
  if (state.animFrame) {
    cancelAnimationFrame(state.animFrame);
    state.animFrame = null;
  }
  if (state.resizeObserver) {
    state.resizeObserver.disconnect();
    state.resizeObserver = null;
  }
  detachMouseEvents(state.container);
  state.initialized = false;
}

/**
 * Set a callback to be called every render frame (useful for overlays).
 * @param {Function} cb
 */
export function setRenderCallback(cb) {
  state.onRender = cb;
}

/**
 * Set a callback to be called when a 3D element is clicked.
 * @param {Function} cb - (nodeId) => void
 */
export function setOnSelectNode(cb) {
  state.onSelectNode = cb;
}

/**
 * Project a 3D point to 2D screen coordinates using the current camera matrices.
 * Reuses pre-allocated DOMMatrix/DOMPoint objects to avoid GC pressure at 60fps.
 *
 * @param {number} x, y, z
 * @returns {{x, y} | null} Screen coordinates
 */
export const project3DTo2D = (x, y, z) => {
  if (!state.camera || !state.container || !state.camera.projection || !state.camera.view) {
    return null;
  }

  initGlobals();
  if (typeof DOMPoint === 'undefined' || typeof DOMMatrix === 'undefined') return null;

  const w = state.container.clientWidth;
  const h = state.container.clientHeight;

  try {
    // regl-renderer uses column-major arrays
    const viewMatrix = new DOMMatrix(state.camera.view);
    const projMatrix = new DOMMatrix(state.camera.projection);

    const point = new DOMPoint(x, y, z, 1);
    const pv = point.matrixTransform(viewMatrix);
    const pProj = pv.matrixTransform(projMatrix);

    if (pProj.w <= 0) return null;

    const ndcX = pProj.x / pProj.w;
    const ndcY = pProj.y / pProj.w;

    const screenX = ((ndcX + 1) / 2) * w;
    const screenY = ((1 - ndcY) / 2) * h;

    return { x: screenX, y: screenY };
  } catch (err) {
    return null;
  }
}

/**
 * Checks which compartment (if any) is under the given screen coordinates.
 *
 * @param {number} mouseX, mouseY - Screen coordinates
 * @param {Object} furniture - The current furniture model
 * @param {Function} [projectFunc] - Optional projection function (defaults to project3DTo2D)
 * @returns {string|null} Node ID or null
 */
export function getPickedNodeId(mouseX, mouseY, furniture, projectFunc = project3DTo2D) {
  if (!furniture || !furniture.root) return null;

  // 1. Gather all leaf nodes and their 3D boundaries
  const leafNodes = [];
  const traverse = (node) => {
    if (!node.direction || node.children.length === 0) {
      leafNodes.push(node);
    } else {
      for (const child of node.children) {
        traverse(child);
      }
    }
  };
  traverse(furniture.root);

  let bestNodeId = null;
  let minDistance = Infinity;

  // 2. For each leaf, check if mouse is inside its projected front face
  for (const node of leafNodes) {
    const d = getNodeDimensions(furniture, node.id);
    if (!d) continue;

    // Use front face corners at z = depth
    const z = furniture.depth;
    const corners = [
      projectFunc(d.x, d.y, z),
      projectFunc(d.x + d.w, d.y, z),
      projectFunc(d.x + d.w, d.y + d.h, z),
      projectFunc(d.x, d.y + d.h, z),
    ];

    if (corners.some((c) => !c)) continue; 

    // Simple point-in-polygon (winding number or min/max)
    const minX = Math.min(...corners.map((c) => c.x));
    const maxX = Math.max(...corners.map((c) => c.x));
    const minY = Math.min(...corners.map((c) => c.y));
    const maxY = Math.max(...corners.map((c) => c.y));

    if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
      const area = d.w * d.h;
      if (area < minDistance) {
        minDistance = area;
        bestNodeId = node.id;
      }
    }
  }

  return bestNodeId;
}

// =============================================================================
// Mouse Event Handling (Orbit Controls)
// =============================================================================

function markActive() {
  state.lastActivityTime = performance.now();
  state.dirty = true;
}

function onMouseDown(e) {
  e.preventDefault();
  state.isDragging = true;
  state.dragButton = e.button;
  state.lastMouse = [e.clientX, e.clientY];
  state.mouseStart = [e.clientX, e.clientY];
  markActive();
}

function onMouseMove(e) {
  if (!state.isDragging) return;
  e.preventDefault();
  markActive();

  const dx = e.clientX - state.lastMouse[0];
  const dy = e.clientY - state.lastMouse[1];
  state.lastMouse = [e.clientX, e.clientY];

  if (state.dragButton === 0) {
    // Left click -> Rotate
    state.rotateDelta[0] -= dx * 0.15;
    state.rotateDelta[1] -= dy * 0.15;
  } else if (state.dragButton === 1 || state.dragButton === 2) {
    // Middle or right click -> Pan
    state.panDelta[0] += dx * 2;
    state.panDelta[1] -= dy * 2;
  }
}

function onMouseUp(e) {
  if (!state.isDragging) return;

  // Selection Logic: if it's a left click and the mouse hasn't moved much, it's a "click"
  if (state.dragButton === 0 && state.onSelectNode) {
    const dx = Math.abs(e.clientX - state.mouseStart[0]);
    const dy = Math.abs(e.clientY - state.mouseStart[1]);
    
    // Tolerance of 3 pixels to distinguish from tiny movements during clicking
    if (dx < 4 && dy < 4) {
      // We need the furniture object to perform picking. 
      // Since viewer is agnostic of the full app state, we can't easily get it here
      // unless we pass it to the callback or store it in the viewer state.
      // Let's assume the callback will handle the actual picking using getPickedNodeId
      // and providing the current furniture.
      const rect = state.container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      state.onSelectNode(x, y);
    }
  }

  state.isDragging = false;
  state.dragButton = -1;
}

function onWheel(e) {
  e.preventDefault();
  state.zoomDelta -= e.deltaY * 0.1;
  markActive();
}

function onContextMenu(e) {
  e.preventDefault();
}

function attachMouseEvents(el) {
  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('mousemove', onMouseMove);
  el.addEventListener('mouseup', onMouseUp);
  el.addEventListener('mouseleave', onMouseUp);
  el.addEventListener('wheel', onWheel, { passive: false });
  el.addEventListener('contextmenu', onContextMenu);
}

function detachMouseEvents(el) {
  if (!el) return;
  el.removeEventListener('mousedown', onMouseDown);
  el.removeEventListener('mousemove', onMouseMove);
  el.removeEventListener('mouseup', onMouseUp);
  el.removeEventListener('mouseleave', onMouseUp);
  el.removeEventListener('wheel', onWheel);
  el.removeEventListener('contextmenu', onContextMenu);
}

// =============================================================================
// Render Loop
// =============================================================================

function startRenderLoop() {
  let lastIdleRender = 0;

  function loop(timestamp) {
    if (!state.initialized) return;

    const timeSinceActivity = timestamp - state.lastActivityTime;
    const isIdle = timeSinceActivity > IDLE_THRESHOLD_MS;

    if (isIdle && !state.dirty) {
      // In idle mode, only render occasionally to keep the canvas alive
      if (timestamp - lastIdleRender < IDLE_FRAME_INTERVAL_MS) {
        state.animFrame = requestAnimationFrame(loop);
        return;
      }
      lastIdleRender = timestamp;
    }

    updateControls();
    doRender();
    state.dirty = false;
    state.animFrame = requestAnimationFrame(loop);
  }

  state.lastActivityTime = performance.now();
  state.animFrame = requestAnimationFrame(loop);
}

function updateControls() {
  if (!state.camera || !state.controls) return;

  let hasInput = false;

  // Rotation
  if (state.rotateDelta[0] !== 0 || state.rotateDelta[1] !== 0) {
    const result = orbitControls.rotate(
      { controls: state.controls, camera: state.camera, speed: 0.006 },
      state.rotateDelta
    );
    Object.assign(state.controls, result.controls);
    state.rotateDelta = [0, 0];
    hasInput = true;
  }

  // Pan
  if (state.panDelta[0] !== 0 || state.panDelta[1] !== 0) {
    const result = orbitControls.pan(
      { controls: state.controls, camera: state.camera, speed: 1 },
      state.panDelta
    );
    Object.assign(state.controls, result.controls);
    state.camera.position = result.camera.position;
    state.camera.target = result.camera.target;
    state.panDelta = [0, 0];
    hasInput = true;
  }

  // Zoom
  if (state.zoomDelta !== 0) {
    const result = orbitControls.zoom(
      { controls: state.controls, camera: state.camera, speed: 0.1 },
      state.zoomDelta
    );
    Object.assign(state.controls, result.controls);
    state.zoomDelta = 0;
    hasInput = true;
  }

  // Only update orbit physics when there's actual input or deceleration in progress
  // This avoids creating objects every frame when the scene is completely still
  if (hasInput || state.controls.thetaDelta || state.controls.phiDelta || state.controls.scale !== 1) {
    const updated = orbitControls.update({ controls: state.controls, camera: state.camera });
    Object.assign(state.controls, updated.controls);
    state.camera.position = updated.camera.position;
  }

  // Update Camera projection / view matrices
  perspectiveCamera.update(state.camera);
}

// Reuse the same drawCommands reference across frames
const DRAW_COMMANDS = {
  drawGrid: drawCommands.drawGrid,
  drawAxis: drawCommands.drawAxis,
  drawMesh: drawCommands.drawMesh,
};

// Reuse the same entities array to avoid creating a new one every frame
let _renderEntitiesArray = [];

function doRender() {
  if (!state.render || !state.camera) return;

  const container = state.container;
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (width === 0 || height === 0) return;

  // Build entities array in-place to avoid allocation
  _renderEntitiesArray.length = 0;
  _renderEntitiesArray.push(GRID_ENTITY, AXIS_ENTITY);
  for (let i = 0; i < state.entities.length; i++) {
    _renderEntitiesArray.push(state.entities[i]);
  }

  const renderOptions = {
    camera: state.camera,
    drawCommands: DRAW_COMMANDS,
    entities: _renderEntitiesArray,
  };

  try {
    state.render(renderOptions);
    if (state.onRender) state.onRender();
  } catch (e) {
    // Log render errors for debugging (can happen during resize or context loss)
    console.error('Render error:', e.stack || e);
  }
}
