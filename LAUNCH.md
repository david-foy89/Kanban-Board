# Kanban Board — how to launch

## Easiest way (Windows)

**Double-click `start-dev.cmd`** in the project folder.

Keep that terminal window open. Your browser should open automatically. If not, use the URL shown in the terminal (usually **http://localhost:5173**).

## Manual way

```bash
cd path\to\Kanban-Board
npm install
npm run dev
```

Use the **exact URL** printed in the terminal. If you see `Port 5173 is in use`, Vite may use **5174** — open that URL instead.

## Do NOT do this

- Do **not** double-click `index.html` — the app will not run (you will only see a spinner or an error message).
- Do **not** guess the port — read it from the terminal.

## Production preview

```bash
npm run build
npm run preview
```

Open **http://localhost:4173** (or the URL shown).

## Still broken?

1. Close all old terminal windows running Vite.
2. Run `npm install` again.
3. Clear saved data: DevTools ? Application ? Local Storage ? delete `kanban-board-state`.
4. Run `npm run dev` and open the new URL from the terminal.
5. Press `Ctrl+Shift+R` for a hard refresh.

If you see a red error box on the page, read the message — it usually means the dev server is not running.
