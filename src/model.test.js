/**
 * model.test.js — Unit tests for the Furniture Data Model
 *
 * Covers: createFurniture, subdivide, removeSubdivision,
 * removeSingleChild, addSingleChild, resizeChild, toggleChildLock,
 * reorderChild, findNodeById, getNodePath, getNodeDimensions
 */

import { describe, it, expect } from 'vitest';
import {
  generateId,
  createFurniture,
  createNode,
  subdivide,
  removeSubdivision,
  removeSingleChild,
  addSingleChild,
  resizeChild,
  toggleChildLock,
  reorderChild,
  findNodeById,
  getNodePath,
  getNodeDimensions,
  equalizeSizes,
  normalizeTree,
  cloneFurniture,
  resizeNodeRecursively,
  addObjectToNode,
  removeObjectFromNode,
  setObjectAlignment,
} from './model.js';

// Stub i18n so model.js works without the full i18n module
import { vi } from 'vitest';
vi.mock('./i18n.js', () => ({
  t: (key) => key,
}));

describe('dowelConfig migration via utils.validateFurniture', () => {
  // Test requires validateFurniture which is in utils.js
  const { validateFurniture } = require('./utils.js');
  
  it('migrates older depth to dowelLength', () => {
    const data = { 
      width: 100, height: 100, depth: 100, thickness: 18, 
      root: { id: 'root', direction: null, children: [], sizes: [] }, 
      dowelConfig: { diameter: 8, depth: 15, edgeMargin: 50, spacing: 200 } 
    };
    const validated = validateFurniture(data);
    expect(validated.dowelConfig.dowelLength).toBeDefined();
    expect(validated.dowelConfig.dowelLength).toBe(30); // 15 * 2
    expect(validated.dowelConfig.depth).toBeUndefined();
  });
});

describe('createFurniture', () => {
  it('creates furniture with correct defaults', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    expect(f.name).toBe('Test');
    expect(f.width).toBe(1000);
    expect(f.height).toBe(2000);
    expect(f.depth).toBe(300);
    expect(f.thickness).toBe(18);
    expect(f.root).toBeDefined();
    expect(f.root.id).toBeTruthy();
    expect(f.root.direction).toBeNull();
    expect(f.root.children).toEqual([]);
  });

  it('generates unique IDs', () => {
    const f1 = createFurniture();
    const f2 = createFurniture();
    expect(f1.id).not.toBe(f2.id);
    expect(f1.root.id).not.toBe(f2.root.id);
  });
});

describe('subdivide', () => {
  it('subdivides into equal parts', () => {
    const node = createNode();
    subdivide(node, 'row', 3, 1000, 18);

    expect(node.direction).toBe('row');
    expect(node.children).toHaveLength(3);
    expect(node.sizes).toHaveLength(3);

    // Available = 1000 - 2*18 = 964. Equal = 321. Remainder = 1 → last child
    expect(node.sizes[0]).toBe(321);
    expect(node.sizes[1]).toBe(321);
    expect(node.sizes[2]).toBe(322); // Gets remainder
  });

  it('subdivides into columns', () => {
    const node = createNode();
    subdivide(node, 'col', 2, 500, 18);

    expect(node.direction).toBe('col');
    expect(node.children).toHaveLength(2);
    // Available = 500 - 18 = 482. Equal = 241. No remainder
    expect(node.sizes[0]).toBe(241);
    expect(node.sizes[1]).toBe(241);
  });

  it('throws for count < 2', () => {
    const node = createNode();
    expect(() => subdivide(node, 'row', 1, 1000, 18)).toThrow();
  });

  it('throws for count > 20', () => {
    const node = createNode();
    expect(() => subdivide(node, 'row', 21, 1000, 18)).toThrow();
  });

  it('throws when not enough space', () => {
    const node = createNode();
    // 5 subdivisions need 4 separators of 18mm = 72mm. Total 50 < 72
    expect(() => subdivide(node, 'row', 5, 50, 18)).toThrow();
  });
});

describe('removeSubdivision', () => {
  it('turns a subdivided node back into a leaf', () => {
    const node = createNode();
    subdivide(node, 'row', 3, 1000, 18);

    removeSubdivision(node);
    expect(node.direction).toBeNull();
    expect(node.children).toEqual([]);
    expect(node.sizes).toEqual([]);
  });
});

describe('removeSingleChild', () => {
  it('removes a child and redistributes space to neighbor', () => {
    const node = createNode();
    subdivide(node, 'row', 3, 1000, 18);

    const originalSizes = [...node.sizes];
    const removedSize = originalSizes[1];

    // Remove middle child — space goes to an unlocked neighbor
    removeSingleChild(node, 1, 18);

    expect(node.children).toHaveLength(2);
    expect(node.sizes).toHaveLength(2);
    // The inherited space includes the separator thickness
    const totalAfter = node.sizes.reduce((s, v) => s + v, 0);
    const totalBefore = originalSizes.reduce((s, v) => s + v, 0);
    expect(totalAfter).toBe(totalBefore + 18); // Gained one separator
  });

  it('collapses subdivision when only 2 children remain', () => {
    const node = createNode();
    const originalId = node.id;
    subdivide(node, 'col', 2, 500, 18);

    // Give the surviving child its own subdivision
    const survivor = node.children[1];
    subdivide(survivor, 'row', 2, 241, 18);

    // Remove child at index 0
    removeSingleChild(node, 0, 18);

    // Parent should inherit the survivor's structure
    expect(node.id).toBe(originalId); // ID preserved
    expect(node.direction).toBe('row');
    expect(node.children).toHaveLength(2);
  });

  it('throws for invalid child index', () => {
    const node = createNode();
    subdivide(node, 'row', 3, 1000, 18);
    expect(() => removeSingleChild(node, -1, 18)).toThrow();
    expect(() => removeSingleChild(node, 5, 18)).toThrow();
  });
});

describe('addSingleChild', () => {
  it('appends a new child and takes space from donor', () => {
    const node = createNode();
    subdivide(node, 'row', 2, 1000, 18);

    const totalBefore = node.sizes.reduce((s, v) => s + v, 0);

    addSingleChild(node, 18, 100);

    expect(node.children).toHaveLength(3);
    expect(node.sizes).toHaveLength(3);
    expect(node.sizes[2]).toBe(100);

    // Total sizes should decrease by thickness (new separator)
    const totalAfter = node.sizes.reduce((s, v) => s + v, 0);
    expect(totalAfter).toBe(totalBefore - 18);
  });

  it('does nothing on a leaf node', () => {
    const node = createNode();
    addSingleChild(node, 18);
    expect(node.children).toHaveLength(0);
  });

  it('throws when no donor has enough space', () => {
    const node = createNode();
    subdivide(node, 'row', 2, 300, 18);
    // Lock first child, second is small
    // Try to add a child that needs more space than available
    expect(() => addSingleChild(node, 18, 500)).toThrow();
  });
});

describe('resizeChild', () => {
  it('resizes a child and adjusts neighbor', () => {
    const node = createNode();
    subdivide(node, 'col', 2, 500, 18);

    const size0Before = node.sizes[0];
    const size1Before = node.sizes[1];

    resizeChild(node, 0, size0Before + 50);

    expect(node.sizes[0]).toBe(size0Before + 50);
    expect(node.sizes[1]).toBe(size1Before - 50);
  });

  it('does nothing when delta is 0', () => {
    const node = createNode();
    subdivide(node, 'col', 2, 500, 18);
    const sizesBefore = [...node.sizes];
    resizeChild(node, 0, sizesBefore[0]);
    expect(node.sizes).toEqual(sizesBefore);
  });

  it('throws when neighbor would be too small', () => {
    const node = createNode();
    subdivide(node, 'col', 2, 500, 18);
    // Try to make child 0 almost the full space
    expect(() => resizeChild(node, 0, 490)).toThrow();
  });

  it('throws for invalid index', () => {
    const node = createNode();
    subdivide(node, 'col', 2, 500, 18);
    expect(() => resizeChild(node, -1, 100)).toThrow();
    expect(() => resizeChild(node, 5, 100)).toThrow();
  });

  it('skips locked neighbors and finds an unlocked one', () => {
    const node = createNode();
    subdivide(node, 'col', 3, 900, 18);

    // Lock child 1 (the immediate right neighbor of child 0)
    node.children[1].locked = true;

    const size0Before = node.sizes[0];
    const size2Before = node.sizes[2];

    resizeChild(node, 0, size0Before + 30);

    expect(node.sizes[0]).toBe(size0Before + 30);
    // Child 1 should be unchanged (locked)
    // Child 2 absorbs the delta
    expect(node.sizes[2]).toBe(size2Before - 30);
  });
});


  describe('resizeNodeRecursively', () => {
    it('steals space from a matching ancestor when siblings are locked', () => {
      const f = createFurniture('Test', 1000, 1000, 300, 20);
      // Root is row: sizes [470, 470]
      subdivide(f.root, 'row', 2, 960, 20); 
      // Subdivide child 0 into cols (widths) - sizes [470, 470]
      subdivide(f.root.children[0], 'col', 2, 960, 20);
      // Subdivide child 0's child 0 into rows (heights) - sizes [225, 225]
      subdivide(f.root.children[0].children[0], 'row', 2, 470, 20);
      
      // We lock the sibling of the deep row
      f.root.children[0].children[0].children[1].locked = true;
      
      const targetId = f.root.children[0].children[0].children[0].id;
      
      // We need to import resizeNodeRecursively from model.test.js? No, it's already there
      
      resizeNodeRecursively(f.root, targetId, 325);
      
      // Target should be exactly 325
      expect(f.root.children[0].children[0].sizes[0]).toBe(325);
      
      // Grandparent's sibling (root's child 1) should have lost 100
      // 470 -> 370
      expect(f.root.sizes[1]).toBe(370);
    });
  });

describe('toggleChildLock', () => {
  it('locks and unlocks a child', () => {
    const node = createNode();
    subdivide(node, 'row', 3, 1000, 18);

    expect(node.children[0].locked).toBe(false);

    toggleChildLock(node, 0);
    expect(node.children[0].locked).toBe(true);

    toggleChildLock(node, 0);
    expect(node.children[0].locked).toBe(false);
  });

  it('allows locking all children', () => {
    const node = createNode();
    subdivide(node, 'row', 2, 1000, 18);

    toggleChildLock(node, 0);
    expect(node.children[0].locked).toBe(true);

    // Trying to lock the only remaining free child should succeed now
    toggleChildLock(node, 1);
    expect(node.children[1].locked).toBe(true);
  });

  it('throws for invalid index', () => {
    const node = createNode();
    subdivide(node, 'row', 2, 1000, 18);
    expect(() => toggleChildLock(node, -1)).toThrow();
    expect(() => toggleChildLock(node, 5)).toThrow();
  });
});

describe('reorderChild', () => {
  it('moves a child from one index to another', () => {
    const node = createNode();
    subdivide(node, 'row', 3, 1000, 18);

    const id0 = node.children[0].id;
    const id1 = node.children[1].id;
    const id2 = node.children[2].id;

    reorderChild(node, 0, 2);

    // After splice-remove from 0 and insert at 2:
    // [A, B, C] → remove A → [B, C] → insert A at 2 → [B, C, A]
    expect(node.children[0].id).toBe(id1);
    expect(node.children[1].id).toBe(id2);
    expect(node.children[2].id).toBe(id0);
  });

  it('throws for out of bounds indices', () => {
    const node = createNode();
    subdivide(node, 'row', 2, 1000, 18);
    expect(() => reorderChild(node, -1, 0)).toThrow();
    expect(() => reorderChild(node, 0, 5)).toThrow();
  });
});

describe('findNodeById', () => {
  it('finds root node', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    const found = findNodeById(f.root, f.root.id);
    expect(found).toBe(f.root);
  });

  it('finds deeply nested node', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    subdivide(f.root, 'row', 2, 1964, 18);
    subdivide(f.root.children[0], 'col', 2, 964, 18);

    const deepChild = f.root.children[0].children[1];
    const found = findNodeById(f.root, deepChild.id);
    expect(found).toBe(deepChild);
  });

  it('returns null for non-existent ID', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    const found = findNodeById(f.root, 'nonexistent');
    expect(found).toBeNull();
  });
});

describe('getNodePath', () => {
  it('returns path from root to target', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    subdivide(f.root, 'row', 3, 1964, 18);

    const target = f.root.children[1];
    const path = getNodePath(f.root, target.id);

    expect(path).not.toBeNull();
    expect(path).toHaveLength(2);
    expect(path[0].node).toBe(f.root);
    expect(path[0].childIndex).toBe(1);
  });

  it('returns single element for root', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    const path = getNodePath(f.root, f.root.id);
    expect(path).toEqual([f.root]);
  });

  it('returns null for non-existent target', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    const path = getNodePath(f.root, 'nonexistent');
    expect(path).toBeNull();
  });
});

describe('getNodeDimensions', () => {
  it('returns root inner dimensions', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    const dims = getNodeDimensions(f, f.root.id);

    expect(dims).toEqual({
      x: 18,
      y: 18,
      w: 964,  // 1000 - 2*18
      h: 1964, // 2000 - 2*18
    });
  });

  it('returns correct dimensions for row subdivisions', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    subdivide(f.root, 'row', 2, 1964, 18);

    const dims0 = getNodeDimensions(f, f.root.children[0].id);
    const dims1 = getNodeDimensions(f, f.root.children[1].id);

    expect(dims0.x).toBe(18);
    expect(dims0.y).toBe(18);
    expect(dims0.w).toBe(964);
    expect(dims0.h).toBe(f.root.sizes[0]);

    expect(dims1.x).toBe(18);
    expect(dims1.y).toBe(18 + f.root.sizes[0] + 18);
    expect(dims1.w).toBe(964);
    expect(dims1.h).toBe(f.root.sizes[1]);
  });

  it('returns correct dimensions for column subdivisions', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    subdivide(f.root, 'col', 2, 964, 18);

    const dims0 = getNodeDimensions(f, f.root.children[0].id);
    const dims1 = getNodeDimensions(f, f.root.children[1].id);

    expect(dims0.y).toBe(18);
    expect(dims0.x).toBe(18);
    expect(dims0.h).toBe(1964);
    expect(dims0.w).toBe(f.root.sizes[0]);

    expect(dims1.y).toBe(18);
    expect(dims1.x).toBe(18 + f.root.sizes[0] + 18);
  });

  it('returns null for non-existent node', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    const dims = getNodeDimensions(f, 'nonexistent');
    expect(dims).toBeNull();
  });
});

describe('cloneFurniture', () => {
  it('creates a deep clone', () => {
    const f = createFurniture('Test', 1000, 2000, 300, 18);
    subdivide(f.root, 'row', 2, 1964, 18);

    const clone = cloneFurniture(f);
    expect(clone).toEqual(f);
    expect(clone).not.toBe(f);
    expect(clone.root).not.toBe(f.root);
    expect(clone.root.children[0]).not.toBe(f.root.children[0]);
  });
});



describe('equalizeSizes', () => {
  it('equalizes sizes and fits the available space', () => {
    const f = createFurniture('Test', 1000, 1000, 300, 20);
    // Root inner space is 960x960
    subdivide(f.root, 'row', 3, 960, 20);
    // Initially sizes are roughly (960 - 2*20)/3 = 306, 306, 308
    
    // Force corrupted sizes
    f.root.sizes = [500, 500, 500];
    
    equalizeSizes(f.root, 960, 20);
    
    // (960 - 2*20) / 3 = 920 / 3 = 306 with remainder 2
    expect(f.root.sizes).toEqual([306, 306, 308]);
  });

  it('respects locked sizes', () => {
    const f = createFurniture('Test', 1000, 1000, 300, 20);
    subdivide(f.root, 'row', 3, 960, 20);
    
    f.root.children[0].locked = true;
    f.root.sizes = [400, 100, 100]; // Total 600, but space is 960
    
    equalizeSizes(f.root, 960, 20);
    
    // Space for free: 960 - 2*20 - 400 (locked) = 920 - 400 = 520
    // 520 / 2 = 260
    expect(f.root.sizes).toEqual([400, 260, 260]);
  });
});

describe('normalizeTree', () => {
  it('rescales the entire tree when available space changes', () => {
    const f = createFurniture('Test', 1000, 1000, 300, 20);
    subdivide(f.root, 'row', 2, 960, 20); // sizes [470, 470]
    subdivide(f.root.children[0], 'col', 2, 960, 20); // sizes [470, 470]
    
    // Change furniture width
    f.width = 500;
    // New root inner width: 500 - 40 = 460
    // New root inner height: 1000 - 40 = 960
    
    normalizeTree(f.root, 460, 960, 20);
    
    // Root subdivision was row, so height should stay same ratio (equal)
    expect(f.root.sizes).toEqual([470, 470]);
    
    // Child 0 subdivision was col, should be rescaled from 960 available to 460 available
    // (460 - 20) / 2 = 220
    expect(f.root.children[0].sizes).toEqual([220, 220]);
  });

  it('handles targetSum 0 when resizing parent and children are locked', () => {
    const f = createFurniture('Test', 1000, 1000, 300, 20);
    subdivide(f.root, 'row', 2, 960, 20); 
    f.root.children[0].locked = true;
    f.root.children[1].locked = true;
    
    // Normalizing with exactly thickness height means targetSum = 0
    normalizeTree(f.root, 960, 20, 20);
    
    expect(f.root.sizes).toEqual([0, 0]);
  });

  it('respects locked sizes when scaling', () => {
    const f = createFurniture('Test', 1000, 1000, 300, 20);
    subdivide(f.root, 'row', 3, 960, 20);
    f.root.sizes = [200, 360, 360];
    f.root.children[0].locked = true;

    // Change furniture height to 1200 (inner height = 1160)
    normalizeTree(f.root, 960, 1160, 20);

    expect(f.root.sizes[0]).toBe(200); // Locked, must not change
    expect(f.root.sizes[1]).toBe(460); // (1160 - 40 - 200) / 2 = 460
    expect(f.root.sizes[2]).toBe(460);
  });
});

describe('generateId', () => {
  it('generates a valid UUID string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});

describe('removeSubdivision (Deep)', () => {
  it('clears nested structure completely', () => {
    const f = createFurniture();
    subdivide(f.root, 'row', 2, 1000, 20);
    subdivide(f.root.children[0], 'col', 2, 1000, 20);
    
    removeSubdivision(f.root);
    expect(f.root.direction).toBeNull();
    expect(f.root.children).toHaveLength(0);
    expect(f.root.sizes).toHaveLength(0);
  });
});

describe('addSingleChild (Advanced)', () => {
  it('takes space from the last unlocked child that has enough space', () => {
    const node = createNode();
    subdivide(node, 'row', 2, 1000, 20);
    node.sizes = [500, 460]; // Space available = 1000 - 20 = 980 total sum
    
    // Add child, should take from index 1 (last unlocked)
    addSingleChild(node, 20, 100);
    
    expect(node.children).toHaveLength(3);
    expect(node.sizes[1]).toBe(460 - 100 - 20);
    expect(node.sizes[2]).toBe(100);
  });
});

describe('Helper Object Methods', () => {
  it('should initialize and add an object to a node', () => {
    const node = createNode();
    expect(node.objects).toBeUndefined();
    
    addObjectToNode(node, 'tv_55');
    expect(node.objects.length).toBe(1);
    expect(node.objects[0].id).toBe('tv_55');
    expect(node.objects[0].align).toBe('center'); // default
  });

  it('should remove an object from a node', () => {
    const node = createNode();
    addObjectToNode(node, 'tv_55');
    addObjectToNode(node, 'ps5');
    expect(node.objects.length).toBe(2);
    
    removeObjectFromNode(node, 0);
    expect(node.objects.length).toBe(1);
    expect(node.objects[0].id).toBe('ps5');
  });

  it('should not throw if removing an out-of-bounds object', () => {
    const node = createNode();
    addObjectToNode(node, 'tv_55');
    removeObjectFromNode(node, 10);
    expect(node.objects.length).toBe(1);
  });

  it('should update object alignment', () => {
    const node = createNode();
    addObjectToNode(node, 'tv_55');
    
    setObjectAlignment(node, 0, 'left');
    expect(node.objects[0].align).toBe('left');
  });

  it('should be correctly preserved during cloneFurniture', () => {
    const furniture = createFurniture('Test', 1000, 1000, 300, 20);
    addObjectToNode(furniture.root, 'tv_42');
    
    const clone = cloneFurniture(furniture);
    expect(clone.root.objects).toBeDefined();
    expect(clone.root.objects.length).toBe(1);
    expect(clone.root.objects[0].id).toBe('tv_42');
    
    // Ensure deep serialization works
    expect(clone.root.objects).not.toBe(furniture.root.objects);
  });
});
