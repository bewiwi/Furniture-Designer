/**
 * utils.js — Shared Utilities
 *
 * Common helper functions used across the application.
 */

/**
 * Escapes HTML special characters to prevent XSS injection.
 *
 * @param {string} str - The string to escape
 * @returns {string} HTML-safe string
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Downloads a Blob as a file by creating a temporary anchor element.
 *
 * @param {Blob} blob - The blob to download
 * @param {string} fileName - Name for the downloaded file
 */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Sanitizes a string for use as a filename.
 *
 * @param {string} name - Raw name
 * @returns {string} Filesystem-safe string
 */
export function sanitizeFileName(name) {
  return (name || 'furniture').replace(/\s+/g, '_').toLowerCase();
}

/**
 * Validates that a parsed JSON object has a valid furniture structure.
 * Throws an Error if the structure is invalid.
 *
 * @param {Object} data - The parsed JSON to validate
 * @returns {Object} The validated furniture object
 */
export function validateFurniture(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data: expected an object');
  }

  // Validate required top-level fields
  const requiredNumeric = ['width', 'height', 'depth', 'thickness'];
  for (const field of requiredNumeric) {
    if (typeof data[field] !== 'number' || !isFinite(data[field]) || data[field] <= 0) {
      throw new Error(`Invalid ${field}: must be a positive number`);
    }
  }

  if (typeof data.name !== 'string') {
    data.name = 'Imported Furniture';
  }

  // Validate root node
  if (!data.root || typeof data.root !== 'object') {
    throw new Error('Missing or invalid root node');
  }

  validateNode(data.root);

  return data;
}

/**
 * Recursively validates a node structure.
 *
 * @param {Object} node - The node to validate
 */
function validateNode(node) {
  if (!node.id || typeof node.id !== 'string') {
    throw new Error('Node missing valid id');
  }

  if (node.direction !== null && node.direction !== 'row' && node.direction !== 'col') {
    throw new Error(`Invalid direction: "${node.direction}"`);
  }

  if (!Array.isArray(node.children)) {
    node.children = [];
  }

  if (!Array.isArray(node.sizes)) {
    node.sizes = [];
  }

  if (node.direction && node.children.length !== node.sizes.length) {
    throw new Error('Mismatched children/sizes arrays');
  }

  if (node.direction && node.children.length < 2) {
    throw new Error('Subdivided node must have at least 2 children');
  }

  for (const size of node.sizes) {
    if (typeof size !== 'number' || size < 0) {
      throw new Error('Invalid child size');
    }
  }

  for (const child of node.children) {
    validateNode(child);
  }
}
