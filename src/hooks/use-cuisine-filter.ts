import { useSyncExternalStore } from "react";

/** Gewählte Länderküchen (IDs) für die Abteilungsansicht (nur auf diesem Gerät). */
const KEY = "shoppi:cuisine-filter";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache!;
}

export function setCuisines(next: string[]) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function toggleCuisine(id: string) {
  const cur = read();
  setCuisines(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
}

export function useCuisineFilter(): string[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    read,
    () => EMPTY,
  );
}
