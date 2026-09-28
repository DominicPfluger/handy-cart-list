import { useSyncExternalStore } from "react";

/** Persönliche Bezeichnungen für Katalog-Einträge und Kategorien (nur auf diesem Gerät). */
const KEY = "shoppi:custom-names";
const EMPTY: Record<string, string> = {};
let cache: Record<string, string> | null = null;
const listeners = new Set<() => void>();

function read(): Record<string, string> {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {};
  } catch {
    cache = {};
  }
  return cache!;
}

export function setCustomName(id: string, name: string | null) {
  const next = { ...read() };
  const trimmed = name?.trim();
  if (trimmed) next[id] = trimmed;
  else delete next[id];
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useCustomNames(): Record<string, string> {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}
