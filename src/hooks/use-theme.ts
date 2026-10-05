import { useCallback, useSyncExternalStore } from "react";

// ============= Darstellung: System / Hell / Dunkel =============
// Gerätespeicher in shoppi:theme; „System" folgt der Systemeinstellung live.
export type Theme = "system" | "light" | "dark";

const KEY = "shoppi:theme";
const EVENT = "shoppi:theme-changed";
const DARK_META = "#141A17";
const LIGHT_META = "#2E7D32";

export function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? DARK_META : LIGHT_META);
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* Geräte-Speicher nicht verfügbar */
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => applyTheme(readTheme());
  media.addEventListener("change", onMedia);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
    media.removeEventListener("change", onMedia);
  };
}

/** Initialisierung beim App-Start (in __root.tsx neben Sprache/Schriftgrösse). */
export function initTheme() {
  applyTheme(readTheme());
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const theme = useSyncExternalStore(
    subscribe,
    () => readTheme(),
    () => "system" as Theme,
  );
  const set = useCallback((t: Theme) => setTheme(t), []);
  return { theme, setTheme: set };
}
