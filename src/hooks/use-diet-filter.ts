import { useSyncExternalStore } from "react";
import { getLocale, translate, swissify } from "../i18n";
import type { MessageKey } from "../i18n/de";

/** Eingebaute Ernährungsformen (Fallback, falls die Datenbank nicht erreichbar ist). */
export const BUILTIN_DIETS = [
  "halal", "kosher", "vegetarian", "vegan", "gluten_free", "lactose_free", "fructose_free", "sugar_free",
  "keto", "paleo", "low_carb", "low_fat", "high_protein", "low_calorie", "clean_eating",
] as const;
export type Diet = string;
export type DietLabels = Record<string, string>;
export type DietRow = { id: string; emoji: string | null; sort_order: number; enabled: boolean; builtin: boolean; labels: DietLabels };

const BUILTIN_EMOJI: Record<string, string> = {
  kosher: "✡️", halal: "☪️", vegetarian: "🥕", vegan: "🌱", gluten_free: "🌾", lactose_free: "🥛",
  fructose_free: "🍎", sugar_free: "🍬", keto: "🥑", paleo: "🍖", low_carb: "🍚", low_fat: "🥒",
  high_protein: "🥩", low_calorie: "⚖️", clean_eating: "🥗",
};

// ---- Store: vom Admin verwaltete Ernährungsformen ----
let rows: DietRow[] = BUILTIN_DIETS.map((id, i) => ({ id, emoji: BUILTIN_EMOJI[id] ?? null, sort_order: i + 1, enabled: true, builtin: true, labels: {} }));
let byId = new Map(rows.map((r) => [r.id, r]));
let enabledRows = rows;
let version = 0;
const rowListeners = new Set<() => void>();

export async function loadDiets(): Promise<DietRow[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await (supabase as any).from("diets").select("id, emoji, sort_order, enabled, builtin, labels").order("sort_order");
    if (data && data.length) {
      rows = data as DietRow[];
      byId = new Map(rows.map((r) => [r.id, r]));
      enabledRows = rows.filter((r) => r.enabled);
      version++;
      rowListeners.forEach((l) => l());
    }
  } catch { /* offline: eingebaute Liste */ }
  return rows;
}

export function allDietRows() { return rows; }

/** Sichtbare Ernährungsformen in Admin-Reihenfolge (reaktiv). */
export function useDiets(): DietRow[] {
  return useSyncExternalStore((cb) => { rowListeners.add(cb); return () => rowListeners.delete(cb); }, () => enabledRows, () => enabledRows);
}
export function useDietsVersion() {
  return useSyncExternalStore((cb) => { rowListeners.add(cb); return () => rowListeners.delete(cb); }, () => version, () => 0);
}

export function dietEmoji(id: string) { return byId.get(id)?.emoji ?? BUILTIN_EMOJI[id] ?? "🍽️"; }

export function dietLabel(id: string, locale: string = getLocale()): string {
  const r = byId.get(id);
  const own = r?.labels?.[locale] ?? (locale.startsWith("de") ? r?.labels?.["de-DE"] : undefined);
  if (own) return swissify(locale, own);
  if ((BUILTIN_DIETS as readonly string[]).includes(id)) return translate(locale, `diet.${id}` as MessageKey);
  return swissify(locale, r?.labels?.["en-US"] ?? r?.labels?.["de-DE"] ?? id);
}

// ---- Gerätelokale Auswahl ----
const KEY = "shoppi:diet-filter";
/** Herkunft der Auswahl: "pref" = unter „Mehr" voreingestellt, sonst z.B. im Suchfeld gesetzt. */
const SRC_KEY = "shoppi:diet-filter-source";
const EMPTY: Diet[] = [];
let cache: Diet[] | null = null;
let srcCache: string | null | undefined;
const listeners = new Set<() => void>();

function read(): Diet[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(v) ? v.filter((d): d is Diet => typeof d === "string") : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function readSource(): string | null {
  if (typeof window === "undefined") return null;
  if (srcCache === undefined) {
    try {
      srcCache = localStorage.getItem(SRC_KEY);
    } catch {
      srcCache = null;
    }
  }
  return srcCache;
}

export function setDiets(next: Diet[], source?: "pref" | "search") {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  if (!next.length) {
    srcCache = null;
    localStorage.removeItem(SRC_KEY);
  } else if (source) {
    srcCache = source;
    localStorage.setItem(SRC_KEY, source);
  }
  listeners.forEach((l) => l());
}

export function toggleDiet(d: Diet, source?: "pref" | "search") {
  const cur = read();
  setDiets(cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d], source);
}

/** Gewählte Ernährungsformen (nur noch existierende, sichtbare werden berücksichtigt). */
export function useDietFilter(): Diet[] {
  const sel = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    read,
    () => EMPTY,
  );
  useDiets();
  return sel.some((d) => !byId.get(d)?.enabled) ? sel.filter((d) => byId.get(d)?.enabled) : sel;
}

/** "pref", wenn die Auswahl unter „Mehr" voreingestellt wurde — z.B. um den Filter im Suchfeld auszublenden. */
export function useDietFilterSource(): "pref" | null {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => (readSource() === "pref" ? "pref" : null),
    () => null,
  );
}
