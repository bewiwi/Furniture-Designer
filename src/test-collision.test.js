import { describe, it, expect } from 'vitest';
import { generatePlanks } from './planks.js';
import { computeHoles, distributeHoles } from './holes.js';

describe('Dowel Hole Safety', () => {

  describe('distributeHoles symmetric margins', () => {
    it('should place first and last holes at equal margin distances', () => {
      const holes = distributeHoles(500, 50, 200);
      expect(holes[0]).toBe(50);
      const last = holes[holes.length - 1];
      expect(last).toBeCloseTo(450, 0); // 500 - 50 = 450
    });

    it('should be symmetric (front == back distance)', () => {
      const holes = distributeHoles(500, 50, 200);
      const distFromFront = holes[0];
      const distFromBack = 500 - holes[holes.length - 1];
      expect(distFromFront).toBe(distFromBack);
    });
  });

  describe('collision prevention via depth reduction on shared separators', () => {
    it('should reduce hole depth when opposite faces share the same coordinates', () => {
      const model = {
        width: 1000,
        height: 1000,
        depth: 500,
        thickness: 20,
        root: {
          id: 'root',
          direction: 'col',
          children: [
            {
              id: 'c1',
              direction: 'row',
              children: [
                { id: 'c1_1', direction: null, children: [], sizes: [] },
                { id: 'c1_2', direction: null, children: [], sizes: [] }
              ],
              sizes: [470, 470]
            },
            {
              id: 'c2',
              direction: 'row',
              children: [
                { id: 'c2_1', direction: null, children: [], sizes: [] },
                { id: 'c2_2', direction: null, children: [], sizes: [] }
              ],
              sizes: [470, 470]
            }
          ],
          sizes: [470, 470]
        }
      };

      const planks = generatePlanks(model);
      const holesMap = computeHoles(planks);
      
      // Find the middle separator
      const separator = planks.find(p => p.type === 'separator');
      expect(separator).toBeDefined();

      const holes = holesMap.get(separator.id);
      const leftHoles = holes.filter(h => h.face === 'left');
      const rightHoles = holes.filter(h => h.face === 'right');

      expect(leftHoles.length).toBeGreaterThan(0);
      expect(rightHoles.length).toBeGreaterThan(0);

      // Find any opposing-face holes at the same position
      for (const lh of leftHoles) {
        for (const rh of rightHoles) {
          if (lh.contactPos === rh.contactPos && lh.depthPos === rh.depthPos) {
            // Both should have reduced depth: floor(20/2) - 1 = 9mm
            const safeDepth = Math.floor(separator.w / 2) - 1; // 9mm for 20mm board
            expect(lh.depth).toBe(safeDepth);
            expect(rh.depth).toBe(safeDepth);
            // Combined depth (9 + 9 = 18) must NOT exceed board thickness (20)
            expect(lh.depth + rh.depth).toBeLessThanOrEqual(separator.w);
          }
        }
      }
    });
  });

  describe('top/bottom inversion fix', () => {
    it('should place holes on the correct face for vertical adjacency', () => {
      const model = {
        width: 600,
        height: 800,
        depth: 400,
        thickness: 20,
        root: {
          id: 'root',
          direction: 'row',
          children: [
            { id: 'c1', direction: null, children: [], sizes: [] },
            { id: 'c2', direction: null, children: [], sizes: [] }
          ],
          sizes: [370, 370]
        }
      };

      const planks = generatePlanks(model);
      const holesMap = computeHoles(planks);

      const shelf = planks.find(p => p.type === 'shelf');
      expect(shelf).toBeDefined();

      const holes = holesMap.get(shelf.id);
      const leftFaceHoles = holes.filter(h => h.face === 'left');
      const rightFaceHoles = holes.filter(h => h.face === 'right');
      expect(leftFaceHoles.length).toBeGreaterThan(0);
      expect(rightFaceHoles.length).toBeGreaterThan(0);
    });
  });
});
