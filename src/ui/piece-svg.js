/**
 * src/ui/piece-svg.js — Technical drawing SVG for individual planks.
 *
 * Renders a plank as an unfolded box (main face + 4 edges) with:
 *   - Dimension lines (standard quote arrows)
 *   - Assembly holes (red ⊕ crosshairs)
 *   - Hole dimension quotes (green dashed lines)
 *   - Hole specification labels (e.g., "2× Ø8 ↧15")
 *
 * When a plank has face holes on BOTH wide faces, two separate views
 * are produced (e.g., "Dessus" / "Dessous" for shelves) so the
 * woodworker knows exactly which side to drill from.
 */

import { t } from '../i18n.js';

/**
 * Generates one or more SVG views for a plank.
 *
 * If the plank has face holes drilled from both wide faces,
 * returns two stacked unfolded views (one per face).
 * Otherwise returns a single view.
 *
 * @param {number} L - Length (longest dimension)
 * @param {number} W - Width (second longest, usually depth)
 * @param {string} label - Piece label (A, B, C...)
 * @param {Object} [plank] - Optional plank object with holes data
 * @returns {string} HTML string with one or two SVGs
 */
export function generatePieceViews(L, W, label, plank = null) {
  if (!plank) {
    // Fallback if no plank data
    return generatePieceSvg(L, W, label, null, null, null);
  }

  const isHorizontal = plank.w >= plank.h;

  // Determine which hole.face values correspond to the two wide faces
  const faceAName = isHorizontal ? 'top' : 'left';
  const faceBName = isHorizontal ? 'bottom' : 'right';

  // Split face holes into two groups
  const holes = plank.holes || [];
  const faceAHoles = holes.filter(h => h.isFace && h.face === faceAName);
  const faceBHoles = holes.filter(h => h.isFace && h.face === faceBName);
  const edgeHoles = holes.filter(h => !h.isFace);

  const labelA = isHorizontal ? t('piece_detail.face_top') : t('piece_detail.face_left');
  const labelB = isHorizontal ? t('piece_detail.face_bottom') : t('piece_detail.face_right');

  const holesA = [...faceAHoles, ...edgeHoles];
  const holesB = [...faceBHoles, ...edgeHoles];

  const svgA = generatePieceSvg(L, W, label, plank, holesA, labelA);
  const svgB = generatePieceSvg(L, W, label, plank, holesB, labelB);

  return svgA + svgB;
}

/**
 * Generates a single SVG unfolded view for a plank.
 *
 * @param {number} L - Length (longest dimension)
 * @param {number} W - Width (second longest, usually depth)
 * @param {string} label - Piece label (A, B, C...)
 * @param {Object} [plank] - Plank object for thickness derivation
 * @param {Object[]} [holes] - Subset of holes to render (or null for no holes)
 * @param {string} [subtitle] - Optional subtitle (e.g., "Dessus")
 * @returns {string} SVG HTML string
 */
export function generatePieceSvg(L, W, label, plank = null, holes = null, subtitle = null) {
  const paddingX = 120;
  const paddingY = 120;
  const svgW = 800;
  const svgH = subtitle ? 540 : 500; // slightly shorter when no subtitle

  // Derive thickness
  let T = 18;
  if (plank) {
    const dims = [plank.w, plank.h, plank.d].sort((a, b) => a - b);
    T = dims[0] || 18;
  }

  // Bounding box of the unfolded system: L + 2T by W + 2T
  const totalL = L + 2 * T;
  const totalW = W + 2 * T;

  const scale = Math.min((svgW - paddingX) / totalL, (svgH - paddingY) / totalW);
  const drawL = L * scale;
  const drawW = W * scale;
  const drawT = T * scale;

  // Center of the main face
  const x0 = (svgW - drawL) / 2;
  const y0 = (svgH - drawW) / 2 + (subtitle ? 12 : 0);

  const fontSize = 14;
  const quoteOffset = 40;
  const labelFontSize = Math.min(drawL * 0.4, drawW * 0.6, 100);

  const uid = `sv-${label}-${Math.random().toString(36).substr(2, 4)}`;

  let holesSvg = '';
  let holeAnnotationsSvg = '';

  const activeHoles = holes || (plank ? plank.holes : null);

  if (activeHoles && activeHoles.length > 0) {
    const isHorizontal = plank.w >= plank.h;
    const holeRadius = Math.max(3, Math.min(6, (activeHoles[0]?.diameter || 8) * scale / 2));
    const crossSize = holeRadius + 3;

    const edgeGroups = {
      top: [], bottom: [], left: [], right: [], main: []
    };

    for (const hole of activeHoles) {
      const py = hole.depthPos;
      const px = hole.contactPos;

      let rX, rY, rectID;

      if (hole.isFace) {
        rectID = 'main';
        rX = x0 + (px / L) * drawL;
        rY = y0 + (py / W) * drawW;
      } else {
        if (isHorizontal) {
          if (hole.face === 'left') {
            rectID = 'left';
            rX = x0 - drawT / 2;
            rY = y0 + (py / W) * drawW;
          } else if (hole.face === 'right') {
            rectID = 'right';
            rX = x0 + drawL + drawT / 2;
            rY = y0 + (py / W) * drawW;
          } else if (hole.face === 'top') {
            rectID = 'top';
            rX = x0 + (px / L) * drawL;
            rY = y0 - drawT / 2;
          } else if (hole.face === 'bottom') {
            rectID = 'bottom';
            rX = x0 + (px / L) * drawL;
            rY = y0 + drawW + drawT / 2;
          }
        } else {
          if (hole.face === 'bottom') {
            rectID = 'left';
            rX = x0 - drawT / 2;
            rY = y0 + (py / W) * drawW;
          } else if (hole.face === 'top') {
            rectID = 'right';
            rX = x0 + drawL + drawT / 2;
            rY = y0 + (py / W) * drawW;
          } else if (hole.face === 'left') {
            rectID = 'top';
            rX = x0 + (px / L) * drawL;
            rY = y0 - drawT / 2;
          } else if (hole.face === 'right') {
            rectID = 'bottom';
            rX = x0 + (px / L) * drawL;
            rY = y0 + drawW + drawT / 2;
          }
        }
      }

      if (rX !== undefined && rY !== undefined) {
        edgeGroups[rectID].push({ ...hole, rX, rY, py, px });

        holesSvg += `
          <circle cx="${rX}" cy="${rY}" r="${holeRadius}" class="hole-circle" />
          <line x1="${rX - crossSize}" y1="${rY}" x2="${rX + crossSize}" y2="${rY}" class="hole-cross" />
          <line x1="${rX}" y1="${rY - crossSize}" x2="${rX}" y2="${rY + crossSize}" class="hole-cross" />
        `;
      }
    }

    const diam = activeHoles[0]?.diameter || 8;
    holeAnnotationsSvg = generateUnfoldedAnnotations(edgeGroups, x0, y0, drawL, drawW, drawT, L, W, diam, uid);
  }

  // Subtitle element
  const subtitleSvg = subtitle
    ? `<text x="${svgW / 2}" y="22" text-anchor="middle" style="font-family:sans-serif; font-size:15px; font-weight:700; fill:#555;">${subtitle}</text>`
    : '';

  return `
    <svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="${uid}-arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
          <path d="M0,3 L10,5 L0,7 Z" fill="#999" />
        </marker>
        <marker id="${uid}-arrow-rev" markerWidth="10" markerHeight="10" refX="0" refY="5" orient="auto-start-reverse">
          <path d="M0,3 L10,5 L0,7 Z" fill="#999" />
        </marker>
        <marker id="${uid}-ha" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <path d="M0,1 L6,3 L0,5 Z" fill="#2a9d8f" />
        </marker>
        <marker id="${uid}-ha-r" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto-start-reverse">
          <path d="M0,1 L6,3 L0,5 Z" fill="#2a9d8f" />
        </marker>
      </defs>
      <style>
        .rect { fill: #fdfdfd; stroke: #333; stroke-width: 2; vector-effect: non-scaling-stroke; }
        .rect-edge { fill: #f0f0f0; stroke: #666; stroke-width: 1.5; stroke-dasharray: 4,4; vector-effect: non-scaling-stroke; }
        .q-ln { stroke: #999; stroke-width: 1; marker-start: url(#${uid}-arrow-rev); marker-end: url(#${uid}-arrow); }
        .q-tx { fill: #555; font-family: sans-serif; font-size: ${fontSize}px; font-weight: 600; text-anchor: middle; }
        .ilbl { fill: #e0e0e0; font-family: sans-serif; font-weight: 900; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
        .hole-circle { fill: none; stroke: #e63946; stroke-width: 1.5; }
        .hole-cross { stroke: #e63946; stroke-width: 1; }
        .h-ql { stroke: #2a9d8f; stroke-width: 0.8; stroke-dasharray: 4,3; marker-start: url(#${uid}-ha-r); marker-end: url(#${uid}-ha); }
        .h-qt { fill: #2a9d8f; font-family: sans-serif; font-size: 11px; font-weight: 600; }
        .h-sp { fill: #e63946; font-family: sans-serif; font-size: 11px; font-weight: 700; }
      </style>

      ${subtitleSvg}

      <!-- Central Rectangle -->
      <rect class="rect" x="${x0}" y="${y0}" width="${drawL}" height="${drawW}" />
      
      <!-- Folded Edges -->
      <rect class="rect-edge" x="${x0}" y="${y0 - drawT}" width="${drawL}" height="${drawT}" /> <!-- Top -->
      <rect class="rect-edge" x="${x0}" y="${y0 + drawW}" width="${drawL}" height="${drawT}" /> <!-- Bottom -->
      <rect class="rect-edge" x="${x0 - drawT}" y="${y0}" width="${drawT}" height="${drawW}" /> <!-- Left -->
      <rect class="rect-edge" x="${x0 + drawL}" y="${y0}" width="${drawT}" height="${drawW}" /> <!-- Right -->

      <!-- Internal label -->
      <text class="ilbl" x="${x0 + drawL / 2}" y="${y0 + drawW / 2}" style="font-size:${labelFontSize}px">${label}</text>

      <!-- Assembly holes -->
      ${holesSvg}

      <!-- Hole annotations -->
      ${holeAnnotationsSvg}

      <!-- Length quote (top - above Top edge) -->
      <line class="q-ln" x1="${x0}" y1="${y0 - drawT - quoteOffset}" x2="${x0 + drawL}" y2="${y0 - drawT - quoteOffset}" />
      <rect x="${x0 + drawL / 2 - 35}" y="${y0 - drawT - quoteOffset - 10}" width="70" height="20" fill="white" />
      <text class="q-tx" x="${x0 + drawL / 2}" y="${y0 - drawT - quoteOffset + 5}">${L} mm</text>

      <!-- Width quote (left - outside Left edge) -->
      <line class="q-ln" x1="${x0 - drawT - quoteOffset}" y1="${y0}" x2="${x0 - drawT - quoteOffset}" y2="${y0 + drawW}" />
      <g transform="rotate(-90,${x0 - drawT - quoteOffset},${y0 + drawW / 2})">
        <rect x="${x0 - drawT - quoteOffset - 35}" y="${y0 + drawW / 2 - 10}" width="70" height="20" fill="white" />
        <text class="q-tx" x="${x0 - drawT - quoteOffset}" y="${y0 + drawW / 2 + 5}">${W} mm</text>
      </g>
    </svg>
  `;
}

function generateUnfoldedAnnotations(edgeGroups, x0, y0, drawL, drawW, drawT, L, W, diam, uid) {
  let svg = '';
  const renderedLabels = [];

  const avoidOverlap = (specX, specY, shiftDir) => {
    let hasOverlap = true;
    let iterations = 0;
    while (hasOverlap && iterations < 5) {
      hasOverlap = false;
      for (const prev of renderedLabels) {
        if (Math.abs(prev.x - specX) < 60 && Math.abs(prev.y - specY) < 18) {
          hasOverlap = true;
          specY += shiftDir * 15;
          svg += `<line class="h-ql" x1="${specX}" y1="${specY - shiftDir * 4}" x2="${specX}" y2="${specY - shiftDir * 15}" style="stroke-opacity:0.3;" />`;
          break;
        }
      }
      iterations++;
    }
    renderedLabels.push({ x: specX, y: specY });
    return specY;
  };

  // Process Left & Right edges (Holes distributed along Y / Depth)
  ['left', 'right'].forEach(side => {
    const group = edgeGroups[side];
    if (!group || group.length === 0) return;
    
    const sorted = [...group].sort((a, b) => a.py - b.py);
    const lineX = side === 'left' ? x0 - drawT - 20 : x0 + drawL + drawT + 20;
    const textAnchor = side === 'left' ? 'end' : 'start';
    const textX = side === 'left' ? lineX - 4 : lineX + 4;
    
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        const yStart = y0;
        const yEnd = sorted[0].rY;
        svg += `<line class="h-ql" x1="${lineX}" y1="${yStart}" x2="${lineX}" y2="${yEnd}" />`;
        const dimMm = Math.round(sorted[0].py);
        if (dimMm > 0) svg += `<text class="h-qt" x="${textX}" y="${(yStart + yEnd) / 2 + 4}" text-anchor="${textAnchor}">${dimMm}</text>`;
      } else {
        const yStart = sorted[i - 1].rY;
        const yEnd = sorted[i].rY;
        svg += `<line class="h-ql" x1="${lineX}" y1="${yStart}" x2="${lineX}" y2="${yEnd}" />`;
        const dimMm = Math.round(sorted[i].py - sorted[i - 1].py);
        svg += `<text class="h-qt" x="${textX}" y="${(yStart + yEnd) / 2 + 4}" text-anchor="${textAnchor}">${dimMm}</text>`;
      }
    }
    const yStart = sorted[sorted.length - 1].rY;
    const yEnd = y0 + drawW;
    svg += `<line class="h-ql" x1="${lineX}" y1="${yStart}" x2="${lineX}" y2="${yEnd}" />`;
    const dimMm = Math.round(W - sorted[sorted.length - 1].py);
    if (dimMm > 0) svg += `<text class="h-qt" x="${textX}" y="${(yStart + yEnd) / 2 + 4}" text-anchor="${textAnchor}">${dimMm}</text>`;

    const depth = sorted[0].depth;
    let specX = lineX;
    let specY = y0 - 8;
    specY = avoidOverlap(specX, specY, -1);
    svg += `<text class="h-sp" x="${specX}" y="${specY}" text-anchor="${textAnchor}">${sorted.length}× Ø${diam} ↧${depth}</text>`;
  });

  // Process Main face (grouped by X column)
  if (edgeGroups.main && edgeGroups.main.length > 0) {
    const mainCols = {};
    for (const h of edgeGroups.main) {
      const rxKey = Math.round(h.rX);
      if (!mainCols[rxKey]) mainCols[rxKey] = [];
      mainCols[rxKey].push(h);
    }

    for (const rxKey of Object.keys(mainCols)) {
      const colGroup = mainCols[rxKey];
      const lineX = Number(rxKey) + 20;
      const sorted = [...colGroup].sort((a, b) => a.py - b.py);
      const textAnchor = 'start';

      const depth = sorted[0].depth;
      let specX = lineX;
      let specY = y0 - 8;
      specY = avoidOverlap(specX, specY, -1);
      svg += `<text class="h-sp" x="${specX}" y="${specY}" text-anchor="${textAnchor}">${sorted.length}× Ø${diam} ↧${depth}</text>`;
    }
  }

  // Top/Bottom edges
  ['top', 'bottom'].forEach(side => {
    const group = edgeGroups[side];
    if (!group || group.length === 0) return;
    
    const sorted = [...group].sort((a, b) => a.px - b.px);
    const lineY = side === 'top' ? y0 - drawT - 20 : y0 + drawW + drawT + 20;
    
    const depth = sorted[0].depth;
    let specX = sorted[0].rX;
    let specY = side === 'top' ? lineY - 8 : lineY + 16;
    specY = avoidOverlap(specX, specY, side === 'top' ? -1 : 1);
    svg += `<text class="h-sp" x="${specX}" y="${specY}" text-anchor="middle">${sorted.length}× Ø${diam} ↧${depth}</text>`;
  });

  return svg;
}
