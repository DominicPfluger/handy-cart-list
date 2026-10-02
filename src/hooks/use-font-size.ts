import { useSyncExternalStore } from "react";

export type FontSize = "small" | "normal" | "large";
const KEY = "shoppi:font-size";
/** Root font-size — Tailwind rem sizes scale with it. */
const PX: Record<FontSize, string> = { small: "14px", normal: "16px", large: "18px" };
const listeners = new Set<() => void>();

function readRaw(): FontSize {
  if (typeof window === "undefined") return "normal";
  try {
    const v = localStorage.getItem(KEY);
    return v === "small" || v === "large" ? v : "normal";
  } catch { return "normal"; }
}

function apply(value: FontSize) {
  if (typeof document === "undefined") return;
  document.documentElement.style.fontSize = PX[value];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", notify);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", notify);
  };
}

function notify() { listeners.forEach((listener) => listener()); }

export function setFontSize(value: FontSize) {
  try { localStorage.setItem(KEY, value); } catch { /* browsing without storage */ }
  apply(value);
  notify();
}

/** Applies the saved preference once at app start. */
export function initFontSize() { apply(readRaw()); }

/** Device-local text size preference ("Mehr" settings). */
export function useFontSize(): FontSize {
  return useSyncExternalStore(subscribe, readRaw, () => "normal");
}
