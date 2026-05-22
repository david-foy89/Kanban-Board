/** Sync docs/ to public/docs/ so Vite serves wireframes in dev and build */
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const source = 'docs';
const target = join('public', 'docs');

if (!existsSync(source)) {
  console.warn('sync-docs: docs/ not found, skipping');
  process.exit(0);
}

cpSync(source, target, { recursive: true });
console.log('sync-docs: copied docs/ to public/docs/');
