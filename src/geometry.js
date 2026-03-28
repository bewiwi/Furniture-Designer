/**
 * geometry.js — Conversion Planks -> JSCAD Cuboids
 *
 * Each plank is converted into a JSCAD cuboid geometry,
 * positioned and colored according to its type.
 */

import jscadModeling from '@jscad/modeling';
const { cuboid } = jscadModeling.primitives;
const { translate } = jscadModeling.transforms;
const { colorize } = jscadModeling.colors;

// Colors by plank type (RGBA)
const TYPE_COLORS = {
  frameV: [0.6, 0.4, 0.2, 1],    // Vertical frame (dark wood)
  frameH: [0.7, 0.5, 0.3, 1],    // Horizontal frame (medium wood)
  shelf: [0.8, 0.6, 0.4, 1],     // Shelf (light wood)
  separator: [0.8, 0.6, 0.4, 1], // Separator (light wood)
  highlight: [1, 0.9, 0, 0.3],   // Selection highlight (translucent gold)
};

/**
 * Converts a list of plank objects into JSCAD geometries.
 *
 * @param {Object[]} planks - List of planks { name, w, h, d, x, y, z, type }
 * @returns {Object[]} List of JSCAD solids
 */
export function planksToGeometries(planks) {
  return planks.map((p) => {
    // JSCAD cuboid is centered on origin, so we need to offset it
    // centered [w/2, h/2, d/2]
    const solid = cuboid({
      size: [p.w, p.h, p.d],
      center: [p.w / 2, p.h / 2, p.d / 2],
    });

    // Position it at its absolute coordinates
    const translated = translate([p.x, p.y, p.z], solid);

    // Apply color based on type
    const color = TYPE_COLORS[p.type] || [0.5, 0.5, 0.5, 1];
    return colorize(color, translated);
  });
}

/**
 * Generates a translucent volume to highlight a selected compartment.
 *
 * @param {number} x, y, w, h, depth - Absolute dimensions
 * @returns {Object} JSCAD solid for highlighting
 */
export function highlightCompartment(x, y, w, h, depth) {
  const solid = cuboid({
    size: [w, h, depth],
    center: [w / 2, h / 2, depth / 2],
  });

  const translated = translate([x, y, 0], solid);
  return colorize(TYPE_COLORS.highlight, translated);
}
