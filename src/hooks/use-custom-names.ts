import { useSyncExternalStore } from "react";

/** Persönliche Bezeichnungen (nur auf diesem Gerät). Produkte global, Abteilungen pro gewähltem Laden. */
const KEY = "shoppi:custom-names";
const STORE_NAMES_KEY = "shoppi:custom-names-store";
const STORE_KEY = "shoppi:active-store";
const STORE_EVENT = "shoppi:list-group-order-changed";
const EMPTY: Record<string, string> = {};
let cache: Record<string, string> | null = null;
let storeCache: Record<string, Record<string, string>> | null = null;
let merged: { store: string; base: Record<string, string>; scoped: Record<string, string> | undefined; value: Record<string, string> } | null = null;
const listeners = new Set<() => void>();

function activeStore(): string {
  try { return localStorage.getItem(STORE_KEY) || "default"; } catch { return "default"; }
}
function readGlobal(): Record<string, string> {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {}; } catch { cache = {}; }
  return cache!;
}
function readStores(): Record<string, Record<string, string>> {
  if (storeCache) return storeCache;
  try { storeCache = JSON.parse(localStorage.getItem(STORE_NAMES_KEY) ?? "{}") ?? {}; } catch { storeCache = {}; }
  return storeCache!;
}

function read(): Record<string, string> {
  if (typeof window === "undefined") return EMPTY;
  const store = activeStore();
  const base = readGlobal();
  const scoped = readStores()[store];
  if (!merged || merged.store !== store || merged.base !== base || merged.scoped !== scoped) {
    const value = { ...base };
    for (const [id, name] of Object.entries(scoped ?? {})) {
      if (name) value[id] = name; else delete value[id];
    }
    merged = { store, base, scoped, value };
  }
  return merged.value;
}

function notify() { listeners.forEach((l) => l()); }

export function setCustomName(id: string, name: string | null) {
  const next = { ...readGlobal() };
  const trimmed = name?.trim();
  if (trimmed) next[id] = trimmed;
  else delete next[id];
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  notify();
}

/** Abteilungsname nur für den aktuell gewählten Laden. null = Originalname in diesem Laden. */
export function setStoreDepartmentName(id: string, name: string | null, store = activeStore()) {
  const all = { ...readStores() };
  const scoped = { ...(all[store] ?? {}) };
  const trimmed = name?.trim();
  // Leerer String überschreibt einen evtl. älteren globalen Namen.
  if (trimmed) scoped[id] = trimmed;
  else if (readGlobal()[id]) scoped[id] = "";
  else delete scoped[id];
  all[store] = scoped;
  storeCache = all;
  localStorage.setItem(STORE_NAMES_KEY, JSON.stringify(all));
  notify();
}

export function useCustomNames(): Record<string, string> {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const sync = () => { cache = null; storeCache = null; notify(); };
      window.addEventListener(STORE_EVENT, sync);
      window.addEventListener("storage", sync);
      return () => { listeners.delete(cb); window.removeEventListener(STORE_EVENT, sync); window.removeEventListener("storage", sync); };
    },
    read,
    () => EMPTY,
  );
}
