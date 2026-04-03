# 2D Panel Cut Plan (Guillotine Packer)

## Overview
This feature adds a new page capable of generating 2D panel cut diagrams directly from the furniture model, specifically designed for workshop practicality using a guillotine logic algorithm. 

## 1. Algorithm & Data Flow
- **New Module:** `src/packer.js` will contain the Guillotine 2D bin-packing constraints.
- **Data Extractor:** We will iterate over `appState.planks` grouping them, and determining their two largest dimensions (length and width).
- **Placement Logic:** The pieces will be placed into the stock panels. A cut must slice completely through the remaining free space (guillotine). The saw blade kerf thickness will be decremented from available space along each cut to represent the physical material turned into sawdust.
- **Fallbacks:** If a piece doesn't fit on the active panel, it automatically opens a new panel. 

## 2. UI & User Inputs
- **Settings Form:** Handled in a new module, e.g., `src/ui/cutplan-view.js`. A control bar at the top with:
  - Panel Width (default: 2440mm)
  - Panel Height (default: 1220mm)
  - Blade Kerf (default: 3mm)
- **Persistence:** Bound to `appState.furniture.panelConfig` to ensure these dimensions are saved via localStorage/JSON exports.
- **DOM Integration:** Addition of `<main id="view-cutplan">` into `index.html`.
- **Toolbar:** Add an explicit icon/button referencing "View Panel Cut Plan".

## 3. Visual Rendering (SVGs)
- **Cut Diagrams:** A dynamically generated scaled `<svg>` document for every distinct physical panel used.
- **Content:** Packed rectangles matched visually with their respective letters (A, B, C...) derived from `planks.js` groupings. 
- **Waste Display:** Open, unused area rendered cleanly (e.g. gray diagonal hashes) to display available scrap material clearly.
- **Interactivity:** Added tooltips via simple native element `title` tags or JS hover states displaying exact cutting target dimensions.
