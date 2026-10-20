import { useSyncExternalStore } from "react";

const unavailable = new Set<string>();
const listeners = new Set<() => void>();

export function setCatalogUnavailable(locale: string, value: boolean) {
  if (unavailable.has(locale) === value) return;
  if (value) unavailable.add(locale);
  else unavailable.delete(locale);
  listeners.forEach((listener) => listener());
}

export function useCatalogUnavailable(locale: string) {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => unavailable.has(locale),
    () => false,
  );
}