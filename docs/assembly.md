# Assembly & Digital Tools

A furniture piece requires robust joinery. This software embraces blind wooden dowel joinery (tourillons) by mathematically pinpointing where intersecting boards meet.

![Assembly Tools Interface](/images/assembly-en.png)

## Dowel Hole Placement
Dowel positions are calculated automatically when two boards intersect (e.g., a horizontal shelf meeting a vertical upright pane).

You can globally define:
*   **Dowel Diameter**: Generally 8mm standard.
*   **Dowel Length**: The total physical length of the dowel. The software correctly calculates insertion depths for both the edge bore and face bore.
*   **Edge Margin**: The minimum safety distance from the outer corner to the first hole.
*   **Spacing**: The optimal gap between consecutive holes along a long join.

## 3D Printable Assembly Jigs
Achieving perfectly perpendicular alignment manually is famously difficult. The software eliminates measuring errors by procedurally generating **3D Printable Jigs** customized to your exact material thickness.

### 1. The Edge Guide (Guide de Chant)
A U-channel block designed to rest over the edge of a board. It features a pilot hole perfectly centered to guarantee your drill bit enters the end-grain straight.

### 2. The Face Guide (Guide Équerre)
An L-shaped right-angle piece designed to hook onto the face of the board. The pilot hole is offset precisely so the dowels perfectly mate with the edge-drilled board without misalignment.

### File Exports
- **STL**: Download these jigs and slice them in Cura or PrusaSlicer. They print without supports in around 45 minutes.
- **DXF**: For users operating CNC routers, you can dump the entire flat-cut geometry as layered 2D DXF profiles.
