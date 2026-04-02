/**
 * tool-viewer.js — Dedicated 3D viewer for printable tools
 *
 * A lightweight wrapper around @jscad/regl-renderer without the selection
 * and picking logic. Used in the "Tools" properties panel.
 */

import reglRenderer from '@jscad/regl-renderer';
const { prepareRender, drawCommands, cameras, controls, entitiesFromSolids } = reglRenderer;

const perspectiveCamera = cameras.perspective;
const orbitControls = controls.orbit;

export class ToolViewer {
  constructor(container) {
    this.container = container;
    this.state = {
      camera: { ...perspectiveCamera.defaults },
      controls: { ...orbitControls.defaults },
      rotateDelta: [0, 0],
      panDelta: [0, 0],
      zoomDelta: 0,
      entities: [],
      render: null,
      animFrame: null,
      isDragging: false,
      dragButton: -1,
      lastMouse: [0, 0],
      initialized: false,
    };

    // Idle optimization
    this.lastActivityTime = 0;
    this.dirty = true;
    this.IDLE_THRESHOLD_MS = 2000;
    this.IDLE_FRAME_INTERVAL_MS = 500;

    // Grid and Axis - we want to show it, similar to main viewer
    this.gridEntity = {
      visuals: {
        drawCmd: 'drawGrid',
        show: true,
        color: [0.3, 0.3, 0.3, 1],
        subColor: [0.2, 0.2, 0.2, 1],
        fadeOut: true,
        transparent: true,
      },
      size: [500, 500],
      ticks: [50, 10],
    };

    this.axisEntity = {
      visuals: {
        drawCmd: 'drawAxis',
        show: true,
      },
    };

    // Bind event handlers
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.loop = this.loop.bind(this);

    this.init();
  }

  init() {
    this.state.camera.position = [150, 150, 200];
    this.state.camera.target = [0, 0, 0];
    this.state.camera.up = [0, 1, 0]; // Match viewer.js exactly for consistent mouse direction

    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 300;

    const setupOptions = {
      glOptions: { container: this.container },
    };

    this.state.render = prepareRender(setupOptions);

    this.state.camera.viewport = [0, 0, width, height];
    perspectiveCamera.setProjection(this.state.camera, this.state.camera, { width, height });
    perspectiveCamera.update(this.state.camera);

    this.attachMouseEvents();

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && this.state.camera) {
          this.state.camera.viewport = [0, 0, w, h];
          perspectiveCamera.setProjection(this.state.camera, this.state.camera, { width: w, height: h });
          perspectiveCamera.update(this.state.camera);
          this.markActive();
        }
      }
    });
    this.resizeObserver.observe(this.container);

    this.state.initialized = true;
    this.startRenderLoop();
  }

  updateEntities(geometries) {
    if (!geometries || geometries.length === 0) {
      this.state.entities = [];
      this.dirty = true;
      return;
    }
    try {
      this.state.entities = entitiesFromSolids({}, ...geometries);
      
      // Auto-fit bounds
      // We will just set a reasonable distance
      this.state.camera.position = [100, 80, 100];
      this.state.camera.target = [20, 20, 0];
      this.state.camera.up = [0, 1, 0]; // Ensure it stays consistent if reset
      this.state.controls = { ...orbitControls.defaults };
      perspectiveCamera.update(this.state.camera);

      this.dirty = true;
      this.markActive();
    } catch (e) {
      console.warn('Tool viewer entity conversion error:', e);
      this.state.entities = [];
    }
  }

  destroy() {
    if (this.state.animFrame) {
      cancelAnimationFrame(this.state.animFrame);
      this.state.animFrame = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.detachMouseEvents();
    this.state.initialized = false;
  }

  // --- Controls ---
  markActive() {
    this.lastActivityTime = performance.now();
    this.dirty = true;
  }

  onMouseDown(e) {
    e.preventDefault();
    this.state.isDragging = true;
    this.state.dragButton = e.button;
    this.state.lastMouse = [e.clientX, e.clientY];
    this.markActive();
  }

  onMouseMove(e) {
    if (!this.state.isDragging) return;
    e.preventDefault();
    this.markActive();

    const dx = e.clientX - this.state.lastMouse[0];
    const dy = e.clientY - this.state.lastMouse[1];
    this.state.lastMouse = [e.clientX, e.clientY];

    if (this.state.dragButton === 0) {
      this.state.rotateDelta[0] -= dx * 0.15;
      this.state.rotateDelta[1] -= dy * 0.15;
    } else if (this.state.dragButton === 1 || this.state.dragButton === 2) {
      this.state.panDelta[0] += dx * 2;
      this.state.panDelta[1] -= dy * 2;
    }
  }

  onMouseUp(e) {
    this.state.isDragging = false;
    this.state.dragButton = -1;
  }

  onWheel(e) {
    e.preventDefault();
    this.state.zoomDelta -= e.deltaY * 0.1;
    this.markActive();
  }

  onContextMenu(e) {
    e.preventDefault();
  }

  attachMouseEvents() {
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mousemove', this.onMouseMove);
    this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mouseleave', this.onMouseUp);
    this.container.addEventListener('wheel', this.onWheel, { passive: false });
    this.container.addEventListener('contextmenu', this.onContextMenu);
  }

  detachMouseEvents() {
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mouseleave', this.onMouseUp);
    this.container.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('contextmenu', this.onContextMenu);
  }

  // --- Loop ---
  startRenderLoop() {
    this.lastActivityTime = performance.now();
    this.lastIdleRender = 0;
    this.state.animFrame = requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    if (!this.state.initialized) return;

    const timeSinceActivity = timestamp - this.lastActivityTime;
    const isIdle = timeSinceActivity > this.IDLE_THRESHOLD_MS;

    if (isIdle && !this.dirty) {
      if (timestamp - this.lastIdleRender < this.IDLE_FRAME_INTERVAL_MS) {
        this.state.animFrame = requestAnimationFrame(this.loop);
        return;
      }
      this.lastIdleRender = timestamp;
    }

    this.updateControls();
    this.doRender();
    this.dirty = false;
    this.state.animFrame = requestAnimationFrame(this.loop);
  }

  updateControls() {
    let hasInput = false;

    if (this.state.rotateDelta[0] !== 0 || this.state.rotateDelta[1] !== 0) {
      const result = orbitControls.rotate(
        { controls: this.state.controls, camera: this.state.camera, speed: 0.006 },
        this.state.rotateDelta
      );
      Object.assign(this.state.controls, result.controls);
      this.state.rotateDelta = [0, 0];
      hasInput = true;
    }

    if (this.state.panDelta[0] !== 0 || this.state.panDelta[1] !== 0) {
      const result = orbitControls.pan(
        { controls: this.state.controls, camera: this.state.camera, speed: 1 },
        this.state.panDelta
      );
      Object.assign(this.state.controls, result.controls);
      this.state.camera.position = result.camera.position;
      this.state.camera.target = result.camera.target;
      this.state.panDelta = [0, 0];
      hasInput = true;
    }

    if (this.state.zoomDelta !== 0) {
      const result = orbitControls.zoom(
        { controls: this.state.controls, camera: this.state.camera, speed: 0.1 },
        this.state.zoomDelta
      );
      Object.assign(this.state.controls, result.controls);
      this.state.zoomDelta = 0;
      hasInput = true;
    }

    if (hasInput || this.state.controls.thetaDelta || this.state.controls.phiDelta || this.state.controls.scale !== 1) {
      const updated = orbitControls.update({ controls: this.state.controls, camera: this.state.camera });
      Object.assign(this.state.controls, updated.controls);
      this.state.camera.position = updated.camera.position;
    }

    perspectiveCamera.update(this.state.camera);
  }

  doRender() {
    if (!this.state.render || !this.state.camera) return;

    if (this.container.clientWidth === 0 || this.container.clientHeight === 0) return;

    const renderEntitiesArray = [this.gridEntity, this.axisEntity, ...this.state.entities];

    const renderOptions = {
      camera: this.state.camera,
      drawCommands: {
        drawGrid: drawCommands.drawGrid,
        drawAxis: drawCommands.drawAxis,
        drawMesh: drawCommands.drawMesh,
      },
      entities: renderEntitiesArray,
    };

    try {
      this.state.render(renderOptions);
    } catch (e) {
      console.warn('Tool renderer error:', e.message || e);
    }
  }
}
