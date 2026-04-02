# 3D Printable Tools Design

## Overview
Two universal, parametric 3D printable tools to assist in drilling dowel holes for furniture assembly. The tools will act as physical guides to ensure holes are drilled straight (90°) and at the correct position (centered on thickness).

## Requirements

### Tool 1: Edge Drilling Guide
A U-channel block that slides over the board's edge.
- **Function:** Centers the drill on the edge grain and keeps it perpendicular.
- **Dimensions:** 
  - Channel width: `thickness` + 0.4mm (tolerance)
  - Wall thickness: 4mm
  - Block length: 60mm
  - Total block height: 30mm (20mm channel depth + 10mm top cap)
  - Hole: Through-hole matching `dowelConfig.diameter`.

### Tool 2: Face Drilling Guide (Équerre)
An L-shaped piece that registers against the board edge.
- **Function:** Distances the drill exactly `thickness / 2` from the edge so face holes align with edge holes from adjoining boards.
- **Dimensions:**
  - Vertical arm: 30mm tall, 5mm thick, 60mm wide
  - Horizontal arm: 40mm long, 10mm thick, 60mm wide
  - Hole: Through-hole matching `dowelConfig.diameter` positioned at `thickness / 2` from the inner corner.

## UI Requirements
A new "Tools" tab located alongside "Design" and "Cut List".
- Contains cards for each tool showing an SVG cross-section diagram with dimensions.
- Explains the usage.
- Shows dynamic parameters derived from the current furniture configuration.
- Integrates a lightweight 3D viewer (reusing `@jscad/regl-renderer`) to preview the exact solid geometry.
- Provides a "Download STL" button for each tool.

## Architecture & Reusability
- The geometries will be constructed using `@jscad/modeling` operations (`cuboid`, `cylinder`, `subtract`, `translate`).
- The viewer logic will exist in a dedicated file (`src/tool-viewer.js`) that does not include the complex picking logic from the main viewer.
- The tools logic (`src/tools.js`) will expose functions to generate the `solid` shapes and strings for SVG descriptions.
- Test coverage will be added in `src/tools.test.js` to assert proper geometry logic.
