import { useSyncExternalStore } from "react";

/** Gewählte Ernährungsformen für die Abteilungsansicht (nur auf diesem Gerät). */
export const DIETS = [
  "kosher", "halal", "vegetarian", "vegan", "gluten_free", "lactose_free", "fructose_free", "sugar_free",
  "keto", "paleo", "low_carb", "low_fat", "high_protein", "low_calorie", "clean_eating",
] as const;
export type Diet = (typeof DIETS)[number];

/** Icon je Ernährungsform (Chips zeigen Icon + lokalisierte Bezeichnung). */
export const DIET_EMOJI: Record<Diet, string> = {
  kosher: "✡️",
  halal: "☪️",
  vegetarian: "🥕",
  vegan: "🌱",
  gluten_free: "🌾",
  lactose_free: "🥛",
  fructose_free: "🍎",
  sugar_free: "🍬",
  keto: "🥑",
  paleo: "🍖",
  low_carb: "🍚",
  low_fat: "🥒",
  high_protein: "🥩",
  low_calorie: "⚖️",
  clean_eating: "🥗",
};

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
    cache = Array.isArray(v) ? v.filter((d): d is Diet => (DIETS as readonly string[]).includes(d)) : [];
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

export function useDietFilter(): Diet[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    read,
    () => EMPTY,
  );
}

/** "pref", wenn die Auswahl unter „Mehr" voreingestellt wurde — z.B. um den Filter im Suchfeld auszublenden. */
export function useDietFilterSource(): "pref" | null {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => (readSource() === "pref" ? "pref" : null),
    () => null,
  );
}
