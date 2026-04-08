import { describe, it, expect } from 'vitest';
import { packPlanks, packPlanksSmartMix } from './packer.js';

describe('packPlanks', () => {
  it('should pack a single piece into one panel', () => {
    // Plank: 1000x500
    const planks = [{ id: 'p1', label: 'A', w: 1000, h: 500, d: 18, type: 'shelf' }];
    const { panels, unplaced } = packPlanks(planks, 2440, 1220, 3);
    
    expect(panels.length).toBe(1);
    expect(unplaced.length).toBe(0);
    expect(panels[0].placements.length).toBe(1);
    expect(panels[0].placements[0].rect.w).toBe(500);
    expect(panels[0].placements[0].rect.h).toBe(1000); // 1000x500 is rotated to 500x1000 to save the short side
  });
});

describe('packPlanksSmartMix', () => {
  const kinds = [
    { id: 'small', name: 'Small', width: 500, height: 500, pricePerPanel: 10 },
    { id: 'large', name: 'Large', width: 1000, height: 1000, pricePerPanel: 30 },
  ];

  it('places a piece that only fits in the large kind on the large kind', () => {
    const planks = [
      { id: 'p1', name: 'A', pw: 600, ph: 400, label: 'A' },
    ];
    const { panels, unplaced } = packPlanksSmartMix(planks, kinds, 3);
    expect(unplaced).toHaveLength(0);
    expect(panels).toHaveLength(1);
    expect(panels[0].kind.id).toBe('large');
  });

  it('prefers open cheaper panel over opening a new expensive one', () => {
    const planks = [
      { id: 'p1', name: 'A', pw: 300, ph: 300, label: 'A' },
      { id: 'p2', name: 'B', pw: 100, ph: 100, label: 'B' },
    ];
    const { panels } = packPlanksSmartMix(planks, kinds, 0);
    // Both should fit on 1 small panel (300+100 = 400 < 500)
    expect(panels).toHaveLength(1);
    expect(panels[0].kind.id).toBe('small');
  });

  it('returns kindCosts with correct counts and subtotals', () => {
    const planks = [
      { id: 'p1', name: 'A', pw: 600, ph: 400, label: 'A' },
    ];
    const { kindCosts, totalCost } = packPlanksSmartMix(planks, kinds, 0);
    expect(kindCosts['large'].count).toBe(1);
    expect(kindCosts['large'].subtotal).toBe(30);
    expect(totalCost).toBe(30);
  });

  it('marks pieces that fit nowhere as unplaced', () => {
    const tinyKind = [{ id: 'tiny', name: 'Tiny', width: 100, height: 100, pricePerPanel: 5 }];
    const planks = [{ id: 'p1', name: 'A', pw: 200, ph: 200, label: 'A' }];
    const { unplaced } = packPlanksSmartMix(planks, tinyKind, 0);
    expect(unplaced).toHaveLength(1);
  });
});
