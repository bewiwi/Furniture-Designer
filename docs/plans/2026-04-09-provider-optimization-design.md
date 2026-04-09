# Design: Provider-First Panel Optimization

## Overview
Currently, the Panel Plan optimization page allows users to add a flat list of `panelKinds` (e.g., standard panels, large panels). The algorithms optimize across all these mixed kinds. 
However, in reality, users purchase panels from specific providers (e.g., Leroy Merlin, Bricoman). Mixing panels from different shops incurs unacceptable transportation costs. 

This design introduces the concept of "Providers". The data model strictly nests panel dimensions within a Provider. Optimization algorithms will calculate the absolute cheapest cost *per provider*, allowing the user to simply compare which shop to visit for their overall project.

## Architecture & Data Flow

### 1. Storage & Migration (`src/storage.js`)
The `panelConfig` stored in `localStorage` drops the global `panelKinds` array in favor of a `providers` array.
**New Model:**
```javascript
{
  kerf: 3,
  algorithm: 'smart-mix', // 'smart-mix' | 'cheapest-for-all'
  providers: [
    {
      id: 'provider-1',
      name: 'Leroy Merlin',
      enabled: true,
      kinds: [
        { id: 'k1', name: 'Standard', width: 2440, height: 1220, pricePerPanel: 30, enabled: true }
      ]
    }
  ]
}
```
**Migration:** 
`migratePanelConfig` will check if `cfg.panelKinds` exists without `cfg.providers`. If so, it will map `cfg.panelKinds` into a new `'Default Provider'` object and place it inside `cfg.providers`, safely deleting the old `panelKinds` root property to ensure backwards compatibility.

### 2. UI Configuration Sidebar (`src/ui/cutplan-view.js`)
The left sidebar will render **Provider Cards** instead of loose panel rows.
- **Provider Header:** Contains the Provider name (editable), an enable/disable toggle (color dot), and a delete button.
- **Provider Body:** Contains the list of panel `kinds` available from that specific provider.
- Actions: Users can "Add Panel" strictly inside a specific Provider, or "Add Provider" at the master level.

### 3. Application Logic & Execution
The core packing algorithms (`packPlanks` and `packPlanksSmartMix` in `src/packer.js`) remain untouched as they already accept an array of dimension definitions. The logic shift occurs in standardizing how the UI loops over them.

When the user clicks **Recalculate**:
1. Iterate over all `cfg.providers` where `enabled === true`.
2. For each provider, gather its `kinds` where `enabled === true`.
3. If `cfg.algorithm === 'smart-mix'`: Call `packPlanksSmartMix(preparedPlanks, providerKinds)`.
4. If `cfg.algorithm === 'cheapest-for-all'`: Iterate strictly over the `providerKinds`, calling `packPlanks` for each independently, and keep the best single panel result as the provider's total score.
5. Rank the providers based on total cost and any unplaced piece count.

### 4. Ranking & Result Display
Instead of displaying a medal for individual panels, the Results pane outputs a **Ranked Provider List**.
🥇 Leroy Merlin — 120€ ($30 x 4 Standard)
🥈 Bricoman — 145€ ($20 x 2 Small + $35 x 3 Standard)
The layout allows the user to click the top-ranked Provider to expand its specific SVG cut views.
