# Multi-Panel Kind Optimization — Panel Plan Page

## Overview

Extend the Panel Plan page to support multiple panel kinds (each with its own dimensions and price per panel), and add an algorithm selector that determines the cheapest cutting strategy. Two algorithms ship in v1: a per-type comparison baseline and a smart mixed-type optimizer.

## Data Model

`furniture.panelConfig` is extended from the current single-panel config:

**Before:**
```js
panelConfig: { width: 2440, height: 1220, kerf: 3 }
```

**After:**
```js
panelConfig: {
  kerf: 3,
  algorithm: 'smart-mix',           // 'cheapest-for-all' | 'smart-mix'
  panelKinds: [
    { id: 'uuid1', name: 'Standard', width: 2440, height: 1220, pricePerPanel: 30 },
    { id: 'uuid2', name: 'Large',    width: 2500, height: 2050, pricePerPanel: 65 },
  ]
}
```

Migration: on load, if `panelConfig` is in the old format (has `width`/`height` at top level), it is automatically promoted to the new format with a single `panelKinds` entry using price `0`.

## Algorithm A — "Cheapest Panel For All"

Run the existing guillotine packer once per panel kind, placing all pieces on that kind only. For each run compute:
- `panelsUsed` = number of panels needed
- `totalCost` = `panelsUsed × pricePerPanel`

Results: a sorted ranking table of all panel kinds by total cost, with the cheapest highlighted. The SVG layouts for the winning kind (lowest cost) are shown below the table.

## Algorithm C — "Smart Mix"

Places pieces one by one, sorted descending by area. For each piece:

1. **Try existing open panels** — attempt to fit the piece on any already-open panel across all kinds. If multiple panels accept it, prefer the one with best remaining space utilization (smallest leftover space after placement).
2. **Open a new panel** — if no open panel fits the piece, pick the cheapest panel kind where the piece fits and open a new panel of that kind.

Result: a heterogeneous list of panels (potentially mixing kinds), a grand total cost, and a per-kind cost breakdown.

## UI — `cutplan-view.js`

### Header Control Bar

**Panel Kinds manager** (replaces the single width/height inputs):
- A list of rows: `[Name input] [W input] [H input] [Price input] [Remove ✕]`
- `+ Add Panel Kind` button (adds a new row with default 2440×1220, price 0)
- Global `Kerf` input (unchanged)
- Algorithm selector dropdown: `Cheapest for All | Smart Mix`
- `Recalculate` button

### Results Section

**Algorithm A:**
- Cost comparison table: rank, name, panels needed, unit price, total cost, winner badge
- Full SVG layouts for the winning panel kind (or all if price is 0)

**Algorithm C:**
- Cost summary: e.g. "2× Standard (€60) + 1× Large (€65) = €125 total"
- SVG layouts for all panels used, each labeled with its kind name and index
- If all prices are 0, falls back to showing just panel count

## i18n Keys Required

```
cutplan.add_panel_kind      / Ajouter un type de panneau
cutplan.panel_kind_name     / Nom
cutplan.panel_kind_price    / Prix / panneau
cutplan.algorithm           / Algorithme
cutplan.algo.cheapest_all   / Moins cher (par type)
cutplan.algo.smart_mix      / Mix optimal
cutplan.cost_total          / Coût total : {cost}€
cutplan.cost_breakdown      / {count}× {name} = {subtotal}€
cutplan.ranking_title        / Comparaison des types de panneaux
cutplan.panel_kind_label     / Type : {name}
cutplan.winner               / ★ Meilleur prix
```

## Files to Modify

| File | Change |
|------|--------|
| `src/packer.js` | Add `packPlanksSmartMix(planks, panelKinds, kerf)` returning panels with kind metadata |
| `src/ui/cutplan-view.js` | Full rewrite of header form + results rendering |
| `src/i18n.js` | Add new translation keys (EN + FR) |
| `src/storage.js` | Migration logic for old `panelConfig` format |

## Verification

- Define 2+ panel kinds, run Algorithm A → confirm cost table ranks correctly
- Run Algorithm C → confirm pieces land on cheapest available open panel first
- Define a piece larger than one kind but fitting another → confirm it lands on the correct kind
- Old saved furniture with single-panel config loads without errors
- Panel kinds persist across save/reload (localStorage + JSON export)
