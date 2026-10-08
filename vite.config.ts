// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.png", "apple-touch-icon.png"],
        manifest: {
          name: "Shoppi — Einkaufsliste",
          short_name: "Shoppi",
          description: "Die smarte Einkaufsliste für deinen Alltag. Gemeinsam. Einfach. Einkaufen.",
          lang: "de",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#2E7D32",
          icons: [
            { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          // Katalog-Antworten und Bilder offline verfügbar halten
          runtimeCaching: [
            {
              // Every image (storage photos, recipe images, app artwork) is
              // fetched once from the server, then served from the device.
              // Storage URLs are keyed without their expiring signature.
              // Catalog storage artwork is cached by the app itself (catalog-image-cache).
              urlPattern: ({ request, url }) =>
                !url.pathname.includes("/storage/v1/object/") &&
                (request.destination === "image" ||
                /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(url.pathname)),
              handler: "CacheFirst",
              options: {
                cacheName: "shoppi-static-images",
                cacheableResponse: { statuses: [200] },
                expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true },
              },
            },
            {
              urlPattern: ({ url }) => url.hostname.includes("supabase") && !url.pathname.includes("/storage/v1/object/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "shoppi-api",
                networkTimeoutSeconds: 8,
                expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
              },
            },
          ],
          navigateFallback: "/",
        },
        devOptions: { enabled: false },
      }),
    ],
  },
});
