/**
 * objects.js — Object Library Catalog
 *
 * Predefined 3D physical objects with bounds and vector representations.
 * Units are in millimeters.
 */

// Simple iconic SVG strings for each recognized console and media device.
// Using standard SVG syntax; colors can be overridden by CSS.
const svg_tv = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" fill="rgba(30, 30, 40, 0.9)" stroke="#444" stroke-width="1"><rect x="2" y="2" width="96" height="52" rx="2" /><rect x="40" y="54" width="20" height="4" /><rect x="35" y="58" width="30" height="2" /></svg>`;

const svg_switch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 173 104" fill="rgba(40, 40, 50, 0.9)" stroke="#666" stroke-width="2"><rect x="10" y="2" width="153" height="100" rx="4" /><rect x="20" y="-8" width="133" height="40" rx="2" fill="rgba(80, 80, 90, 0.8)"/><path d="M0 2a2 2 0 0 1 2-2h8v104H2a2 2 0 0 1-2-2z" fill="#00c3e3" stroke="none"/><path d="M165 0h6a2 2 0 0 1 2 2v100a2 2 0 0 1-2 2h-6z" fill="#ff4c4c" stroke="none"/></svg>`;

const svg_ps5 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 390" fill="#f0f0f0" stroke="#ccc" stroke-width="2"><path d="M10 20 Q 52 0 94 20 L 100 370 Q 52 390 4 370 Z" /><rect x="26" y="25" width="52" height="340" fill="#111" stroke="none" /><line x1="52" y1="25" x2="52" y2="365" stroke="#0070cc" stroke-width="2" /></svg>`;

const svg_xbox = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 151 301" fill="#1b1b1b" stroke="#333" stroke-width="1"><rect x="2" y="2" width="147" height="297" rx="2" /><ellipse cx="75" cy="20" rx="60" ry="15" fill="#107c10" /><line x1="75" y1="20" x2="75" y2="290" stroke="#333" stroke-width="2" /></svg>`;

const svg_vinyl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 150" fill="rgba(120, 100, 80, 0.9)" stroke="#222" stroke-width="2"><rect x="0" y="100" width="430" height="50" rx="3" /><rect x="10" y="10" width="410" height="90" fill="rgba(255, 255, 255, 0.1)" stroke="#aaa" /><ellipse cx="215" cy="55" rx="50" ry="20" fill="#111" stroke="#333" /><circle cx="215" cy="55" r="5" fill="#a00" /></svg>`;


export const OBJECT_CATALOG = [
  { id: 'tv_55', name: 'TV 55"', w: 1230, h: 710, d: 40, svg: svg_tv },
  { id: 'tv_42', name: 'TV 42"', w: 930, h: 520, d: 40, svg: svg_tv },
  { id: 'switch', name: 'Switch (Dock)', w: 173, h: 104, d: 54, svg: svg_switch },
  { id: 'xbox_x', name: 'Xbox Series X', w: 151, h: 301, d: 151, svg: svg_xbox },
  { id: 'ps5', name: 'PlayStation 5', w: 104, h: 390, d: 260, svg: svg_ps5 },
  { id: 'vinyl_player', name: 'Platine Vinyle', w: 430, h: 150, d: 350, svg: svg_vinyl },
];

/**
 * Returns the catalog item by ID, or null.
 */
export function getCatalogItem(id) {
  return OBJECT_CATALOG.find(i => i.id === id) || null;
}
