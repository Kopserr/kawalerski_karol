const DB_NAME = "lfd-offline";
const DB_VERSION = 1;
export const STORE_NAME = "pending-uploads";

/** Minimal raw-IndexedDB wrapper — a full library is overkill for one
 * object store. Resolves to null on any browser that doesn't support it
 * (SSR, ancient browsers); callers treat that as "queueing unavailable". */
export function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
