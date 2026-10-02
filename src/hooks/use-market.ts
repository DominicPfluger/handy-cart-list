import { useSyncExternalStore } from "react";
import { getLocale } from "@/i18n";

const KEY = "shoppi:market";
const listeners = new Set<() => void>();

function read(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v && /^[A-Z]{2}$/.test(v) ? v : null;
  } catch {
    return null;
  }
}

/** Gerätelokalen Markt speichern (null = automatisch aus der Sprache). */
export function setMarketOverride(code: string | null) {
  try {
    if (code) localStorage.setItem(KEY, code);
    else localStorage.removeItem(KEY);
  } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

/** Gerätelokal: voreingestellter Markt oder null (= automatisch). */
export function useMarketOverride(): string | null {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    read,
    () => null,
  );
}

function localeMarket(): string {
  return getLocale().split("-")[1] ?? "DE";
}

/** Effektiver Markt: Voreinstellung, sonst aus der Sprache abgeleitet. */
export function currentMarket(): string {
  return read() ?? localeMarket();
}

/** Reaktive Variante von currentMarket() für Hooks/Queries. */
export function useMarket(): string {
  const override = useMarketOverride();
  return override ?? localeMarket();
}
