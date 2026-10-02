import { useMemo } from "react";
import { useCatalog } from "./catalog-query";
import { RECIPE_TEMPLATES, type RecipeTemplate } from "./recipe-templates";
import type { MessageKey } from "../i18n/de";

/** Vorlagen aus der Datenbank (Admin-gepflegt); Fallback: feste Vorlagen aus dem Code. */
export function useRecipeTemplates(): RecipeTemplate[] {
  const catalog = useCatalog();
  return useMemo(() => {
    const dbT = catalog.recipeTemplates.filter((x) => x.enabled);
    if (dbT.length === 0) return RECIPE_TEMPLATES;
    return dbT.map((x) => ({
      id: x.id as RecipeTemplate["id"],
      image: RECIPE_TEMPLATES.find((b) => b.id === x.id)?.image,
      emoji: x.emoji ?? "🍽️",
      color: x.color ?? "oklch(0.93 0.04 120)",
      name: x.name,
      steps: catalog.recipeSteps
        .filter((s) => s.templateId === x.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({ key: s.key, label: s.name, emoji: s.emoji, min: s.min, max: s.max, required: s.required, ingredients: [] as string[] })),
    })) as RecipeTemplate[];
  }, [catalog.recipeTemplates, catalog.recipeSteps]);
}

/** Name einer Vorlage: eingebaute IDs über die Sprachdateien, eigene über den Katalog-Namen. */
export function templateLabel(tpl: RecipeTemplate, t: (k: MessageKey) => string): string {
  const builtin = (RECIPE_TEMPLATES as ReadonlyArray<{ id: string }>).some((x) => x.id === tpl.id);
  return builtin ? t(`rk.cat.${tpl.id}` as MessageKey) : (tpl.name ?? tpl.id);
}
