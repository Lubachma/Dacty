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

/**
 * Demande le stockage persistant : sans lui, le navigateur peut évacuer
 * IndexedDB sous pression, et Safari (ITP) le purge après ~7 jours d'inactivité.
 */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    // refus ou API indisponible : sans conséquence
  }
}
