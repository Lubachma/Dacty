import { db } from './db';

/** Checks that IndexedDB is actually usable (false when blocked in private browsing). */
export async function checkPersistence(): Promise<boolean> {
  try {
    await db.profile.limit(1).toArray();
    return true;
  } catch {
    return false;
  }
}

/**
 * Requests persistent storage: without it, the browser may evict
 * IndexedDB under pressure, and Safari (ITP) purges it after ~7 days of inactivity.
 */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    // denied or API unavailable: harmless
  }
}
