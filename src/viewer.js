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
};

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
    return;
  }

  try {
    state.entities = entitiesFromSolids({}, ...geometries);
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
  detachMouseEvents(state.container);
  state.initialized = false;
}

// =============================================================================
// Mouse Event Handling (Orbit Controls)
// =============================================================================

function onMouseDown(e) {
  e.preventDefault();
  state.isDragging = true;
  state.dragButton = e.button;
  state.lastMouse = [e.clientX, e.clientY];
}

function onMouseMove(e) {
  if (!state.isDragging) return;
  e.preventDefault();

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
  function loop() {
    if (!state.initialized) return;

    updateControls();
    doRender();
    state.animFrame = requestAnimationFrame(loop);
  }
  state.animFrame = requestAnimationFrame(loop);
}

function updateControls() {
  if (!state.camera || !state.controls) return;

  // Rotation
  if (state.rotateDelta[0] !== 0 || state.rotateDelta[1] !== 0) {
    const result = orbitControls.rotate(
      { controls: state.controls, camera: state.camera, speed: 0.006 },
      state.rotateDelta
    );
    state.controls = { ...state.controls, ...result.controls };
    state.rotateDelta = [0, 0];
  }

  // Pan
  if (state.panDelta[0] !== 0 || state.panDelta[1] !== 0) {
    const result = orbitControls.pan(
      { controls: state.controls, camera: state.camera, speed: 1 },
      state.panDelta
    );
    state.controls = { ...state.controls, ...result.controls };
    state.camera.position = result.camera.position;
    state.camera.target = result.camera.target;
    state.panDelta = [0, 0];
  }

  // Zoom
  if (state.zoomDelta !== 0) {
    const result = orbitControls.zoom(
      { controls: state.controls, camera: state.camera, speed: 0.1 },
      state.zoomDelta
    );
    state.controls = { ...state.controls, ...result.controls };
    state.zoomDelta = 0;
  }

  // Update orbit physics (applies thetaDelta/phiDelta/scale and deceleration)
  const updated = orbitControls.update({ controls: state.controls, camera: state.camera });
  state.controls = { ...state.controls, ...updated.controls };
  state.camera.position = updated.camera.position;

  // Update Camera projection / view matrices
  perspectiveCamera.update(state.camera);
}

function doRender() {
  if (!state.render || !state.camera) return;

  const container = state.container;
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (width === 0 || height === 0) return;

  // Grid
  const gridEntity = {
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
  };

  // Axis
  const axisEntity = {
    visuals: {
      drawCmd: 'drawAxis',
      show: true,
    },
  };

  const renderOptions = {
    camera: state.camera,
    drawCommands: {
      drawGrid: drawCommands.drawGrid,
      drawAxis: drawCommands.drawAxis,
      drawMesh: drawCommands.drawMesh,
    },
    entities: [gridEntity, axisEntity, ...state.entities],
  };

  try {
    state.render(renderOptions);
  } catch (e) {
    // Silently handle render errors (can happen during resize)
  }
}
