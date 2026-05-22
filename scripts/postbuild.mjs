/**
 * Copies dist/index.html → dist/404.html for SPA routing on GitHub Pages
 * and other static hosts that serve 404.html on unknown paths.
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'dist';
const indexPath = join(distDir, 'index.html');
const fallbackPath = join(distDir, '404.html');

if (!existsSync(indexPath)) {
  console.error('postbuild: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

copyFileSync(indexPath, fallbackPath);
console.log('postbuild: created dist/404.html for static hosting');

// Skip Jekyll on GitHub Pages (static Vite output only)
writeFileSync(join(distDir, '.nojekyll'), '');
console.log('postbuild: created dist/.nojekyll');
