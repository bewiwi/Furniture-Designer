/**
 * viewer.js — 3D Rendering with @jscad/regl-renderer
 *
 * Initializes a WebGL canvas within a container div, handles camera (orbit controls),
 * and displays JSCAD geometries.
 */

import reglRenderer from '@jscad/regl-renderer';
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
  resizeObserver: null,
  // Idle throttling: reduce GPU work when nothing is happening
  lastActivityTime: 0,
  dirty: true,
};

// Idle threshold: after this many ms of no interaction, drop to low-fps mode
const IDLE_THRESHOLD_MS = 2000;
const IDLE_FRAME_INTERVAL_MS = 500; // ~2fps when idle

// Pre-allocated DOMMatrix/DOMPoint objects to avoid creating new ones every frame
const _viewMatrix = new DOMMatrix();
const _projMatrix = new DOMMatrix();
const _point = new DOMPoint();

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
 * Project a 3D point to 2D screen coordinates using the current camera matrices.
 * Reuses pre-allocated DOMMatrix/DOMPoint objects to avoid GC pressure at 60fps.
 *
 * @param {number} x, y, z
 * @returns {{x, y} | null} Screen coordinates
 */
export function project3DTo2D(x, y, z) {
  if (!state.camera || !state.container || !state.camera.projection || !state.camera.view) {
    return null;
  }

  const w = state.container.clientWidth;
  const h = state.container.clientHeight;

  // Reuse pre-allocated matrices — avoids creating new DOMMatrix/DOMPoint every frame
  _viewMatrix.a = 1; // Reset by loading from typed array
  const viewArr = state.camera.view;
  _viewMatrix.m11 = viewArr[0];  _viewMatrix.m12 = viewArr[1];  _viewMatrix.m13 = viewArr[2];  _viewMatrix.m14 = viewArr[3];
  _viewMatrix.m21 = viewArr[4];  _viewMatrix.m22 = viewArr[5];  _viewMatrix.m23 = viewArr[6];  _viewMatrix.m24 = viewArr[7];
  _viewMatrix.m31 = viewArr[8];  _viewMatrix.m32 = viewArr[9];  _viewMatrix.m33 = viewArr[10]; _viewMatrix.m34 = viewArr[11];
  _viewMatrix.m41 = viewArr[12]; _viewMatrix.m42 = viewArr[13]; _viewMatrix.m43 = viewArr[14]; _viewMatrix.m44 = viewArr[15];

  const projArr = state.camera.projection;
  _projMatrix.m11 = projArr[0];  _projMatrix.m12 = projArr[1];  _projMatrix.m13 = projArr[2];  _projMatrix.m14 = projArr[3];
  _projMatrix.m21 = projArr[4];  _projMatrix.m22 = projArr[5];  _projMatrix.m23 = projArr[6];  _projMatrix.m24 = projArr[7];
  _projMatrix.m31 = projArr[8];  _projMatrix.m32 = projArr[9];  _projMatrix.m33 = projArr[10]; _projMatrix.m34 = projArr[11];
  _projMatrix.m41 = projArr[12]; _projMatrix.m42 = projArr[13]; _projMatrix.m43 = projArr[14]; _projMatrix.m44 = projArr[15];

  _point.x = x; _point.y = y; _point.z = z; _point.w = 1;
  const pv = _point.matrixTransform(_viewMatrix);
  const pProj = pv.matrixTransform(_projMatrix);

  // Behind camera
  if (pProj.w <= 0) return null;

  const ndcX = pProj.x / pProj.w;
  const ndcY = pProj.y / pProj.w;

  const screenX = ((ndcX + 1) / 2) * w;
  const screenY = ((1 - ndcY) / 2) * h;

  return { x: screenX, y: screenY };
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

function onMouseUp() {
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
    console.warn('Render error:', e.message || e);
  }
}
