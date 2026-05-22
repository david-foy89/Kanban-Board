# Kanban Board

Portfolio-grade interactive Kanban board built with React, TypeScript, Tailwind CSS, Zustand, and [@hello-pangea/dnd](https://github.com/hello-pangea/dnd).

## Features

- Drag-and-drop tasks between columns
- Add, edit, and delete tasks with priority badges
- Add and delete columns (at least one column always remains)
- Persistent state via `localStorage`
- Accessible focus states and keyboard-friendly controls

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

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
| **GitHub Pages** | Upload `dist/` contents, or use Actions with `publish_dir: dist` |
| **Any web server** | Copy `dist/` to `public_html` / `www` |

`public/_redirects` (Netlify) and `public/.nojekyll` (GitHub Pages) are included automatically in the build.

For a **project site** at `https://user.github.io/repo-name/`, set in `vite.config.ts`:

```ts
base: '/repo-name/',
```

then rebuild.

## Project structure

```
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
