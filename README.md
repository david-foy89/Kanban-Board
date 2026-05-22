# Kanban Board

Portfolio-grade interactive Kanban board built with React, TypeScript, Tailwind CSS, Zustand, and [@hello-pangea/dnd](https://github.com/hello-pangea/dnd).

## Features

- Drag-and-drop tasks between columns
- Add, edit, and delete tasks with priority badges
- Add and delete columns (at least one column always remains)
- **Browser local storage** - every task/column change saves automatically to `localStorage` (key: `kanban-board-state`)
- Accessible focus states and keyboard-friendly controls

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> **Important:** Run `npm run dev` and use the URL above. Do not open `index.html` directly in the browser (file://) - the app needs the Vite dev server or a production build in `dist/`.

## Scripts

| Command        | Description          |
| -------------- | -------------------- |
| `npm run dev`  | Start dev server     |
| `npm run build`| Production build     |
| `npm run preview` | Preview production build |

## Deploy live (static hosting)

The site is a static SPA. Build once, then upload the **`dist/`** folder to any static host.

```bash
npm run build
```

This produces:

- `dist/index.html` — entry page (with loading shell and meta tags)
- `dist/404.html` — same file for GitHub Pages SPA routing
- `dist/assets/` — bundled JS and CSS
- `dist/docs/` — wireframes gallery (HTML + SVG)

### Preview locally before deploy

```bash
npm run preview
```

Open the URL shown (usually http://localhost:4173).

### Hosting options

| Host | What to deploy |
|------|----------------|
| **Netlify / Cloudflare Pages** | Connect repo or drag-drop `dist/` |
| **Vercel** | Root directory: project root; build: `npm run build`; output: `dist` |
| **GitHub Pages** | Use the included GitHub Actions workflow (see below) |
| **Any web server** | Copy `dist/` to `public_html` / `www` |

`public/_redirects` (Netlify) and `dist/.nojekyll` (GitHub Pages) are included automatically in the build.

### GitHub Pages (fix Jekyll build errors)

This repo is a **Vite/React app**, not a Jekyll site. Do **not** use "Deploy from a branch" with Jekyll on the repository root.

1. Push these changes to `main`.
2. On GitHub: **Settings** -> **Pages** -> **Build and deployment**
3. Set **Source** to **GitHub Actions** (not "Deploy from a branch").
4. The workflow `.github/workflows/deploy-pages.yml` builds `dist/` and deploys it.
5. Your site will be at `https://<username>.github.io/<repo-name>/` (includes `index.html`).

The CI build sets `VITE_BASE_PATH` automatically for your repository name.

## Wireframes

UI wireframes (SVG) document layout, flows, and component architecture:

| Wireframe | File |
|-----------|------|
| Desktop board | `docs/wireframes/desktop-board.svg` |
| Mobile board | `docs/wireframes/mobile-board.svg` |
| Task card & edit | `docs/wireframes/task-card.svg` |
| Add task flow | `docs/wireframes/add-task-flow.svg` |
| Component tree | `docs/wireframes/architecture.svg` |

**Browse all:** open [`docs/wireframes.html`](docs/wireframes.html) in a browser (also copied to `dist/docs/` on build). The live app header includes a **Wireframes** link after deploy.

## Project structure

```
docs/
├── wireframes.html
└── wireframes/          # SVG wireframes
src/
├── components/
│   ├── Board.tsx
│   ├── Column.tsx
│   ├── TaskCard.tsx
│   ├── NewColumnInput.tsx
│   ├── TaskForm.tsx
│   └── EmptyColumnState.tsx
├── store/
│   └── kanbanStore.ts
├── types/
│   └── kanban.ts
├── utils/
│   └── priority.ts
├── App.tsx
├── main.tsx
└── index.css
```
