// Rezept-Eigenschaften (stabile Schlüssel, Anzeige via i18n `rk.<group>.<key>`).
export const RECIPE_TRAITS = {
  satiety: { emoji: "🍽️", values: ["light", "balanced", "filling", "hearty", "rich"] },
  spiciness: { emoji: "🌶️", values: ["none", "mild", "slight", "medium", "hot", "very_hot", "fiery"] },
  price_class: { emoji: "💰", values: ["budget", "affordable", "standard", "upscale", "exquisite"] },
  taste: { emoji: "😋", values: ["sweet", "slightly_sweet", "balanced", "savory", "sour", "bitter", "umami", "salty", "fruity"] },
  difficulty: { emoji: "🎚️", values: ["very_easy", "easy", "medium", "demanding", "hard", "very_hard"] },
} as const;
export type TraitGroup = keyof typeof RECIPE_TRAITS;
export const TRAIT_GROUPS = Object.keys(RECIPE_TRAITS) as TraitGroup[];
export type RecipeTraits = Record<TraitGroup, string | null>;

// Geschmack erlaubt Mehrfachauswahl (max. 3), gespeichert komma-getrennt in recipes.taste.
export const TASTE_MAX = 3;
export const splitTaste = (v: string | null | undefined): string[] => (v ? v.split(",").filter(Boolean) : []);
export const joinTaste = (arr: string[]): string | null => (arr.length ? arr.join(",") : null);
export const toggleTaste = (cur: string | null, v: string): string | null => {
  const list = splitTaste(cur);
  if (list.includes(v)) return joinTaste(list.filter((x) => x !== v));
  if (list.length >= TASTE_MAX) return cur;
  return joinTaste([...list, v]);
};
