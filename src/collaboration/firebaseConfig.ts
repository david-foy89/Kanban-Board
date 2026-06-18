import { type FirebaseApp, initializeApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

let app: FirebaseApp | null = null;
let database: Database | null = null;

function readEnv(key: string): string | undefined {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(readEnv('VITE_FIREBASE_DATABASE_URL'));
}

export function getFirebaseDatabase(): Database | null {
  if (!isFirebaseConfigured()) return null;

  if (!database) {
    app = initializeApp({
      apiKey: readEnv('VITE_FIREBASE_API_KEY'),
      authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
      databaseURL: readEnv('VITE_FIREBASE_DATABASE_URL'),
      projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
      appId: readEnv('VITE_FIREBASE_APP_ID'),
    });
    database = getDatabase(app);
  }

  return database;
}
