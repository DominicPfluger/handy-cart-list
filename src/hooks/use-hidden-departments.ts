import { useSyncExternalStore } from "react";

const KEY = "shoppi:hidden-departments";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(ids: string[]) {
  cache = ids;
  localStorage.setItem(KEY, JSON.stringify(ids));
  listeners.forEach((listener) => listener());
}

export function hideDepartment(id: string) {
  const ids = read();
  if (!ids.includes(id)) write([...ids, id]);
}

export function restoreDepartment(id: string) {
  write(read().filter((hiddenId) => hiddenId !== id));
}

export function useHiddenDepartments(): string[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      const sync = () => { cache = null; listeners.forEach((l) => l()); };
      window.addEventListener("storage", sync);
      return () => { listeners.delete(listener); window.removeEventListener("storage", sync); };
    },
    read,
    () => EMPTY,
  );
}