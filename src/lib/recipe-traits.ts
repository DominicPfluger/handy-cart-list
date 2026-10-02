// Rezept-Eigenschaften (stabile Schlüssel, Anzeige via i18n `rk.<group>.<key>`).
export const RECIPE_TRAITS = {
  satiety: { emoji: "🍽️", values: ["light", "balanced", "filling", "hearty", "rich"] },
  spiciness: { emoji: "🌶️", values: ["none", "mild", "slight", "medium", "hot", "very_hot", "fiery"] },
  price_class: { emoji: "💰", values: ["budget", "affordable", "standard", "upscale", "exquisite"] },
  taste: { emoji: "😋", values: ["sweet", "slightly_sweet", "balanced", "savory", "sour", "bitter", "umami", "salty", "fruity"] },
} as const;
export type TraitGroup = keyof typeof RECIPE_TRAITS;
export const TRAIT_GROUPS = Object.keys(RECIPE_TRAITS) as TraitGroup[];
export type RecipeTraits = Record<TraitGroup, string | null>;
