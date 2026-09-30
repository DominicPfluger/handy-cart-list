import { useSyncExternalStore } from "react";

/** Gewählte Ernährungsformen für die Abteilungsansicht (nur auf diesem Gerät). */
export const DIETS = [
  "kosher", "halal", "vegetarian", "vegan", "gluten_free", "lactose_free", "fructose_free", "sugar_free",
  "keto", "paleo", "low_carb", "low_fat", "high_protein", "low_calorie", "clean_eating",
] as const;
export type Diet = (typeof DIETS)[number];

/** Icon je Ernährungsform (Chips zeigen nur das Icon, Name per Tooltip). */
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
const EMPTY: Diet[] = [];
let cache: Diet[] | null = null;
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

export function setDiets(next: Diet[]) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function toggleDiet(d: Diet) {
  const cur = read();
  setDiets(cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]);
}

export function useDietFilter(): Diet[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    read,
    () => EMPTY,
  );
}
