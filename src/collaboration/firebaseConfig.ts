import { type FirebaseApp, initializeApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

let app: FirebaseApp | null = null;
let database: Database | null = null;

/** Vite only inlines env vars on static `import.meta.env.VITE_*` access — not dynamic keys. */
function env(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(env(import.meta.env.VITE_FIREBASE_DATABASE_URL));
}

export function getFirebaseDatabase(): Database | null {
  if (!isFirebaseConfigured()) return null;

  if (!database) {
    app = initializeApp({
      apiKey: env(import.meta.env.VITE_FIREBASE_API_KEY),
      authDomain: env(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
      databaseURL: env(import.meta.env.VITE_FIREBASE_DATABASE_URL),
      projectId: env(import.meta.env.VITE_FIREBASE_PROJECT_ID),
      appId: env(import.meta.env.VITE_FIREBASE_APP_ID),
    });
    database = getDatabase(app);
  }

  return database;
}
