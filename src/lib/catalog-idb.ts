// Offline-Katalog in IndexedDB (statt localStorage: kein 5-MB-Limit, kein Blockieren beim Parsen).
// Ein Speicher-Spiegel erlaubt synchrones Lesen, sobald `catalogCacheReady` erfüllt ist.
const DB = "shoppi-catalog";
const STORE = "kv";
const mirror = new Map<string, unknown>();

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
const db = () => (dbPromise ??= open());

async function init() {
  if (typeof indexedDB === "undefined") return;
  try {
    const d = await db();
    await new Promise<void>((resolve) => {
      const tx = d.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const c = req.result;
        if (!c) return resolve();
        mirror.set(String(c.key), c.value);
        c.continue();
      };
      req.onerror = () => resolve();
    });
    // Einmalige Übernahme alter localStorage-Einträge
    const old: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("shoppi:catalog-core-") || k?.startsWith("shoppi:catalog-details-")) old.push(k);
    }
    for (const k of old) {
      try {
        if (!mirror.has(k)) idbSet(k, JSON.parse(localStorage.getItem(k) ?? "null"));
      } catch { /* defekt: verwerfen */ }
      localStorage.removeItem(k);
    }
  } catch { /* IndexedDB nicht verfügbar (z. B. privater Modus) */ }
}

export const catalogCacheReady: Promise<void> = typeof window === "undefined" ? Promise.resolve() : init();

export function idbGet<T>(key: string): T | undefined {
  return mirror.get(key) as T | undefined;
}

export function idbKeys(): string[] {
  return [...mirror.keys()];
}

export function idbSet(key: string, value: unknown) {
  mirror.set(key, value);
  if (typeof indexedDB === "undefined") return;
  db().then((d) => {
    const tx = d.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
  }).catch(() => {});
}
