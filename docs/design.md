# 3D Design & Modeling

The **Furniture Designer** centers around a recursive space-partitioning design paradigm. Instead of drawing individual boards on a canvas, you define functional volumes, and the algorithmic geometry solves the board intersections and thicknesses itself. This ensures your furniture remains mathematically perfect and physically structurally viable at all times.

![Design Interface](/images/design-en.png)

## Global Constraints
Your design starts by defining the absolute maximum bounds of the cabinet:
*   **Outer Dimensions**: The total outer bounding box width, height, and depth.
*   **Material Thickness**: Wood thickness applied uniformly across all boards. Change it, and all inner compartments dynamically recalculate to compensate.

## Creating Compartments
By selecting any 3D node (either clicking on the 3D model directly, or selecting it via the left-hand hierarchy tree), you can split the space sequentially:
- **Rows (Horizontal Dividers)**: Slices the available vertical space.
- **Columns (Vertical Dividers)**: Slices the available horizontal space.

You can nest columns inside rows inside columns infinitely.

## Advanced Dimension Controls
When a node is subdivided, the inner space is divided by the separating planks. By default, the remaining space is distributed evenly.
- **Locking Absolute Dimensions 🔒**: You can lock the dimension of any compartment (in millimeters) to ensure it does not resize dynamically. This is crucial when designing a niche for an amplifier that must be exactly 430mm wide.
- **Equalize Sizes ⚖**: If you have added or removed a compartment, hit "Equalize" to fairly redistribute all remaining unlocked space among your compartments instantly.
- **Resize Stealing**: If you manually resize an unlocked compartment, the software automatically "steals" space from its closest unlocked neighbor, ensuring the outer dimensions of your furniture never break.

## Overlays & Reference Objects
The UI provides powerful overlay tools:
- **Quotes**: Toggle absolute measurements on the 3D view.
- **Locks**: Visually highlights which compartments have rigid dimensions.
- **Objects**: Spawn scaled 3D reference objects into your compartments (e.g., a **55" TV**, an **Xbox Series X**, a **Vinyl Record Turntable**, or an **IKEA Kallax Basket**). These mockups assure you that your stuff will actually fit!
