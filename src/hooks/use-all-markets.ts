import { useSyncExternalStore } from "react";

const KEY = "shoppi:all-markets";
const listeners = new Set<() => void>();

function read(): boolean {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

export function setAllMarkets(v: boolean) {
  localStorage.setItem(KEY, v ? "1" : "0");
  listeners.forEach((l) => l());
}

/** Gerätelokal: ganzen Katalog aller Märkte anzeigen. */
export function useAllMarkets(): boolean {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    read,
    () => false,
  );
}
