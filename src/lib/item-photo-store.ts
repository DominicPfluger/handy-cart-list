// ============= Fotos pro Listeneintrag: gerätelokal in IndexedDB (kein Cloud-Upload) =============
// Fotos werden pro lokalem Eintrags-ID gespeichert; geteilte Listen sehen nur den Texteintrag.

const DB_NAME = "shoppi-list-photos";
const STORE = "photos";
const MAX_EDGE = 1280;
const MAX_BYTES = 200 * 1024;

interface PhotoRecord {
  id: string;
  blob: Blob;
  at: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getItemPhoto(id: string): Promise<Blob | undefined> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result ? (req.result as PhotoRecord).blob : undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function putItemPhoto(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put({ id, blob, at: Date.now() } satisfies PhotoRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function deleteItemPhoto(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export async function deleteItemPhotos(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const id of ids) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

/** Skaliert ein Foto auf max. 1280px Kante und komprimiert als WebP auf ≤ 200 KB. */
export async function prepareItemPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let edge = Math.min(MAX_EDGE, Math.max(bitmap.width, bitmap.height));
  let quality = 0.8;
  let blob = await encode(bitmap, edge, quality);
  while (blob.size > MAX_BYTES && quality > 0.45) {
    quality -= 0.15;
    blob = await encode(bitmap, edge, quality);
  }
  while (blob.size > MAX_BYTES && edge > 480) {
    edge = Math.round(edge * 0.7);
    quality = 0.8;
    blob = await encode(bitmap, edge, quality);
  }
  bitmap.close();
  return blob;
}

async function encode(bitmap: ImageBitmap, edge: number, quality: number): Promise<Blob> {
  const scale = edge / Math.max(bitmap.width, bitmap.height);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nicht verfügbar");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Bild konnte nicht konvertiert werden");
  return blob;
}
