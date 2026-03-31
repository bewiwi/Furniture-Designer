/**
 * src/ui/zoom-modal.js — Full-screen SVG zoom viewer
 *
 * Opens a dark overlay with a cloned SVG drawing.
 * Supports mouse-wheel zoom and click-drag panning
 * via CSS transform for buttery-smooth 60fps interaction.
 */

let modalEl = null;
let portalEl = null;
let svgEl = null;

let scale = 1;
let translateX = 0;
let translateY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTX = 0;
let dragStartTY = 0;

const MIN_SCALE = 0.3;
const MAX_SCALE = 15;
const ZOOM_FACTOR = 1.15;

function applyTransform() {
  if (!svgEl) return;
  svgEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function resetView() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  applyTransform();
}

function closeModal() {
  if (modalEl) modalEl.classList.remove('open');
  isDragging = false;
}

/**
 * Creates the modal DOM skeleton. Call once during app init.
 */
export function initZoomModal() {
  if (modalEl) return; // already initialized

  modalEl = document.createElement('div');
  modalEl.id = 'zoom-modal';
  modalEl.className = 'zoom-modal';
  modalEl.innerHTML = `
    <div class="zoom-modal-backdrop"></div>
    <div class="zoom-portal"></div>
    <div class="zoom-controls">
      <button class="zoom-btn zoom-in" title="Zoom in">+</button>
      <button class="zoom-btn zoom-out" title="Zoom out">−</button>
      <button class="zoom-btn zoom-reset" title="Reset view">⟲</button>
      <button class="zoom-btn zoom-close" title="Close">✕</button>
    </div>
  `;
  document.body.appendChild(modalEl);

  portalEl = modalEl.querySelector('.zoom-portal');
  const backdrop = modalEl.querySelector('.zoom-modal-backdrop');

  // Close on backdrop click
  backdrop.addEventListener('click', closeModal);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.classList.contains('open')) {
      closeModal();
    }
  });

  // Control buttons
  modalEl.querySelector('.zoom-in').addEventListener('click', () => {
    scale = Math.min(MAX_SCALE, scale * ZOOM_FACTOR);
    applyTransform();
  });
  modalEl.querySelector('.zoom-out').addEventListener('click', () => {
    scale = Math.max(MIN_SCALE, scale / ZOOM_FACTOR);
    applyTransform();
  });
  modalEl.querySelector('.zoom-reset').addEventListener('click', resetView);
  modalEl.querySelector('.zoom-close').addEventListener('click', closeModal);

  // Wheel zoom on portal
  portalEl.addEventListener('wheel', (e) => {
    e.preventDefault();
    const oldScale = scale;
    if (e.deltaY < 0) {
      scale = Math.min(MAX_SCALE, scale * ZOOM_FACTOR);
    } else {
      scale = Math.max(MIN_SCALE, scale / ZOOM_FACTOR);
    }

    // Zoom toward cursor position
    const rect = portalEl.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    const ratio = 1 - scale / oldScale;
    translateX += (cx - translateX) * ratio;
    translateY += (cy - translateY) * ratio;

    applyTransform();
  }, { passive: false });

  // Drag panning
  portalEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // left click only
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartTX = translateX;
    dragStartTY = translateY;
    portalEl.style.cursor = 'grabbing';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = dragStartTX + (e.clientX - dragStartX);
    translateY = dragStartTY + (e.clientY - dragStartY);
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      if (portalEl) portalEl.style.cursor = 'grab';
    }
  });

  // Double-click to reset
  portalEl.addEventListener('dblclick', resetView);
}

/**
 * Opens the zoom modal with the given SVG HTML content.
 * @param {string} svgHtml - The innerHTML of the SVG(s) to display
 */
export function openZoomModal(svgHtml) {
  if (!modalEl || !portalEl) return;

  portalEl.innerHTML = svgHtml;
  svgEl = portalEl.querySelector('svg');

  resetView();
  modalEl.classList.add('open');
  portalEl.style.cursor = 'grab';
}
