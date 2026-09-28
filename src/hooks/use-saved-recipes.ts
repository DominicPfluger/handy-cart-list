import { useSyncExternalStore } from "react";

export type SavedRecipe = {
  id: string;
  title: string;
  templateId: string;
  picks: Record<string, string[]>;
  savedAt: number;
};
export type RecipeCollection = { id: string; name: string; recipes: SavedRecipe[] };

const KEY = "shoppi:recipe-collections";
const EMPTY: RecipeCollection[] = [];
let cache: RecipeCollection[] | null = null;
const subs = new Set<() => void>();

function read(): RecipeCollection[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecipeCollection[];
  } catch {
    cache = [];
  }
  return cache;
}
function write(next: RecipeCollection[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

export function useRecipeCollections() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    read,
    () => EMPTY,
  );
}

export function createCollection(name: string) {
  const c: RecipeCollection = { id: `rc${Date.now()}`, name: name.trim() || "Meine Rezepte", recipes: [] };
  write([...read(), c]);
  return c.id;
}
export function deleteCollection(id: string) {
  write(read().filter((c) => c.id !== id));
}
export function saveRecipe(collectionId: string, r: Omit<SavedRecipe, "id" | "savedAt">) {
  const rec: SavedRecipe = { ...r, id: `r${Date.now()}`, savedAt: Date.now() };
  write(read().map((c) => (c.id === collectionId ? { ...c, recipes: [rec, ...c.recipes] } : c)));
}
export function deleteRecipe(collectionId: string, recipeId: string) {
  write(read().map((c) => (c.id === collectionId ? { ...c, recipes: c.recipes.filter((r) => r.id !== recipeId) } : c)));
}
