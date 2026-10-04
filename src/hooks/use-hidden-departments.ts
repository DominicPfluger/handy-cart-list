import { useSyncExternalStore } from "react";

/** Ausgeblendete Abteilungen pro Laden (geräte-lokal). Gilt für den in den Einstellungen gewählten Laden. */
const KEY = "shoppi:hidden-departments";
const STORE_KEY = "shoppi:active-store";
const STORE_EVENT = "shoppi:list-group-order-changed";
const EMPTY: string[] = [];
let cache: Record<string, string[]> | null = null;
let snap: { store: string; ids: string[] } | null = null;
const listeners = new Set<() => void>();

function activeStore(): string {
  try { return localStorage.getItem(STORE_KEY) || "default"; } catch { return "default"; }
}

function readAll(): Record<string, string[]> {
  if (cache) return cache;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (Array.isArray(stored)) cache = { default: stored.filter((id): id is string => typeof id === "string") };
    else cache = stored && typeof stored === "object" ? (stored as Record<string, string[]>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  const store = activeStore();
  const ids = readAll()[store] ?? EMPTY;
  if (!snap || snap.store !== store || snap.ids !== ids) snap = { store, ids };
  return snap.ids;
}

function write(ids: string[], store = activeStore()) {
  cache = { ...readAll(), [store]: ids };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((listener) => listener());
}

export function hideDepartment(id: string, store = activeStore()) {
  const ids = readAll()[store] ?? [];
  if (!ids.includes(id)) write([...ids, id], store);
}

export function restoreDepartment(id: string, store = activeStore()) {
  write((readAll()[store] ?? []).filter((hiddenId) => hiddenId !== id), store);
}

export function useHiddenDepartments(): string[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      const sync = () => { cache = null; listeners.forEach((l) => l()); };
      window.addEventListener("storage", sync);
      window.addEventListener(STORE_EVENT, sync);
      return () => { listeners.delete(listener); window.removeEventListener("storage", sync); window.removeEventListener(STORE_EVENT, sync); };
    },
    read,
    () => EMPTY,
  );
}
