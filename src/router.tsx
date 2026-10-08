import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { SplashScreen } from "./components/splash-screen";

function PendingScreen() {
  return <SplashScreen />;
}

// Nach einem App-Update können alte Modul-Adressen fehlen → einmalig neu laden statt leerer Seite.
const RELOAD_KEY = "shoppi:chunk-reload";
function isChunkError(msg: string) {
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i.test(msg);
}
function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch { /* ignore */ }
  window.location.reload();
}
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); reloadOnce(); });
  window.addEventListener("unhandledrejection", (e) => { if (isChunkError(String((e.reason as Error)?.message ?? e.reason))) reloadOnce(); });
  window.addEventListener("error", (e) => { if (isChunkError(String(e.message))) reloadOnce(); });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PendingScreen,
  });

  return router;
};
