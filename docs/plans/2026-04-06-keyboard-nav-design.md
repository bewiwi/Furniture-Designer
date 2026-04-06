# Keyboard Navigation & Help Modal Design

## Overview
Speed up structural navigation natively using arrow keys and introduce a visually clean modal to list all active shortcuts.

## 1. Keyboard Navigation Logic
Location: `src/main.js` `handleKeyboard`

- **ArrowUp**: Climb up the DOM representation by accessing `getNodePath()`. Stop safely at `root`.
- **ArrowDown**: Dives into the `children[0]` of the currently selected subdivided node. Does nothing if leaf.
- **ArrowLeft / ArrowRight**: Siblings iteration. Finds parent via `getNodePath()`, identifies current child index. Selects `index - 1` (Left) or `index + 1` (Right) clamping to bounds.

## 2. Help Modal Component
Location: `src/ui/help-modal.js` (NEW) and `src/ui/toolbar.js`

- A new UI component `help-modal.js` that abstracts the mounting of a floating `<dialog>` or `.modal-overlay` containing a HTML table of shortcuts.
- `toolbar.js` exposes a new button `[?] Aide` on the right-hand corner.
- Toggling the button injects/displays the modal. Clicking the backdrop or `Escape` closes the modal.
