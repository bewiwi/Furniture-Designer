/**
 * planks.test.js — Unit tests for Cut List generation
 */

import { describe, it, expect } from 'vitest';
import { generatePlanks, groupPlanks } from './planks.js';

describe('generatePlanks', () => {
  const furniture = {
    width: 1000,
    height: 2000,
    depth: 300,
    thickness: 20,
    root: {
      id: 'root',
      direction: null,
      children: [],
      sizes: []
    }
  };

  it('generates basic frame planks for a leaf root', () => {
    const planks = generatePlanks(furniture);
    
    // Left upright, Right upright, Bottom rail, Top rail
    expect(planks).toHaveLength(4);
    
    const left = planks.find(p => p.name === 'plank.left_upright');
    expect(left.w).toBe(20);
    expect(left.h).toBe(2000);
    expect(left.d).toBe(300);
    expect(left.x).toBe(0);

    const bottom = planks.find(p => p.name === 'plank.bottom_rail');
    expect(bottom.w).toBe(960); // 1000 - 2*20
    expect(bottom.h).toBe(20);
    expect(bottom.x).toBe(20);
    expect(bottom.y).toBe(0);
  });

  it('generates internal shelves for row subdivisions', () => {
    const f = {
      ...furniture,
      root: {
        id: 'root',
        direction: 'row',
        children: [
          { id: 'c1', direction: null, children: [], sizes: [] },
          { id: 'c2', direction: null, children: [], sizes: [] }
        ],
        sizes: [970, 970] // 2000 - 2*20 - 20 = 1940 / 2 = 970
      }
    };

    const planks = generatePlanks(f);
    // 4 frame + 1 shelf
    expect(planks).toHaveLength(5);
    
    const shelf = planks.find(p => p.type === 'shelf');
    expect(shelf.w).toBe(960);
    expect(shelf.h).toBe(20);
    expect(shelf.y).toBe(20 + 970); // bottom rail + child 0 height
  });

  it('generates internal separators for column subdivisions', () => {
    const f = {
      ...furniture,
      root: {
        id: 'root',
        direction: 'col',
        children: [
          { id: 'c1', direction: null, children: [], sizes: [] },
          { id: 'c2', direction: null, children: [], sizes: [] }
        ],
        sizes: [470, 470] // 1000 - 2*20 - 20 = 940 / 2 = 470
      }
    };

    const planks = generatePlanks(f);
    // 4 frame + 1 separator
    expect(planks).toHaveLength(5);
    
    const separator = planks.find(p => p.type === 'separator');
    expect(separator.w).toBe(20);
    expect(separator.h).toBe(1960); // 2000 - 2*20
    expect(separator.x).toBe(20 + 470);
  });
});

describe('groupPlanks', () => {
  it('groups identical planks and sums area', () => {
    const planks = [
      { name: 'p1', w: 100, h: 500, d: 20, type: 'shelf' },
      { name: 'p2', w: 100, h: 500, d: 20, type: 'shelf' },
      { name: 'p3', w: 200, h: 500, d: 20, type: 'separator' }
    ];

    const groups = groupPlanks(planks);
    expect(groups).toHaveLength(2);

    const shelfGroup = groups.find(g => g.type === 'shelf');
    expect(shelfGroup.count).toBe(2);
    expect(shelfGroup.totalArea).toBeCloseTo(0.1, 5); // (100*500*2) / 1,000,000 = 0.1 m²
  });
});
