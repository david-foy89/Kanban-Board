import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initBoardPersistence } from './store/kanbanStore.ts';
import './index.css';

function showFatalError(message: string) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="max-width:32rem;margin:2rem auto;padding:1.5rem;border:1px solid #7f1d1d;border-radius:0.75rem;background:#18181b;color:#fecaca;font-family:system-ui,sans-serif;font-size:0.9rem;line-height:1.6">
      <strong style="color:#fafafa;display:block;margin-bottom:0.5rem">Kanban failed to start</strong>
      <pre style="margin:0;white-space:pre-wrap;word-break:break-word;color:#fca5a5">${message}</pre>
      <p style="margin:1rem 0 0;color:#a1a1aa;font-size:0.85rem">Run <code style="color:#c4b5fd">npm run dev</code> and open the localhost URL from the terminal.</p>
    </div>
  `;
}

window.addEventListener('error', (event) => {
  console.error('[Kanban]', event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Kanban] Unhandled promise rejection:', event.reason);
});

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Root element #root not found. Check index.html.');
}

try {
  initBoardPersistence();

  createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  showFatalError(message);
}
