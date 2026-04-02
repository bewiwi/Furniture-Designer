/**
 * tools.js — Generation of 3D printable tool geometries
 *
 * Parametric guides for drilling holes based on furniture configuration.
 */

import jscadModeling from '@jscad/modeling';
const { cuboid, cylinder, roundedCuboid } = jscadModeling.primitives;
const { translate, rotateX, rotateZ } = jscadModeling.transforms;
const { subtract, union } = jscadModeling.booleans;
const { colorize } = jscadModeling.colors;
const { path2 } = jscadModeling.geometries;
const { vectorText } = jscadModeling.text;
const { expand } = jscadModeling.expansions;
const { extrudeLinear } = jscadModeling.extrusions;
const TOOL_COLOR = [1.0, 0.5, 0.0, 1.0]; // Orange for 3D printed tools

/**
 * Helper to generate an aligned 3D solid from a text string.
 */
function generateText3D(message) {
  const segments = vectorText({ xOffset: 0, yOffset: 0, height: 2 }, message);
  const paths = segments.map(segment => path2.fromPoints({closed: false}, segment));
  // 0.2mm delta creates lines 0.4mm thick
  const expanded = expand({delta: 0.2, corners: 'round', segments: 8}, paths);
  const extruded = extrudeLinear({height: 1}, expanded);
  let textModel = union(extruded);
  
  // Approximate centering since we don't use 'aligns':
  // height is 2, average char width is ~1.5mm.
  const approxWidth = message.length * 1.5;
  textModel = translate([-approxWidth / 2, -1, 0], textModel);
  
  return textModel;
}


/**
 * Creates the Edge Drilling Guide geometry.
 * A U-channel block to center a drill hole on the edge grain.
 *
 * @param {number} thickness - Board thickness (mm)
 * @param {number} diameter - Dowel diameter (mm)
 * @param {number} margin - Distance from board corner to hole center (mm)
 * @returns {Array} JSCAD solid array
 */
export function createEdgeGuideGeometry(thickness, diameter, margin = 50) {
  const tolerance = 0.4;
  const channelWidth = thickness + tolerance;
  const wallThickness = 4;
  const stopThickness = 4;
  const blockWidth = channelWidth + (2 * wallThickness);
  const blockLength = stopThickness + margin + 20;
  const channelDepth = 20;
  const topThickness = 10;
  const blockHeight = channelDepth + topThickness;

  // Main block
  let block = roundedCuboid({
    size: [blockWidth, blockLength, blockHeight],
    center: [blockWidth / 2, blockLength / 2, blockHeight / 2],
    roundRadius: 1.5,
    segments: 16
  });

  // U-Channel to subtract (leaves stopThickness intact at y=0)
  let channelLen = blockLength; // long enough to cut through the far end
  let channel = cuboid({
    size: [channelWidth, channelLen, channelDepth],
    // The channel starts at y = stopThickness
    center: [blockWidth / 2, stopThickness + channelLen / 2, channelDepth / 2]
  });

  // Through-hole for drill to subtract
  let hole = cylinder({
    radius: diameter / 2,
    height: blockHeight * 1.5,
    // The hole is centered at 'margin' distance from the STOP FACE (which is at y = stopThickness)
    center: [blockWidth / 2, stopThickness + margin, blockHeight / 2],
    segments: 32
  });

  let guide = subtract(block, channel, hole);
  
  // Engrave text on top face
  let label = generateText3D(`T${thickness} D${diameter} M${margin}`);
  // Rotate 90 degrees to fit along the Y axis of the block instead of overflowing the X axis
  label = rotateZ(Math.PI / 2, label);
  // Position text between the stop block and the dowel hole
  // Put it a bit closer to the stop block so it is safely far from the hole
  label = translate([blockWidth / 2, stopThickness + margin / 2 - 5, blockHeight - 0.5], label);
  guide = subtract(guide, label);
  
  guide = colorize(TOOL_COLOR, guide);

  return [guide];
}

/**
 * Creates the Face Drilling Guide (Équerre) geometry.
 * An L-shaped piece that regulates distance from the board edge.
 *
 * @param {number} thickness - Board thickness (mm)
 * @param {number} diameter - Dowel diameter (mm)
 * @returns {Array} JSCAD solid array
 */
export function createFaceGuideGeometry(thickness, diameter) {
  const horizThickness = 10;
  // The vertical registration lip (vertHeight - horizThickness) must be slightly
  // less than the board thickness so it doesn't bottom out on the workbench.
  // We use Math.max(..., 2) to ensure the lip is at least 2mm long to prevent 
  // negative size errors in edge-case tests with tiny thickness values.
  const lipLength = Math.max(thickness - 2, 2);
  const vertHeight = lipLength + horizThickness;
  const vertThickness = 5;
  const width = 60;
  
  const horizLength = (thickness / 2) + 20; // Enough space for hole and margin

  // Vertical arm
  let vertArm = cuboid({
    size: [horizLength + vertThickness, width, vertThickness],
    center: [(horizLength + vertThickness) / 2, width / 2, -(vertThickness / 2)]
  });
  
  // Outer bounding block with smooth rounded edges
  let toolBody = roundedCuboid({
    size: [horizLength + vertThickness, width, vertHeight],
    center: [(horizLength + vertThickness) / 2, width / 2, -(vertHeight / 2)],
    roundRadius: 1.5,
    segments: 16
  });

  // Sharp cut-out block to carve the L-shape and leave a perfectly sharp 90-degree internal angle
  // Cutout spans from X=vertThickness to the end, and from Z=-horizThickness downwards
  let cutout = cuboid({
    size: [horizLength, width, vertHeight - horizThickness],
    center: [vertThickness + (horizLength / 2), width / 2, -(horizThickness + (vertHeight - horizThickness) / 2)]
  });

  // Dowel hole must reside at `thickness / 2` away from the edge (i.e. away from the inner corner).
  // The inner face of the vertical arm is at x = vertThickness.
  const holeX = vertThickness + (thickness / 2);
  let hole = cylinder({
    radius: diameter / 2,
    height: horizThickness * 2,
    center: [holeX, width / 2, -(horizThickness / 2)],
    segments: 32
  });

  toolBody = subtract(toolBody, cutout);
  let guide = subtract(toolBody, hole);
  
  // Engrave text on horizontal arm, beside the hole
  // Distance to border for the face guide is exactly thickness/2
  let label = generateText3D(`D${diameter} M${thickness/2}`);
  label = translate([vertThickness + horizLength / 2, 8, -0.5], label);
  guide = subtract(guide, label);
  
  guide = colorize(TOOL_COLOR, guide);

  return [guide];
}
