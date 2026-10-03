import { useSyncExternalStore } from "react";

/** Eigene Varianten gehören nur zu diesem Gerät, nicht zum gemeinsamen Produktkatalog. */
const KEY = "shoppi:personal-variants";
const EMPTY: Record<string, string[]> = {};
let cache: Record<string, string[]> | null = null;
const listeners = new Set<() => void>();

function read(): Record<string, string[]> {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    cache = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? Object.fromEntries(Object.entries(parsed).map(([id, names]) => [id, Array.isArray(names) ? names.filter((v): v is string => typeof v === "string") : []]))
      : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Record<string, string[]>) {
  localStorage.setItem(KEY, JSON.stringify(next));
  cache = next;
  listeners.forEach((listener) => listener());
}

export function usePersonalVariants() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    read,
    () => EMPTY,
  );
}

export function addPersonalVariant(productId: string, name: string, existing: string[]): boolean {
  const trimmed = name.trim();
  if (!trimmed || [...existing, ...(read()[productId] ?? [])].some((v) => v.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase())) return false;
  const current = read();
  write({ ...current, [productId]: [...(current[productId] ?? []), trimmed] });
  return true;
}

export function removePersonalVariant(productId: string, name: string) {
  const current = read();
  const next = { ...current };
  next[productId] = (next[productId] ?? []).filter((v) => v !== name);
  if (next[productId].length === 0) delete next[productId];
  write(next);
}