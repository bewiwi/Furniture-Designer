# Documentation VitePress Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Create a complete, user-facing, multilingual VitePress documentation site with automated screenshots deployed via Github Actions.

**Architecture:** A `docs` directory initialized with VitePress, natively running on top of Vite. A GitHub Actions workflow `deploy.yml` compiles and pushes the static output to `gh-pages` automatically. Screenshots are captured by Antigravity's browser_subagent.

**Tech Stack:** VitePress, Markdown, GitHub Actions.

---

### Task 1: Add VitePress Dependency & NPM Scripts

**Files:**
- Modify: `package.json`

**Step 1: Install VitePress locally**
Run: `npm install -D vitepress`
Expected: PASS (generates package-lock.json update)

**Step 2: Add documentation scripts**
```json
// In package.json
"scripts": {
  "docs:dev": "vitepress dev docs",
  "docs:build": "vitepress build docs",
  "docs:preview": "vitepress preview docs"
}
```

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "build: install vitepress and setup scripts"
```

---

### Task 2: Configure VitePress (i18n & Theme)

**Files:**
- Create: `docs/.vitepress/config.js`

**Step 1: Write config**

```javascript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Furniture Designer",
  description: "Parametric 3D furniture designer and cutlist generator",
  base: '/Furniture-Designer/',
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/design' }
        ],
        sidebar: [
          {
            text: 'User Guide',
            items: [
              { text: '1. 3D Design', link: '/design' },
              { text: '2. Manufacturing', link: '/manufacturing' },
              { text: '3. Assembly Tools', link: '/assembly' }
            ]
          }
        ]
      }
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      title: 'Concepteur de Meubles',
      description: 'Conception 3D paramétrique et générateur de plan de découpe',
      themeConfig: {
        nav: [
          { text: 'Accueil', link: '/fr/' },
          { text: 'Guide', link: '/fr/design' }
        ],
        sidebar: [
          {
            text: 'Guide Utilisateur',
            items: [
              { text: '1. Conception 3D', link: '/fr/design' },
              { text: '2. Fabrication', link: '/fr/manufacturing' },
              { text: '3. Outils Numériques', link: '/fr/assembly' }
            ]
          }
        ]
      }
    }
  }
})
```

**Step 2: Commit**
```bash
git add docs/.vitepress/config.js
git commit -m "docs: configure vitepress with english and french locales"
```

---

### Task 3: Create Documentation Structure

**Files:**
- Create: `docs/index.md` & `docs/fr/index.md`
- Create: `docs/design.md` & `docs/fr/design.md`
- Create: `docs/manufacturing.md` & `docs/fr/manufacturing.md`
- Create: `docs/assembly.md` & `docs/fr/assembly.md`
- Create: `docs/public/images/`

**Step 1: Write pages**
Write the base markdown files for both English and French detailing the subdivisions, the cut lists, the cut plans, and the STL printable guides. Include placeholder variables like `![Screenshot](/images/design-en.webp)` for the screenshots.

**Step 2: Commit**
```bash
git add docs/
git commit -m "docs: write comprehensive en/fr markdown documentation"
```

---

### Task 4: Capture Automated Screenshots

**Files:**
- Create: (Screenshots into `docs/public/images/`)

**Step 1: Dispatch browser_subagent**
Using the `browser_subagent` tool, command it to navigate to `http://localhost:5173`.
1. Make it take a screenshot of the main "Design" view for `design-en.png`.
2. Navigate to "Cut-list" and "Cut-plan", and capture `manufacturing-en.png`.
3. Navigate to "Tools" and capture `assembly-en.png`.
4. Switch the UI language to French, and repeat for `-fr.png`.

**Step 2: Move captures to docs repository**
Move the artifacts produced by the subagent into `docs/public/images/`.

**Step 3: Commit**
```bash
git add docs/public/images/
git commit -m "docs: automatically generate and include interface screenshots"
```

---

### Task 5: Configure GitHub Actions Deployment

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Create deploy workflow**
```yaml
name: Deploy Docs

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Build Docs
        run: npm run docs:build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
```

**Step 2: Commit**
```bash
git add .github/workflows/deploy.yml
git commit -m "ci: automate vitepress deployment to gh-pages"
```
