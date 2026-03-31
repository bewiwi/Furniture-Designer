/**
 * holes.test.js — Unit tests for the assembly hole calculation engine.
 */

import { describe, it, expect } from 'vitest';
import { distributeHoles, computeHoles, mapHolesToPlankLocal } from './holes.js';
import { generatePlanks } from './planks.js';
import { createFurniture, subdivide } from './model.js';

// =============================================================================
// distributeHoles
// =============================================================================

describe('distributeHoles', () => {
  it('places 2 holes at margins for a standard edge', () => {
    const positions = distributeHoles(300, 50, 200);
    expect(positions).toHaveLength(2);
    expect(positions[0]).toBeCloseTo(50);
    expect(positions[1]).toBeCloseTo(250);
  });

  it('places more holes when spacing allows', () => {
    const positions = distributeHoles(600, 50, 200);
    // Usable = 600 - 100 = 500, count = floor(500/200) + 1 = 3
    expect(positions).toHaveLength(3);
    expect(positions[0]).toBeCloseTo(50);
    expect(positions[2]).toBeCloseTo(550);
  });

  it('places a single centered hole for very small edges', () => {
    const positions = distributeHoles(60, 50, 200);
    expect(positions).toHaveLength(1);
    expect(positions[0]).toBeCloseTo(30);
  });

  it('returns empty array for zero-length edge', () => {
    expect(distributeHoles(0, 50, 200)).toEqual([]);
  });

  it('returns empty array for negative length', () => {
    expect(distributeHoles(-10, 50, 200)).toEqual([]);
  });

  it('places one centered hole when edge equals 2*margin exactly', () => {
    const positions = distributeHoles(100, 50, 200);
    // Usable = 0, so centered
    expect(positions).toHaveLength(1);
    expect(positions[0]).toBeCloseTo(50);
  });

  it('distributes evenly with small spacing', () => {
    const positions = distributeHoles(500, 50, 100);
    // Usable = 400, count = max(2, floor(400/100) + 1) = 5
    expect(positions).toHaveLength(5);
    expect(positions[0]).toBeCloseTo(50);
    expect(positions[4]).toBeCloseTo(450);
  });
});

// =============================================================================
// computeHoles — integration with planks
// =============================================================================

describe('computeHoles', () => {
  it('distributes holes along depth for a basic furniture', () => {
    // depth=300, margin=50, spacing=200 → 2 holes per joint
    const furniture = createFurniture('Test', 1000, 2000, 300, 18);
    const planks = generatePlanks(furniture);

    // 4 planks: 2 uprights + 2 rails
    expect(planks).toHaveLength(4);

    for (const p of planks) {
      expect(p.holes).toBeDefined();
      expect(Array.isArray(p.holes)).toBe(true);
    }

    // Each rail connects to 2 uprights → 2 holes per connection × 2 connections = 4 total?
    // No — each rail has 2 joints (one per end), with 2 depth-holes each = 4 holes
    // Actually: bottom_rail touches left_upright (right edge of upright ↔ left edge of rail)
    //           bottom_rail touches right_upright (right edge of rail ↔ left edge of upright)
    const rails = planks.filter(p => p.type === 'frameH');
    for (const rail of rails) {
      // 2 joints × 2 holes per joint along depth = 4 holes total
      expect(rail.holes.length).toBeGreaterThanOrEqual(4);
    }

    // Each upright connects to 2 rails → 4 holes minimum
    const uprights = planks.filter(p => p.type === 'frameV');
    for (const upright of uprights) {
      expect(upright.holes.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('increases holes when depth increases', () => {
    // With depth=800 and spacing=200 → (800-100)/200 + 1 = 4.5 → 4 holes per joint
    const furniture = createFurniture('Test', 1000, 2000, 800, 18);
    furniture.dowelConfig = { diameter: 8, dowelLength: 30, edgeMargin: 50, spacing: 200 };
    const planks = generatePlanks(furniture);

    const bottomRail = planks.find(p => p.name === 'plank.bottom_rail');
    // 2 joints × 4 holes each = 8
    expect(bottomRail.holes.length).toBe(8);
  });

  it('adds more holes when furniture has subdivisions', () => {
    const furniture = createFurniture('Test', 1000, 2000, 300, 18);
    const T = furniture.thickness;
    const innerH = furniture.height - 2 * T;
    subdivide(furniture.root, 'row', 3, innerH, T);

    const planks = generatePlanks(furniture);
    expect(planks).toHaveLength(6); // 2 uprights + 2 rails + 2 shelves

    // Shelves connect to uprights → should have holes
    const shelves = planks.filter(p => p.type === 'shelf');
    expect(shelves).toHaveLength(2);
    for (const shelf of shelves) {
      expect(shelf.holes.length).toBeGreaterThanOrEqual(4); // 2 joints × 2 depth holes
    }
  });

  it('respects custom dowel config and calculates distinct face/edge depths', () => {
    const furniture = createFurniture('Test', 1000, 2000, 300, 18);
    furniture.dowelConfig = {
      diameter: 10,
      dowelLength: 40,
      edgeMargin: 30,
      spacing: 100,
    };
    const planks = generatePlanks(furniture);
    
    // Bottom rail connects horizontally to Vertical uprights.
    // Upright receives the face hole. Bottom rail receives the edge hole.
    const upright = planks.find(p => p.type === 'frameV');
    const rail = planks.find(p => p.type === 'frameH');

    // Upright holes should be face holes with depth = min(40/2, 18-3) = 15
    const uprightHole = upright.holes[0];
    expect(uprightHole.isFace).toBe(true);
    expect(uprightHole.depth).toBe(15);

    // Rail holes should be edge holes with depth = 40 - 15 + 1 = 26
    const railHole = rail.holes[0];
    expect(railHole.isFace).toBe(false);
    expect(railHole.depth).toBe(26);
  });

  it('holes have depthPos and contactPos fields', () => {
    const furniture = createFurniture('Test', 1000, 2000, 300, 18);
    const planks = generatePlanks(furniture);
    const holedPlank = planks.find(p => p.holes.length > 0);

    for (const hole of holedPlank.holes) {
      expect(hole.depthPos).toBeDefined();
      expect(hole.contactPos).toBeDefined();
      expect(hole.face).toBeDefined();
      expect(hole.diameter).toBeGreaterThan(0);
      expect(hole.depth).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// mapHolesToPlankLocal
// =============================================================================

describe('mapHolesToPlankLocal', () => {
  it('maps end-drilled holes correctly for a horizontal plank', () => {
    const plank = { w: 964, h: 18, d: 300 };
    const holes = [
      { face: 'left', contactPos: 9, depthPos: 50, diameter: 8, depth: 15 },
      { face: 'left', contactPos: 9, depthPos: 250, diameter: 8, depth: 15 },
      { face: 'right', contactPos: 9, depthPos: 50, diameter: 8, depth: 15 },
    ];

    const localHoles = mapHolesToPlankLocal(plank, holes);
    expect(localHoles).toHaveLength(3);

    // Left holes → x=0
    expect(localHoles[0].x).toBe(0);
    expect(localHoles[0].y).toBe(50);
    expect(localHoles[1].x).toBe(0);
    expect(localHoles[1].y).toBe(250);

    // Right hole → x=964
    expect(localHoles[2].x).toBe(964);
  });

  it('maps face-drilled holes correctly for a vertical plank', () => {
    const plank = { w: 18, h: 2000, d: 300 };
    const holes = [
      { face: 'left', contactPos: 9, depthPos: 50, diameter: 8, depth: 15 },
      { face: 'right', contactPos: 9, depthPos: 50, diameter: 8, depth: 15 },
    ];

    const localHoles = mapHolesToPlankLocal(plank, holes);
    expect(localHoles).toHaveLength(2);

    // On a vertical plank, left/right are face holes
    // contactPos maps to x (position along plank height = SVG x-axis)
    expect(localHoles[0].x).toBe(9);
    expect(localHoles[0].y).toBe(50);
  });

  it('returns empty array for plank with no holes', () => {
    const plank = { w: 964, h: 18, d: 300 };
    expect(mapHolesToPlankLocal(plank, [])).toEqual([]);
    expect(mapHolesToPlankLocal(plank, null)).toEqual([]);
  });
});
