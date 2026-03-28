/**
 * exporter.js — STL and DXF export logic
 *
 * Uses JSCAD serializers to generate downloadable files.
 */

import jscadStlSerializer from '@jscad/stl-serializer';
import jscadDxfSerializer from '@jscad/dxf-serializer';
import { downloadBlob, sanitizeFileName } from './utils.js';

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
