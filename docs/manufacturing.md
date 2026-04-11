# Manufacturing & Packing

Once your 3D design is complete, you must transform abstract geometry into actionable shop instructions.

![Manufacturing Interface](/images/manufacturing-en.png)

## The Cut List
The **Cut List** computes a flat list of every individual wooden plank required to assemble the furniture.

- **Thickness Deductions**: The algorithm inherently handles intersections (e.g., shelving naturally terminates against side uprights). Dimensions listed here are exact.
- **Grouping**: Identical boards are grouped by quantity.
- **Area Calculation**: See exactly how many square meters of raw material the design consumes to help predict supply costs.
- **Total Dowel Estimation**: Predicts the exact count of wooden dowels required for the whole structural assembly.
- **Exporting**: You can export this view into a highly readable PDF Plan designed to be printed and kept with you in the workshop.

## Panel Cut Plan Optimizer
Instead of trying to manually figure out how to cut your 12 boards out of standard commercial 4x8 MDF sheets, the **Cut Plan Packer** acts as a 2D Bin Packing solver.

### Optimizer Features
- **Blade Kerf (Saw Thickness)**: Input the thickness of your circular saw blade (e.g., 3mm). The packer respects this margin between every single piece!
- **Multiple Panel Stocks**: Buying smaller sheets might sometimes be cheaper than buying large ones. You can input multiple standard sizes available at your local hardware store (e.g., a 2440x1220 sheet for 45€ and a 1220x600 sheet for 15€).
- **Smart Mix Algorithm**: The engine computes combinations of panels and returns the absolute cheapest buying option using combinations of different panels, returning a total cart cost.
- **Orientation Awareness**: The engine attempts smart rotations to maximize fitting density.

*Note: Any pieces that physically cannot fit inside the largest provided panel bounds will be safely excluded and reported in a warning.*
