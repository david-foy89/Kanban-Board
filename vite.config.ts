import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Relative asset paths — works on GitHub Pages, subfolders, and static hosts
  base: './',
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
