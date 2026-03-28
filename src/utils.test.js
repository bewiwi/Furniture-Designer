/**
 * utils.test.js — Unit tests for shared utilities
 */

import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeFileName, validateFurniture } from './utils.js';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('handles null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('converts non-strings to string', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('sanitizeFileName', () => {
  it('lowercases and replaces whitespace with underscores', () => {
    expect(sanitizeFileName('My Furniture')).toBe('my_furniture');
  });

  it('strips special characters', () => {
    expect(sanitizeFileName('my/file\\name..txt')).toBe('my_file_name_txt');
  });

  it('collapses consecutive underscores', () => {
    expect(sanitizeFileName('a   b---c')).toBe('a_b---c');
  });

  it('defaults to "furniture" for empty input', () => {
    expect(sanitizeFileName('')).toBe('furniture');
    expect(sanitizeFileName(null)).toBe('furniture');
  });

  it('preserves hyphens and underscores', () => {
    expect(sanitizeFileName('my-furniture_v2')).toBe('my-furniture_v2');
  });
});

describe('validateFurniture', () => {
  function validFurniture() {
    return {
      name: 'Test',
      width: 1000,
      height: 2000,
      depth: 300,
      thickness: 18,
      root: {
        id: 'root-1',
        direction: null,
        children: [],
        sizes: [],
      },
    };
  }

  it('accepts valid furniture', () => {
    const f = validFurniture();
    const result = validateFurniture(f);
    expect(result).toBe(f);
  });

  it('throws for missing numeric fields', () => {
    const f = validFurniture();
    f.width = 'not a number';
    expect(() => validateFurniture(f)).toThrow('width');
  });

  it('throws for negative dimensions', () => {
    const f = validFurniture();
    f.height = -100;
    expect(() => validateFurniture(f)).toThrow('height');
  });

  it('throws for missing root', () => {
    const f = validFurniture();
    delete f.root;
    expect(() => validateFurniture(f)).toThrow('root');
  });

  it('throws for subdivided node with < 2 children', () => {
    const f = validFurniture();
    f.root.direction = 'row';
    f.root.children = [{ id: 'c1', direction: null, children: [], sizes: [] }];
    f.root.sizes = [500];
    expect(() => validateFurniture(f)).toThrow('at least 2');
  });

  it('throws for mismatched children/sizes', () => {
    const f = validFurniture();
    f.root.direction = 'row';
    f.root.children = [
      { id: 'c1', direction: null, children: [], sizes: [] },
      { id: 'c2', direction: null, children: [], sizes: [] },
    ];
    f.root.sizes = [500]; // Only 1 size for 2 children
    expect(() => validateFurniture(f)).toThrow('Mismatched');
  });

  it('defaults name if not a string', () => {
    const f = validFurniture();
    f.name = 123;
    validateFurniture(f);
    expect(f.name).toBe('Imported Furniture');
  });

  it('throws for null input', () => {
    expect(() => validateFurniture(null)).toThrow();
  });
});
