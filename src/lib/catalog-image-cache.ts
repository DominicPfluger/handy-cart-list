/** Store catalog artwork by its storage path, not by expiring signed URL. */
const CACHE = "shoppi-catalog-artwork-v1";
const MAX_ENTRIES = 500;
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function key(path: string): string {
  return `${location.origin}/__shoppi-catalog-artwork/${encodeURIComponent(path)}`;
}

export async function cachedCatalogImage(path: string, signedUrl?: string | null): Promise<string> {
  // CacheStorage works on ordinary browser visits as well as installed apps.
  const cache = "caches" in window ? await caches.open(CACHE).catch(() => null) : null;
  if (cache) {
    const hit = await cache.match(key(path));
    if (hit && Date.now() - Number(hit.headers.get("x-shoppi-saved") ?? 0) < MAX_AGE) {
      return URL.createObjectURL(await hit.blob());
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
  return URL.createObjectURL(blob);
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