/** Store catalog artwork by its storage path, not by expiring signed URL. */
const CACHE = "shoppi-catalog-artwork-v2";
const MAX_ENTRIES = 2000;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const pending = new Map<string, Promise<Blob>>();

function key(path: string): string {
  return `${location.origin}/__shoppi-catalog-artwork/${encodeURIComponent(path)}`;
}

async function loadBlob(path: string, signedUrl?: string | null): Promise<Blob> {
  // CacheStorage works on ordinary browser visits as well as installed apps.
  const cache = "caches" in window ? await caches.open(CACHE).catch(() => null) : null;
  if (cache) {
    const hit = await cache.match(key(path));
    if (hit && Date.now() - Number(hit.headers.get("x-shoppi-saved") ?? 0) < MAX_AGE) {
      const b = await hit.blob();
      if (b.size > 0 && b.type.startsWith("image/")) return b;
      await cache.delete(key(path)).catch(() => {});
    }
  }
  if (!signedUrl) throw new Error("Image has not been cached yet");
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error(`Catalog image ${response.status}`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Invalid catalog image");
  if (cache) {
    try {
      await cache.put(key(path), new Response(blob, {
        headers: { "content-type": blob.type, "x-shoppi-saved": String(Date.now()) },
      }));
      const keys = await cache.keys();
      for (const old of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) await cache.delete(old);
    } catch { /* Private mode or storage quota: still show the image. */ }
  }
  return blob;
}

let oldCleared = false;
async function fetchFreshUrl(path: string): Promise<string | null> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.storage.from("catalog-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function cachedCatalogImage(path: string, signedUrl?: string | null): Promise<string> {
  if (!oldCleared && "caches" in window) { oldCleared = true; void caches.delete("shoppi-catalog-artwork-v1").catch(() => {}); }
  let task = pending.get(path);
  if (!task) {
    // Expired signed links fail after an hour; retry once with a fresh link.
    task = loadBlob(path, signedUrl).catch(async () => loadBlob(path, await fetchFreshUrl(path)));
    pending.set(path, task);
    void task.finally(() => { if (pending.get(path) === task) pending.delete(path); }).catch(() => {});
  }
  return URL.createObjectURL(await task);
}

export async function forgetCatalogImage(path: string): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  const cache = await caches.open(CACHE).catch(() => null);
  await cache?.delete(key(path));
  // Workbox can hold larger versions under a URL with the same storage path.
  const old = await caches.open("shoppi-catalog-images").catch(() => null);
  if (old) for (const request of await old.keys()) {
    if (new URL(request.url).pathname.endsWith(`/catalog-images/${path}`)) await old.delete(request);
  }
}
/** Lädt alle Katalogbilder im Hintergrund aufs Gerät (bereits gespeicherte werden übersprungen). */
export type PreloadState = { running: boolean; done: number; total: number; failed: number };
let preload: PreloadState = { running: false, done: 0, total: 0, failed: 0 };
const listeners = new Set<() => void>();
const emit = (next: Partial<PreloadState>) => { preload = { ...preload, ...next }; listeners.forEach((l) => l()); };
export const preloadState = () => preload;
export function subscribePreload(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

export async function preloadCatalogImages(urls: Record<string, string>): Promise<void> {
  if (preload.running) return;
  const paths = Object.keys(urls);
  emit({ running: true, done: 0, total: paths.length, failed: 0 });
  let i = 0, done = 0, failed = 0;
  const worker = async () => {
    while (i < paths.length) {
      const path = paths[i++]!;
      try { const t = pending.get(path) ?? loadBlob(path, urls[path]); await t; } catch { failed++; }
      done++;
      emit({ done, failed });
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  emit({ running: false });
}
