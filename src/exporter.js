/**
 * exporter.js — STL and DXF export logic
 *
 * Uses JSCAD serializers to generate downloadable files.
 */

import jscadStlSerializer from '@jscad/stl-serializer';
import jscadDxfSerializer from '@jscad/dxf-serializer';
import { downloadBlob, sanitizeFileName } from './utils.js';
import { generateCutListHtml } from './ui/cutlist.js';
import { generatePieceViews } from './ui/piece-svg.js';
import { getNodeDimensions } from './model.js';
import { groupPlanks } from './planks.js';
import { t } from './i18n.js';

/**
 * Exports geometries to an STL file.
 *
 * @param {Object[]} geometries - JSCAD solids
 * @param {string} fileName - Base name for the file
 */
export function exportSTL(geometries, fileName = 'furniture') {
  if (!geometries || geometries.length === 0) return;

  const rawData = jscadStlSerializer.serialize({ binary: true }, ...geometries);
  const blob = new Blob(rawData, { type: 'application/sla' });
  downloadBlob(blob, `${sanitizeFileName(fileName)}.stl`);
}

/**
 * Exports geometries to a DXF file.
 * Note: DXF is best for 2D projections, here it exports the 3D solids.
 *
 * @param {Object[]} geometries - JSCAD solids
 * @param {string} fileName - Base name for the file
 */
export function exportDXF(geometries, fileName = 'furniture') {
  if (!geometries || geometries.length === 0) return;

  const rawData = jscadDxfSerializer.serialize({}, ...geometries);
  const blob = new Blob(rawData, { type: 'application/dxf' });
  downloadBlob(blob, `${sanitizeFileName(fileName)}.dxf`);
}

/**
 * Generates a printable plan with a 2D technical drawing and the cut list.
 *
 * @param {Object} furniture - The complete furniture object
 * @param {Object[]} planks - All furniture planks
 */
export function exportPlan(furniture, planks) {
  const { width: W, height: H } = furniture;
  
  // Dynamic scale for text and padding based on furniture size
  // Slower growth for very large pieces
  const baseScale = Math.pow(Math.max(W, H) / 1000, 0.7); 
  const padding = 150 * baseScale;
  const fontSize = Math.max(22, 26 * baseScale);
  const strokeWidth = Math.max(1.2, 1.8 * baseScale);
  const markerSize = Math.max(8, 12 * baseScale);
  const quoteOffset = 80 * baseScale;
  
  // 1. Generate SVG content
  let svgInner = '';
  
  // Draw Planks (rects)
  for (const p of planks) {
    // Front view: we use x, y, w, h. 
    // In SVG, y=0 is top, so we invert Y coordinate: H - p.y - p.h
    svgInner += `<rect x="${p.x}" y="${H - p.y - p.h}" width="${p.w}" height="${p.h}" style="fill:none; stroke:black; stroke-width:${strokeWidth}" />\n`;
  }

  // Header with definitions and styles
  const svgHeader = `
    <defs>
      <marker id="arrow" markerWidth="${markerSize}" markerHeight="${markerSize}" refX="${markerSize}" refY="${markerSize/2}" orient="auto">
        <path d="M0,${markerSize*0.3} L${markerSize},${markerSize/2} L0,${markerSize*0.7} Z" fill="#666" />
      </marker>
      <marker id="arrow-rev" markerWidth="${markerSize}" markerHeight="${markerSize}" refX="0" refY="${markerSize/2}" orient="auto-start-reverse">
        <path d="M0,${markerSize*0.3} L${markerSize},${markerSize/2} L0,${markerSize*0.7} Z" fill="#666" />
      </marker>
    </defs>
    <style>
      .quote-line { stroke: #666; stroke-width: ${strokeWidth * 0.5}; marker-start: url(#arrow-rev); marker-end: url(#arrow); }
      .quote-text { fill: #000; font-family: sans-serif; font-size: ${fontSize}px; text-anchor: middle; font-weight: bold; }
    </style>
  `;

  // --- External Global Quotes ---
  svgInner += drawSvgQuote(0, -quoteOffset, W, -quoteOffset, W, 'h', fontSize);
  svgInner += drawSvgQuote(-quoteOffset, 0, -quoteOffset, H, H, 'v', fontSize);

  // --- Chain Dimensioning (Recursive) ---
  const drawChainQuotes = (node) => {
    if (!node.direction || node.children.length < 1) return;

    const d = getNodeDimensions(furniture, node.id);
    if (!d) return;

    const T = furniture.thickness;

    if (node.direction === 'col') {
      // Draw a chain of width dimensions at the top of this compartment
      let currentX = d.x;
      const yPos = H - (d.y + d.h) + (20 * baseScale); // Slightly inside from top

      for (let i = 0; i < node.sizes.length; i++) {
        const size = node.sizes[i];
        if (size > 40) {
          svgInner += drawSvgQuote(currentX, yPos, currentX + size, yPos, size, 'h', fontSize);
        }
        currentX += size + T;
      }
    } else if (node.direction === 'row') {
      // Draw a chain of height dimensions at the left of this compartment
      let currentY = d.y;
      const xPos = d.x + (20 * baseScale); // Slightly inside from left

      for (let i = 0; i < node.sizes.length; i++) {
        const size = node.sizes[i];
        // In SVG, Y is inverted: H - (y + h)
        if (size > 40) {
          const svgYStart = H - currentY;
          const svgYEnd = H - (currentY + size);
          svgInner += drawSvgQuote(xPos, svgYStart, xPos, svgYEnd, size, 'v', fontSize);
        }
        currentY += size + T;
      }
    }

    // Recurse
    node.children.forEach(drawChainQuotes);
  };
  
  drawChainQuotes(furniture.root);

  const fullSvg = `<svg viewBox="-${padding} -${padding} ${W + 2*padding} ${H + 2*padding}" xmlns="http://www.w3.org/2000/svg">
    ${svgHeader}
    ${svgInner}
  </svg>`;

  // 2. Generate HTML
  const cutlistHtml = generateCutListHtml(planks, { splitByHoles: true });
  const grouped = groupPlanks(planks, { splitByHoles: true });

  // Build plank lookup for hole data
  const plankById = new Map();
  for (const p of planks) {
    plankById.set(p.id, p);
  }

  let partsDetailHtml = '';
  for (const g of grouped) {
    const dims = [g.w, g.h, g.d].sort((a, b) => b - a);
    const L = Math.round(dims[0]);
    const W = Math.round(dims[1]);
    const T = Math.round(dims[2]);

    // Get representative plank for hole data
    const representativePlank = plankById.get(g.ids[0]);
    const holeCount = representativePlank?.holes?.length || 0;

    let holesRow = '';
    if (holeCount > 0) {
      holesRow = `<tr><th>${t('piece_detail.holes')}</th><td>${t('piece_detail.hole_spec', {
        count: holeCount,
        diameter: representativePlank.holes[0].diameter,
        depth: representativePlank.holes[0].depth,
      })}</td></tr>`;
    }

    partsDetailHtml += `
      <div class="part-page">
        <div class="part-header">
          <h3>${t('piece_detail.title', { label: g.label, name: t(g.name) })}</h3>
          <span class="badge ${g.type}">${t(`type.${g.type}`)}</span>
        </div>
        <div class="part-content">
          <div class="part-drawing">
            ${generatePieceViews(L, W, g.label, representativePlank)}
          </div>
          <div class="part-info">
            <table class="detail-table">
              <tr><th>${t('piece_detail.quantity')}</th><td><strong>${g.count}</strong></td></tr>
              <tr><th>${t('cutlist.length')}</th><td>${L} mm</td></tr>
              <tr><th>${t('cutlist.width')}</th><td>${W} mm</td></tr>
              <tr><th>${t('cutlist.thickness')}</th><td>${T} mm</td></tr>
              <tr><th>${t('piece_detail.total_area')}</th><td>${g.totalArea.toFixed(2)} m²</td></tr>
              ${holesRow}
            </table>
          </div>
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${furniture.name} - Plan</title>
      <style>
        @page { size: A4; margin: 1cm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 1000px; margin: 0 auto; padding: 20px; }
        h1 { margin: 0; border-bottom: 3px solid #333; padding-bottom: 10px; }
        .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 30px; }
        .drawing { text-align: center; margin: 40px 0; background: #fff; padding: 20px; border: 1px solid #eee; }
        svg { width: 100%; height: auto; max-height: 70vh; }
        .cutlist-container { margin-top: 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .badge.frameV, .badge.frameH { background: #e9ecef; }
        .badge.shelf { background: #cfe2ff; color: #084298; }
        .badge.separator { background: #f8d7da; color: #842029; }
        .stats { margin-top: 20px; font-size: 1.1em; font-weight: bold; border-top: 2px solid #eee; padding-top: 15px; }

        /* Detailed Parts Styles */
        .parts-container { margin-top: 50px; }
        .part-page { page-break-before: always; margin-top: 40px; border-top: 1px solid #eee; padding-top: 30px; }
        .part-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .part-header h3 { margin: 0; color: #333; font-size: 1.4em; }
        .part-content { display: grid; grid-template-columns: 1fr 250px; gap: 30px; align-items: start; }
        .part-drawing { background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; padding: 15px; display: flex; justify-content: center; }
        .part-drawing svg { width: 100%; height: auto; max-height: 400px; }
        .detail-table { width: 100%; border-collapse: collapse; }
        .detail-table th, .detail-table td { border: none; border-bottom: 1px solid #eee; padding: 8px 0; text-align: left; }
        .detail-table th { width: 120px; font-size: 0.85em; color: #666; text-transform: uppercase; }
        .detail-table td { font-size: 1.1em; color: #333; }

        .no-print { background: #333; color: white; padding: 15px; border-radius: 8px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        .btn-print { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1em; }
        .btn-print:hover { background: #218838; }
        #btn-toggle-cutlist { display: none; }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
          .drawing { border: none; padding: 0; }
          .cutlist-container { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <span>${t('tool.export_plan.title')}</span>
        <button class="btn-print" onclick="window.print()">${t('tool.export_plan')}</button>
      </div>
      <div class="header">
        <h1>${furniture.name}</h1>
        <span>${new Date().toLocaleDateString()}</span>
      </div>
      
      <div class="drawing">
        <h2>${t('tool.view.front')}</h2>
        ${fullSvg}
      </div>

      <div class="cutlist-container">
        <h2>Cut List</h2>
        ${cutlistHtml}
      </div>

      <div class="parts-container">
        <h2>Detailed Parts</h2>
        ${partsDetailHtml}
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}


/**
 * Helper to draw a dimension line with arrows and text in SVG.
 */
function drawSvgQuote(x1, y1, x2, y2, value, dir, fontSize) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    let textX = midX;
    let textY = midY;
    let rotate = 0;

    const textOffset = fontSize * 0.6;
    const bgW = fontSize * 2.5;
    const bgH = fontSize * 1.2;

    if (dir === 'h') {
        textY -= textOffset;
    } else {
        textX -= textOffset;
        rotate = -90;
    }

    const roundedValue = Math.round(value);

    return `
      <g>
        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="quote-line" />
        <rect x="${textX - bgW/2}" y="${textY - bgH/2}" width="${bgW}" height="${bgH}" fill="white" fill-opacity="1.0" />
        <text x="${textX}" y="${textY + fontSize*0.35}" class="quote-text" ${rotate ? `transform="rotate(${rotate}, ${textX}, ${textY + fontSize*0.35})"` : ''}>${roundedValue}</text>
      </g>
    `;
}
