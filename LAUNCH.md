# Launch Kanban Board from index.html

`index.html` is the app entry. It **must** be opened through a local web server, not by double-clicking the file.

## Recommended: development

**Double-click `start-dev.cmd`** (Windows)

Or in a terminal:

```bash
npm install
npm run dev
```

Then open exactly:

**http://localhost:5173/index.html**

(`http://localhost:5173/` also works.)

Keep the terminal window open.

## Built app (production index)

**Double-click `open-index-built.cmd`**

Or:

```bash
npm run serve:dist
```

Then open **http://localhost:8080/index.html**

## What does NOT work

| Method | Why |
|--------|-----|
| Double-click `index.html` in Explorer | Browsers block React modules from `file://` |
| VS Code "Live Server" on source folder | Does not compile TypeScript/React |
| Wrong port (e.g. 5174 when server is on 5173) | Old tab or another app |

If you double-click `index.html`, you will now see instructions on the page instead of an endless spinner.

## Troubleshooting

1. Close all old terminal windows running Vite.
2. Run `npm run dev` again.
3. Use the URL printed in the terminal.
4. Clear `kanban-board-state` in DevTools -> Application -> Local Storage if you see an error screen.
5. Hard refresh: `Ctrl+Shift+R`.
