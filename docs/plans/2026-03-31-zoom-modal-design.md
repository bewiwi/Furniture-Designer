# Zoom Modal View for Cut List Planks

## Description
The Furniture Designer cut list provides highly detailed SVG technical drawings of individual planks. For very large planks (e.g., side panels >2000mm), the fixed `<svg viewBox>` proportionally scales down all annotations, hole markers, and quotes, making them incredibly difficult to read in a workshop setting. 

This design implements a Full-Screen Modal Viewer that intercepts clicks on a drawing, duplicates it into an immersive view covering the UI, and enables standard panning and zooming interaction.

## UI / UX Design
1. **Trigger:** Every `.card-viz` (the SVG container) in the "Cut List" tab will use `cursor: zoom-in` to afford interactivity. Clicking will launch the overlay.
2. **Overlay:** A `#zoom-modal` container layered over the entire screen (`z-index: 1000`, `background: rgba(0,0,0,0.8)`). 
3. **Controls:** Floating buttons in the modal (e.g. `+`, `-`, `Reset`, and `✕ Close`) for manual, precise control.
4. **Mouse/Scroll Interaction:** 
    * `wheel`: Scrolling the mouse wheel zooms in and out.
    * `mousedown` -> `mousemove`: Click-and-drag pans the drawing.
    * `dblclick`: Auto-resets back to zoom level 1, translation 0,0.
5. **Keyboard Support:** Pressing the `Escape` key closes the modal.
6. **Responsive/Touch:** Basic pointer events fallback for mobile/tablet workshop use (panning). 

## Architecture & Implementation
*   **Logic Isolation:** We will create `src/ui/zoom-modal.js` containing `initZoomModal()` and `openZoomModal(svgHtml)`. 
*   **Initialization:** In `main.js`, after initializing the tab views, we call `initZoomModal()` which injects the empty HTML skeleton for the modal directly into `document.body` and binds global listeners (like `Escape` keydown).
*   **HTML:** The overlay will contain a generic `.zoom-portal` div. 
*   **CSS Transform Matrix:** We will maintain three values in `src/ui/zoom-modal.js`:
    ```javascript
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    ```
    On interaction events, we'll request a style rewrite on the cloned SVG element:
    ```javascript
    svgElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    ```
*   **Event Delegation:** `cutlist-view.js` will bind a click listener to the `full-cutlist-grid` (or individual `.card-viz` divs). Upon a click, it grabs the innerHTML of the target `.card-viz` and passes it to `openZoomModal(html)`.
*   **No External Dependencies:** By managing state locally with standard pointer events and wheel events, we avoid bloat and keep the source code small.

## Success Criteria
*   Users can easily launch the modal from the cut list.
*   Once open, they can scroll to "zoom" deeply into tiny hardware markers on large planks.
*   The modal closes easily when work is complete.
*   Panning does not jitter or jump erratically.
