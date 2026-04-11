/**
 * src/ui/tools-view.js — 3D Printable Tools View
 *
 * Displays edge and face drilling guides tailored to the current furniture.
 */

import { t } from '../i18n.js';
import { exportSTL } from '../exporter.js';
import { createEdgeGuideGeometry, createFaceGuideGeometry } from '../tools.js';
import { ToolViewer } from '../tool-viewer.js';

let edgeViewer = null;
let faceViewer = null;

export function cleanupToolsView() {
  if (edgeViewer) {
    edgeViewer.destroy();
    edgeViewer = null;
  }
  if (faceViewer) {
    faceViewer.destroy();
    faceViewer = null;
  }
}

export function renderToolsView(container, furniture) {
  if (!container) return;
  cleanupToolsView(); // Reset any existing viewers
  
  const thickness = furniture.thickness;
  const diameter = furniture.dowelConfig ? furniture.dowelConfig.diameter : 8;
  const margin = furniture.dowelConfig ? (furniture.dowelConfig.edgeMargin || furniture.dowelConfig.margin || 50) : 50;

  container.innerHTML = `
    <div class="full-cutlist-container">
      <div class="full-cutlist-header">
        <h2>${t('view.tools')}</h2>
        <div class="full-cutlist-stats">
          <span>${t('tools.description')}</span>
        </div>
      </div>
      <div class="tools-grid">
        
        <!-- Edge Guide Card -->
        <div class="tool-card">
          <div class="card-header">
            <h3>${t('tools.edge_guide.title')}</h3>
            <button class="btn export" id="btn-stl-edge" title="${t('tools.download_stl')}">
              ${t('tools.download_stl')}
            </button>
          </div>
          <div class="tool-content">
            <div class="tool-specs">
              <p>${t('tools.edge_guide.desc')}</p>
              <p style="font-size:12px;color:var(--text-muted);"><i class="fas fa-info-circle"></i> Stops exactly ${margin}mm from the edge.</p>
              ${generateEdgeGuideSVG(thickness, diameter)}
            </div>
            <div class="tool-3d-preview" id="tool-preview-edge"></div>
          </div>
        </div>

        <!-- Face Guide Card -->
        <div class="tool-card">
          <div class="card-header">
            <h3>${t('tools.face_guide.title')}</h3>
            <button class="btn export" id="btn-stl-face" title="${t('tools.download_stl')}">
              ${t('tools.download_stl')}
            </button>
          </div>
          <div class="tool-content">
            <div class="tool-specs">
              <p>${t('tools.face_guide.desc')}</p>
               ${generateFaceGuideSVG(thickness, diameter)}
            </div>
            <div class="tool-3d-preview" id="tool-preview-face"></div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Initialize geometries
  const edgeGeo = createEdgeGuideGeometry(thickness, diameter, margin);
  const faceGeo = createFaceGuideGeometry(thickness, diameter);

  // Initialize Viewers
  const edgeContainer = document.getElementById('tool-preview-edge');
  if (edgeContainer) {
    edgeViewer = new ToolViewer(edgeContainer);
    edgeViewer.updateEntities(edgeGeo);
  }

  const faceContainer = document.getElementById('tool-preview-face');
  if (faceContainer) {
    faceViewer = new ToolViewer(faceContainer);
    faceViewer.updateEntities(faceGeo);
  }

  // Bind Export Buttons
  document.getElementById('btn-stl-edge').onclick = () => {
    exportSTL(edgeGeo, `edge-guide-${thickness}mm-margin${margin}mm`);
  };

  document.getElementById('btn-stl-face').onclick = () => {
    exportSTL(faceGeo, `face-guide-${thickness}mm`);
  };
}

/**
 * Renders an SVG cross-section of the edge guide
 */
function generateEdgeGuideSVG(thickness, diameter) {
  const w = thickness + 8;
  const h = 30; // 20 + 10
  const svgScale = 180 / Math.max(w, h);
  
  const dW = w * svgScale;
  const dH = h * svgScale;
  
  const cw = thickness * svgScale;
  const ch = 20 * svgScale;

  // X center is 150 (SVG width is 300)
  const cx = 150;
  const y0 = 20;

  return `
    <svg viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:300px;">
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,1 L6,3 L0,5 Z" fill="#666"/></marker>
        <marker id="arrow-rev" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto-start-reverse"><path d="M0,1 L6,3 L0,5 Z" fill="#666"/></marker>
      </defs>
      <style>
        .block { fill: rgba(255,140,0,0.1); stroke: #F37021; stroke-width: 2; }
        .quote { stroke: #666; stroke-width: 1; marker-start: url(#arrow-rev); marker-end: url(#arrow); }
        .quote-dash { stroke: #666; stroke-width: 1; stroke-dasharray: 4 4; }
      </style>
      
      <!-- Outer block -->
      <path class="block" d="
        M ${cx - dW/2} ${y0}
        L ${cx + dW/2} ${y0}
        L ${cx + dW/2} ${y0 + dH}
        L ${cx + cw/2} ${y0 + dH}
        L ${cx + cw/2} ${y0 + dH - ch}
        L ${cx - cw/2} ${y0 + dH - ch}
        L ${cx - cw/2} ${y0 + dH}
        L ${cx - dW/2} ${y0 + dH}
        Z" 
      />

      <!-- V-Notch indicators (on side walls) -->
      <line x1="${cx - dW/2 - 25}" y1="${y0 + dH - ch}" x2="${cx - dW/2 - 5}" y2="${y0 + dH - ch}" stroke="#F37021" stroke-width="1.5" marker-end="url(#arrow)" />
      <text x="${cx - dW/2 - 30}" y="${y0 + dH - ch + 3}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#F37021">Encoche</text>

      <line x1="${cx + dW/2 + 25}" y1="${y0 + dH - ch}" x2="${cx + dW/2 + 5}" y2="${y0 + dH - ch}" stroke="#F37021" stroke-width="1.5" marker-end="url(#arrow)" />
      <text x="${cx + dW/2 + 30}" y="${y0 + dH - ch + 3}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#F37021">en V</text>

      <!-- Board slot -->
      <rect x="${cx - cw/2}" y="${y0 + dH - ch}" width="${cw}" height="${ch + 15}" fill="rgba(139,69,19,0.1)" stroke="#8b4513" stroke-width="1" stroke-dasharray="2 2" />

      <!-- Hole -->
      <circle cx="${cx}" cy="${y0}" r="${(diameter/2)*svgScale}" fill="white" stroke="#F37021" stroke-width="1.5" />
      <line class="quote-dash" x1="${cx}" y1="${y0 - 15}" x2="${cx}" y2="${y0 + dH}" />

      <!-- Thickness quote -->
      <line class="quote" x1="${cx - cw/2}" y1="${y0 + dH + 10}" x2="${cx + cw/2}" y2="${y0 + dH + 10}" />
      <text x="${cx}" y="${y0 + dH + 25}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#333">${thickness} mm</text>
    </svg>
  `;
}

/**
 * Renders an SVG cross-section of the face guide
 */
function generateFaceGuideSVG(thickness, diameter) {
  const vH = 30;
  const vT = 5;
  const hL = thickness/2 + 20;
  const hT = 10;
  
  const hO = thickness/2; // hole offset

  const svgScale = 180 / Math.max(hL + vT, vH);
  
  const dvH = vH * svgScale;
  const dvT = vT * svgScale;
  const dhL = hL * svgScale;
  const dhT = hT * svgScale;
  const dhO = hO * svgScale;

  const x0 = 150 - (dhL + dvT)/2;
  const y0 = 50;

  return `
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:300px;">
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,1 L6,3 L0,5 Z" fill="#666"/></marker>
        <marker id="arrow-rev" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto-start-reverse"><path d="M0,1 L6,3 L0,5 Z" fill="#666"/></marker>
      </defs>
      <style>
        .block { fill: rgba(255,140,0,0.1); stroke: #F37021; stroke-width: 2; }
        .quote { stroke: #666; stroke-width: 1; marker-start: url(#arrow-rev); marker-end: url(#arrow); }
        .quote-dash { stroke: #666; stroke-width: 1; stroke-dasharray: 4 4; }
      </style>
      
      <!-- Board representation -->
      <rect x="${x0 + dvT}" y="${y0 + dhT}" width="${dhL + 30}" height="40" fill="rgba(139,69,19,0.1)" stroke="#8b4513" stroke-width="1" stroke-dasharray="2 2" />
      <rect x="${x0 - 40}" y="${y0 + dhT}" width="${40 + dvT}" height="80" fill="rgba(139,69,19,0.1)" stroke="#8b4513" stroke-width="1" stroke-dasharray="2 2" />

      <!-- L Block -->
      <path class="block" d="
        M ${x0} ${y0}
        L ${x0 + dvT + dhL} ${y0}
        L ${x0 + dvT + dhL} ${y0 + dhT}
        L ${x0 + dvT} ${y0 + dhT}
        L ${x0 + dvT} ${y0 + dhT + dvH}
        L ${x0} ${y0 + dhT + dvH}
        Z" 
      />

      <!-- V-Notch indicator -->
      <line x1="${x0 - 20}" y1="${y0 - 20}" x2="${x0 - 2}" y2="${y0 - 2}" stroke="#F37021" stroke-width="1.5" marker-end="url(#arrow)" />
      <text x="${x0 - 25}" y="${y0 - 25}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#F37021">Encoche en V</text>


      <!-- Hole -->
      <line class="quote-dash" x1="${x0 + dvT + dhO}" y1="${y0 - 15}" x2="${x0 + dvT + dhO}" y2="${y0 + dhT + 20}" />
      <!-- Top hole opening -->
      <ellipse cx="${x0 + dvT + dhO}" cy="${y0}" rx="${(diameter/2)*svgScale}" ry="3" fill="white" stroke="#F37021" stroke-width="1.5" />

      <!-- Offset quote (thickness/2) -->
      <line class="quote" x1="${x0 + dvT}" y1="${y0 - 20}" x2="${x0 + dvT + dhO}" y2="${y0 - 20}" />
      <text x="${x0 + dvT + dhO/2}" y="${y0 - 28}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#333">${thickness/2} mm</text>
    </svg>
  `;
}
