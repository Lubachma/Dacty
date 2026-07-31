import { db } from './db';

/** Vérifie qu'IndexedDB est réellement utilisable (false en navigation privée bloquée). */
export async function checkPersistence(): Promise<boolean> {
  try {
    await db.profile.limit(1).toArray();
    return true;
  } catch {
    return false;
  }
}
