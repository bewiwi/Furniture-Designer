/**
 * objects-overlay.js — Projects physical objects via CSS onto the 3D scene.
 */

import { getNodeDimensions } from '../model.js';
import { OBJECT_CATALOG } from '../objects.js';

/**
 * Projects physical objects to screen coordinates and renders them via DOM.
 * @param {Object} furniture 
 * @param {Function} project3DTo2D 
 */
export function renderObjectsOverlay(furniture, project3DTo2D) {
  let layer = document.getElementById('objects-overlay-layer');
  if (!layer) {
    const viewerPanel = document.getElementById('viewer-panel');
    if (!viewerPanel) return;
    layer = document.createElement('div');
    layer.id = 'objects-overlay-layer';
    layer.style.position = 'absolute';
    layer.style.top = '0';
    layer.style.left = '0';
    layer.style.width = '100%';
    layer.style.height = '100%';
    layer.style.pointerEvents = 'none';
    layer.style.overflow = 'hidden';
    viewerPanel.appendChild(layer);
  }

  // Clear existing
  layer.innerHTML = '';

  const rect = layer.getBoundingClientRect();
  const hw = rect.width / 2;
  const hh = rect.height / 2;

  // Collect all objects
  function walk(node) {
    if (node.objects && node.objects.length > 0) {
      const dims = getNodeDimensions(furniture, node.id);
      
      node.objects.forEach(obj => {
        const catItem = OBJECT_CATALOG.find(c => c.id === obj.id);
        if (!catItem) return;

        // Base resting point in pure 3D coords
        // Assuming thickness is furniture.thickness. (Wait, dims already includes local boundaries, but planks use thickness)
        // Wait, dims.y is the inner boundary if we just use dims. Actually dims are outer.
        // Let's use simple positioning:
        const T = furniture.thickness;
        
        const y = dims.y + T + catItem.h / 2;
        const z = T + catItem.d / 2; // Against the back panel
        
        let x = dims.x + dims.w / 2; // Center
        if (obj.align === 'left') {
          x = dims.x + T + catItem.w / 2;
        } else if (obj.align === 'right') {
          x = dims.x + dims.w - T - catItem.w / 2;
        }

        // Project center coordinate
        const screenCenter = project3DTo2D([x, y, z]);
        if (!screenCenter) return; // behind camera

        // Calculate visual pixel width safely using two projected boundaries along X axis
        const screenLeft = project3DTo2D([x - catItem.w / 2, y, z]);
        const screenRight = project3DTo2D([x + catItem.w / 2, y, z]);
        
        let pixelWidth = 100; // fallback
        if (screenLeft && screenRight) {
           pixelWidth = Math.abs((screenRight[0] * hw + hw) - (screenLeft[0] * hw + hw));
        }

        // Convert center projected coords to browser pixel coords
        const pxX = screenCenter[0] * hw + hw;
        const pxY = -(screenCenter[1] * hh) + hh;

        const objDiv = document.createElement('div');
        objDiv.style.position = 'absolute';
        objDiv.style.left = pxX + 'px';
        objDiv.style.top = pxY + 'px';
        // The transform -50, -50 centers the div on the coordinate
        objDiv.style.transform = 'translate(-50%, -50%)';
        objDiv.style.width = pixelWidth + 'px';
        objDiv.style.display = 'flex';
        objDiv.style.justifyContent = 'center';
        objDiv.style.alignItems = 'flex-end'; // Objects sit on their base internally

        objDiv.innerHTML = catItem.svg;
        
        // ensure SVG scales to fit correctly
        const svgEl = objDiv.querySelector('svg');
        if (svgEl) {
          svgEl.style.width = '100%';
          svgEl.style.height = 'auto';
        }

        layer.appendChild(objDiv);
      });
    }

    if (node.children) node.children.forEach(walk);
  }

  walk(furniture.root);
}
