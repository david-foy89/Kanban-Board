import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Actions sets VITE_BASE_PATH=/RepoName/ for project pages
const base = process.env.VITE_BASE_PATH ?? './';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    open: '/index.html',
  },
  appType: 'spa',
  preview: {
    port: 4173,
    open: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
