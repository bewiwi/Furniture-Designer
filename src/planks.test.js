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
      { id: 'id1', name: 'p1', w: 100, h: 500, d: 20, type: 'shelf' },
      { id: 'id2', name: 'p2', w: 100, h: 500, d: 20, type: 'shelf' },
      { id: 'id3', name: 'p3', w: 200, h: 500, d: 20, type: 'separator' }
    ];

    const groups = groupPlanks(planks);
    expect(groups).toHaveLength(2);

    const shelfGroup = groups.find(g => g.type === 'shelf');
    expect(shelfGroup.count).toBe(2);
    expect(shelfGroup.totalArea).toBeCloseTo(0.1, 5); // (100*500*2) / 1,000,000 = 0.1 m²
    expect(shelfGroup.ids).toHaveLength(2);
    expect(shelfGroup.ids).toContain('id1');
    expect(shelfGroup.ids).toContain('id2');
  });

  it('assigns labels A, B, C... to groups', () => {
    const planks = [
      { id: '1', name: 'p1', w: 800, h: 500, d: 20, type: 'shelf' },
      { id: '2', name: 'p2', w: 700, h: 500, d: 20, type: 'shelf' },
      { id: '3', name: 'p3', w: 600, h: 500, d: 20, type: 'shelf' }
    ];

    const groups = groupPlanks(planks);
    // Sort logic in groupPlanks sorts by type then width (descending)
    expect(groups[0].label).toBe('A');
    expect(groups[0].w).toBe(800);
    
    expect(groups[1].label).toBe('B');
    expect(groups[1].w).toBe(700);
    
    expect(groups[2].label).toBe('C');
    expect(groups[2].w).toBe(600);
  });

  it('assigns multi-letter labels (AA, AB...) for many groups', () => {
    // We'll create 27 groups
    const planks = [];
    for (let i = 0; i < 27; i++) {
      planks.push({ id: `id${i}`, name: `p${i}`, w: 1000 - i, h: 500, d: 20, type: 'shelf' });
    }

    const groups = groupPlanks(planks);
    expect(groups).toHaveLength(27);
    expect(groups[25].label).toBe('Z');
    expect(groups[26].label).toBe('AA');
  });

  it('groups identically sized panels with different holes separately when splitByHoles is true', () => {
    const planks = [
      { id: '1', w: 100, h: 50, d: 18, type: 'shelf', holes: [{ face: 'front', x: 10, y: 10 }] },
      { id: '2', w: 100, h: 50, d: 18, type: 'shelf', holes: [{ face: 'front', x: 20, y: 20 }] },
      { id: '3', w: 100, h: 50, d: 18, type: 'shelf', holes: [{ face: 'front', x: 10, y: 10 }] }, // matches 1
      { id: '4', w: 200, h: 50, d: 18, type: 'separator', holes: [] }
    ];
    
    const normalGroups = groupPlanks(planks);
    expect(normalGroups).toHaveLength(2); // Shelf (A) and Separator (B)
    
    const holeGroups = groupPlanks(planks, { splitByHoles: true });
    expect(holeGroups).toHaveLength(3); 
    
    // Validate labels
    const separatorLabel = holeGroups.find(g => g.type === 'separator').label;
    expect(separatorLabel.includes(':1')).toBe(true);
    
    // The shelves should have the same base letter but different suffixes A:1 and A:2
    // Since separators are B and shelves are A (based on sorting)
    const shelf1Label = holeGroups.find(g => g.count === 2).label;
    const shelf2Label = holeGroups.find(g => g.type === 'shelf' && g.count === 1).label;
    
    expect(shelf1Label).not.toBe(shelf2Label);
    expect(shelf1Label[0]).toBe('B');
    expect(shelf2Label[0]).toBe('B');
    
    expect([shelf1Label, shelf2Label].sort()).toEqual(['B:1', 'B:2']);
  });
});
