import { useSyncExternalStore } from "react";

export type IconSet = "images" | "symbols";
const KEY = "shoppi:icon-set";
const listeners = new Set<() => void>();

function read(): IconSet {
  if (typeof window === "undefined") return "images";
  try { return localStorage.getItem(KEY) === "symbols" ? "symbols" : "images"; }
  catch { return "images"; }
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

export function setIconSet(value: IconSet) {
  try { localStorage.setItem(KEY, value); } catch { /* browsing without storage */ }
  notify();
}

/** Local visual preference shared by every small catalog/list icon. */
export function useIconSet(): IconSet {
  return useSyncExternalStore(subscribe, read, () => "images");
}