/**
 * Unit tests for tools.js
 */

import { describe, it, expect } from 'vitest';
import { createEdgeGuideGeometry, createFaceGuideGeometry } from './tools.js';

describe('Tools Geometry Generation', () => {

  it('generates edge guide geometry without crashing', () => {
    const thickness = 18;
    const diameter = 8;
    const geometries = createEdgeGuideGeometry(thickness, diameter);

    expect(Array.isArray(geometries)).toBe(true);
    expect(geometries.length).toBe(1);

    const solid = geometries[0];
    expect(solid).toHaveProperty('polygons'); // Basic JSCAD solid check
    expect(solid.color).toEqual([1.0, 0.5, 0.0, 1.0]); // Tool color check
  });

  it('generates face guide geometry without crashing', () => {
    const thickness = 18;
    const diameter = 8;
    const geometries = createFaceGuideGeometry(thickness, diameter);

    expect(Array.isArray(geometries)).toBe(true);
    expect(geometries.length).toBe(1);

    const solid = geometries[0];
    expect(solid).toHaveProperty('polygons'); 
    expect(solid.color).toEqual([1.0, 0.5, 0.0, 1.0]);
  });

  it('handles edge cases for geometries gracefully', () => {
    // Tests extremely thin boards and tiny dowels to ensure boolean operations don't throw
    const thickness = 1;
    const diameter = 1;
    
    expect(() => createEdgeGuideGeometry(thickness, diameter)).not.toThrow();
    expect(() => createFaceGuideGeometry(thickness, diameter)).not.toThrow();
  });

});
