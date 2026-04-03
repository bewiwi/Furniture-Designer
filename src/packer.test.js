import { describe, it, expect } from 'vitest';
import { packPlanks } from './packer.js';

describe('packPlanks', () => {
  it('should pack a single piece into one panel', () => {
    // Plank: 1000x500
    const planks = [{ id: 'p1', label: 'A', w: 1000, h: 500, d: 18, type: 'shelf' }];
    const { panels, unplaced } = packPlanks(planks, 2440, 1220, 3);
    
    expect(panels.length).toBe(1);
    expect(unplaced.length).toBe(0);
    expect(panels[0].placements.length).toBe(1);
    expect(panels[0].placements[0].rect.w).toBe(1000);
    expect(panels[0].placements[0].rect.h).toBe(500);
  });
});
