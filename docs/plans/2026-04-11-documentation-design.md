# Documentation & GH-Pages Deployment Design

## 1. Overview
The goal is to create a complete, user-facing, multilingual documentation site for the Furniture Designer project. This documentation will explain all application features using text and screenshots, and will be automatically built and deployed to GitHub Pages (`gh-pages`).

## 2. Technology Stack
- **Generator**: **VitePress**. It aligns naturally with our existing Vite application, produces blazingly fast static sites, and supports high-quality default UI elements (search, dark/light mode, sidebar).
- **Automation**: GitHub Actions to compile the Markdown into HTML and deploy it smoothly to the `gh-pages` branch without cluttering the `main` branch.
- **Media Capture**: The Antigravity `browser_subagent` will be utilized to pilot the local application instance and capture up-to-date screenshots (representing accurate app state for different languages).

## 3. Multilingual Structure (i18n)
Based on the application's supported languages:
- **English (EN)** will be the default language, accessible at the root `/`.
- **Français (FR)** will be located in the `/fr/` sub-path.
VitePress's native i18n configuration will be used to provide a language switcher in the navigation bar.

## 4. Pages Hierarchy
Both English and French directories will contain the following structure:
1. `index.md` - Landing page with hero banner and quick start links.
2. `design.md` - Core 3D designer documentation (subdivisions, resizing, locks, compartment creation).
3. `manufacturing.md` - Cutlist and packing documentation (Cut List, Cut Plan).
4. `assembly.md` - Printable guides documentation (Edge guide, Face guide, STL/DXF downloads).

## 5. Deployment Flow
1. Code committed to `main` -> Triggers Github Action.
2. Job setups Node, runs `npm run docs:build`.
3. Uploads `docs/.vitepress/dist` to Github Pages.
4. GH-Pages serves the customized static site.
