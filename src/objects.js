/**
 * objects.js — Object Library Catalog
 *
 * Predefined 3D physical objects with bounds and vector representations.
 * Units are in millimeters. Dimensions: w=width, h=height, d=depth.
 *
 * Objects are grouped into categories for the UI selector.
 */

import { t } from './i18n.js';

// ---------------------------------------------------------------------------
// TVs
// ---------------------------------------------------------------------------
const svg_tv = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60" fill="rgba(30, 30, 40, 0.9)" stroke="#444" stroke-width="1"><rect x="2" y="2" width="96" height="52" rx="2" /><rect x="40" y="54" width="20" height="4" /><rect x="35" y="58" width="30" height="2" /></svg>`;

// ---------------------------------------------------------------------------
// Gaming consoles
// ---------------------------------------------------------------------------
const svg_switch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 173 104" fill="rgba(40, 40, 50, 0.9)" stroke="#666" stroke-width="2"><rect x="10" y="2" width="153" height="100" rx="4" /><rect x="20" y="-8" width="133" height="40" rx="2" fill="rgba(80, 80, 90, 0.8)"/><path d="M0 2a2 2 0 0 1 2-2h8v104H2a2 2 0 0 1-2-2z" fill="#00c3e3" stroke="none"/><path d="M165 0h6a2 2 0 0 1 2 2v100a2 2 0 0 1-2 2h-6z" fill="#ff4c4c" stroke="none"/></svg>`;

const svg_ps5 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 390" fill="#f0f0f0" stroke="#ccc" stroke-width="2"><path d="M10 20 Q 52 0 94 20 L 100 370 Q 52 390 4 370 Z" /><rect x="26" y="25" width="52" height="340" fill="#111" stroke="none" /><line x1="52" y1="25" x2="52" y2="365" stroke="#0070cc" stroke-width="2" /></svg>`;

const svg_xbox_series = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 151 301" fill="#1b1b1b" stroke="#333" stroke-width="1"><rect x="2" y="2" width="147" height="297" rx="2" /><ellipse cx="75" cy="20" rx="60" ry="15" fill="#107c10" /><line x1="75" y1="20" x2="75" y2="290" stroke="#333" stroke-width="2" /></svg>`;

// Xbox One (1ère gen, horizontale) — boîtier large flat 333×78mm front face
const svg_xbox_one = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 333 78" fill="#1a1a1a" stroke="#2a2a2a" stroke-width="1">
  <rect x="1" y="1" width="331" height="76" rx="4"/>
  <!-- disc slot -->
  <rect x="8" y="30" width="1" height="18" fill="#333" stroke="none"/>
  <!-- Xbox button -->
  <circle cx="28" cy="38" r="12" fill="#107c10" stroke="#0d6c0d" stroke-width="1"/>
  <text x="28" y="43" text-anchor="middle" font-size="13" fill="white" stroke="none" font-family="sans-serif">✕</text>
  <!-- optical drive slot -->
  <rect x="50" y="34" width="60" height="4" rx="1" fill="#111" stroke="#333"/>
  <!-- vents -->
  <line x1="280" y1="15" x2="320" y2="15" stroke="#333" stroke-width="1"/>
  <line x1="280" y1="22" x2="320" y2="22" stroke="#333" stroke-width="1"/>
  <line x1="280" y1="29" x2="320" y2="29" stroke="#333" stroke-width="1"/>
</svg>`;

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------
// A row of books standing on a shelf — shown as spines
const svg_books_row = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 260" stroke="#222" stroke-width="1">
  <rect x="0"   y="10"  width="30" height="250" rx="2" fill="#8B4513"/>
  <rect x="32"  y="30"  width="25" height="230" rx="2" fill="#4682B4"/>
  <rect x="59"  y="5"   width="35" height="255" rx="2" fill="#2E8B57"/>
  <rect x="96"  y="20"  width="28" height="240" rx="2" fill="#8B1A1A"/>
  <rect x="126" y="40"  width="22" height="220" rx="2" fill="#6A0DAD"/>
  <rect x="150" y="15"  width="32" height="245" rx="2" fill="#B8860B"/>
  <rect x="184" y="35"  width="26" height="225" rx="2" fill="#1C5F7A"/>
  <rect x="212" y="8"   width="30" height="252" rx="2" fill="#7B3F00"/>
  <rect x="244" y="25"  width="24" height="235" rx="2" fill="#4B5320"/>
  <rect x="270" y="45"  width="28" height="215" rx="2" fill="#722F37"/>
  <rect x="300" y="12"  width="30" height="248" rx="2" fill="#003366"/>
</svg>`;

// Grand format books (larger, fewer)
const svg_books_grand = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" stroke="#222" stroke-width="1">
  <rect x="0"   y="0"   width="42" height="280" rx="2" fill="#8B4513"/>
  <rect x="44"  y="20"  width="38" height="260" rx="2" fill="#2F4F4F"/>
  <rect x="84"  y="5"   width="45" height="275" rx="2" fill="#8B0000"/>
  <rect x="131" y="30"  width="38" height="250" rx="2" fill="#1F4E79"/>
  <rect x="171" y="10"  width="29" height="270" rx="2" fill="#4A3728"/>
</svg>`;

// ---------------------------------------------------------------------------
// IKEA Kallax inserts
// ---------------------------------------------------------------------------
// Kallax drawer (DRONA style) — square face with handle
const svg_kallax_tiroir = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330" fill="#e8e0d5" stroke="#c0b89a" stroke-width="2">
  <rect x="2" y="2" width="326" height="326" rx="4"/>
  <!-- drawer face lines -->
  <rect x="10" y="10" width="310" height="310" rx="2" fill="none" stroke="#bbb" stroke-width="1"/>
  <!-- handle bar -->
  <rect x="90" y="150" width="150" height="22" rx="11" fill="#a09070" stroke="#887060" stroke-width="1.5"/>
</svg>`;

// Kallax double drawer — 2 drawers stacked in one cell
const svg_kallax_tiroir_2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330" fill="#e8e0d5" stroke="#c0b89a" stroke-width="2">
  <rect x="2" y="2" width="326" height="326" rx="4"/>
  <!-- divider between the two drawers -->
  <line x1="2" y1="165" x2="328" y2="165" stroke="#b0a890" stroke-width="3"/>
  <!-- top drawer face -->
  <rect x="10" y="10" width="310" height="150" rx="2" fill="none" stroke="#bbb" stroke-width="1"/>
  <rect x="90" y="70" width="150" height="20" rx="10" fill="#a09070" stroke="#887060" stroke-width="1.5"/>
  <!-- bottom drawer face -->
  <rect x="10" y="170" width="310" height="150" rx="2" fill="none" stroke="#bbb" stroke-width="1"/>
  <rect x="90" y="240" width="150" height="20" rx="10" fill="#a09070" stroke="#887060" stroke-width="1.5"/>
</svg>`;

const svg_kallax_panier = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 330" fill="none" stroke="#888" stroke-width="2">
  <rect x="4" y="4" width="322" height="322" rx="4" fill="#c8baa0" stroke="#a09070"/>
  <!-- weave pattern -->
  <line x1="4" y1="110" x2="326" y2="110" stroke="#a09070" stroke-width="1"/>
  <line x1="4" y1="220" x2="326" y2="220" stroke="#a09070" stroke-width="1"/>
  <line x1="110" y1="4" x2="110" y2="326" stroke="#a09070" stroke-width="1"/>
  <line x1="220" y1="4" x2="220" y2="326" stroke="#a09070" stroke-width="1"/>
  <!-- open top indicator -->
  <rect x="4" y="4" width="322" height="24" rx="4" fill="#a09070" stroke="none"/>
</svg>`;

// ---------------------------------------------------------------------------
// Board games
// ---------------------------------------------------------------------------
// Board game stored standing on spine (visible side = spine)
const svg_jeu_s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 280">
  <rect x="0" y="0" width="55" height="280" rx="3" fill="#1a3a6b" stroke="#0f2a56" stroke-width="1"/>
  <rect x="5" y="5" width="45" height="270" rx="2" fill="none" stroke="#ffffff22" stroke-width="1"/>
  <!-- title bar -->
  <rect x="5" y="15" width="45" height="40" rx="1" fill="#ffffff15"/>
  <!-- game art suggestion -->
  <circle cx="27" cy="160" r="22" fill="#ffffff12" stroke="#ffffff20" stroke-width="1"/>
  <polygon points="27,142 42,175 12,175" fill="#ffffff18" stroke="none"/>
</svg>`;

const svg_jeu_m = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 75 295">
  <rect x="0" y="0" width="75" height="295" rx="3" fill="#8B1A1A" stroke="#6a1212" stroke-width="1"/>
  <rect x="5" y="5" width="65" height="285" rx="2" fill="none" stroke="#ffffff22" stroke-width="1"/>
  <rect x="5" y="15" width="65" height="50" rx="1" fill="#ffffff15"/>
  <circle cx="37" cy="185" r="30" fill="#ffffff10" stroke="#ffffff18" stroke-width="1"/>
  <rect x="17" y="165" width="40" height="40" rx="2" fill="#ffffff15" stroke="none"/>
</svg>`;

const svg_jeu_l = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 340">
  <rect x="0" y="0" width="110" height="340" rx="3" fill="#2E4A1E" stroke="#1d3212" stroke-width="1"/>
  <rect x="5" y="5" width="100" height="330" rx="2" fill="none" stroke="#ffffff22" stroke-width="1"/>
  <rect x="5" y="15" width="100" height="60" rx="1" fill="#ffffff15"/>
  <!-- hero figure suggestion -->
  <ellipse cx="55" cy="210" rx="35" ry="45" fill="#ffffff10" stroke="#ffffff18" stroke-width="1"/>
  <rect x="30" y="175" width="50" height="70" rx="4" fill="#ffffff12" stroke="none"/>
  <!-- hex grid pattern suggestion -->
  <circle cx="35" cy="290" r="10" fill="none" stroke="#ffffff20" stroke-width="1"/>
  <circle cx="55" cy="290" r="10" fill="none" stroke="#ffffff20" stroke-width="1"/>
  <circle cx="75" cy="290" r="10" fill="none" stroke="#ffffff20" stroke-width="1"/>
</svg>`;

// Flat board game box (stored horizontally stacked)
const svg_jeu_flat = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <!-- stack of 3 boxes -->
  <rect x="0" y="200" width="300" height="100" rx="3" fill="#1a3a6b" stroke="#0f2a56" stroke-width="1.5"/>
  <rect x="5" y="205" width="290" height="90" rx="2" fill="none" stroke="#ffffff20" stroke-width="1"/>
  <rect x="0" y="100" width="300" height="98" rx="3" fill="#8B0000" stroke="#6a0000" stroke-width="1.5"/>
  <rect x="5" y="105" width="290" height="88" rx="2" fill="none" stroke="#ffffff20" stroke-width="1"/>
  <rect x="0" y="0"   width="300" height="98" rx="3" fill="#2E4A1E" stroke="#1d3212" stroke-width="1.5"/>
  <rect x="5" y="5"   width="290" height="88" rx="2" fill="none" stroke="#ffffff20" stroke-width="1"/>
</svg>`;

// ---------------------------------------------------------------------------
// Catalog — names are resolved via i18n at call time
// ---------------------------------------------------------------------------
export const OBJECT_CATALOG = [
  // ——— Télévisions ———
  { id: 'tv_55',           get name() { return t('obj.tv_55'); },           w: 1230, h: 710, d: 40,  svg: svg_tv },
  { id: 'tv_42',           get name() { return t('obj.tv_42'); },           w:  930, h: 520, d: 40,  svg: svg_tv },
  // ——— Consoles ———
  { id: 'switch',          get name() { return t('obj.switch'); },          w:  173, h: 104, d: 54,  svg: svg_switch },
  { id: 'xbox_one',        get name() { return t('obj.xbox_one'); },        w:  333, h:  78, d: 274, svg: svg_xbox_one },
  { id: 'xbox_x',          get name() { return t('obj.xbox_x'); },          w:  151, h: 301, d: 151, svg: svg_xbox_series },
  { id: 'ps5',             get name() { return t('obj.ps5'); },             w:  104, h: 390, d: 260, svg: svg_ps5 },
  // ——— Livres ———
  { id: 'books_row',       get name() { return t('obj.books_row'); },       w: 330, h: 260, d: 150, svg: svg_books_row },
  { id: 'books_grand',     get name() { return t('obj.books_grand'); },     w: 200, h: 280, d: 200, svg: svg_books_grand },
  // ——— Kallax inserts ———
  { id: 'kallax_tiroir',   get name() { return t('obj.kallax_tiroir'); },   w: 330, h: 330, d: 380, svg: svg_kallax_tiroir },
  { id: 'kallax_tiroir_2', get name() { return t('obj.kallax_tiroir_2'); }, w: 330, h: 330, d: 380, svg: svg_kallax_tiroir_2 },
  { id: 'kallax_panier',   get name() { return t('obj.kallax_panier'); },   w: 330, h: 330, d: 330, svg: svg_kallax_panier },
  // ——— Jeux de société ———
  { id: 'jeu_s',           get name() { return t('obj.jeu_s'); },           w:  55, h: 280, d: 240, svg: svg_jeu_s },
  { id: 'jeu_m',           get name() { return t('obj.jeu_m'); },           w:  75, h: 295, d: 295, svg: svg_jeu_m },
  { id: 'jeu_l',           get name() { return t('obj.jeu_l'); },           w: 110, h: 340, d: 340, svg: svg_jeu_l },
  { id: 'jeu_flat',        get name() { return t('obj.jeu_flat'); },        w: 300, h: 300, d: 100, svg: svg_jeu_flat },
  // ——— Audio ———
  { id: 'vinyl_player',    get name() { return t('obj.vinyl_player'); },    w: 430, h: 150, d: 350, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430 150" fill="rgba(120, 100, 80, 0.9)" stroke="#222" stroke-width="2"><rect x="0" y="100" width="430" height="50" rx="3" /><rect x="10" y="10" width="410" height="90" fill="rgba(255, 255, 255, 0.1)" stroke="#aaa" /><ellipse cx="215" cy="55" rx="50" ry="20" fill="#111" stroke="#333" /><circle cx="215" cy="55" r="5" fill="#a00" /></svg>` },
];

/**
 * Returns the catalog item by ID, or null.
 */
export function getCatalogItem(id) {
  return OBJECT_CATALOG.find(i => i.id === id) || null;
}
