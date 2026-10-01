// Persönliche Rezeptliste mit Ordnern (eine Ebene) — in der Cloud, pro Konto.
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createRecipe, type RecipeItem } from "../lib/recipes-api";

export type SavedRecipe = {
  id: string; // save-id
  recipeId: string;
  title: string;
  templateId: string;
  picks: Record<string, string[]>;
  savedAt: number;
  isPublic: boolean;
  shareSlug: string | null;
  isOwn: boolean;
};
export type RecipeCollection = { id: string; name: string; recipes: SavedRecipe[] };

const LEGACY_KEY = "shoppi:recipe-collections";
const EMPTY: RecipeCollection[] = [];
let cache: RecipeCollection[] = EMPTY;
let loadedFor: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

async function load(userId: string) {
  const [{ data: folders }, { data: saves }] = await Promise.all([
    supabase.from("recipe_folders").select("id, name, sort_order").order("sort_order").order("created_at"),
    supabase.from("recipe_saves")
      .select("id, folder_id, created_at, recipe:recipes(id, owner_id, title, template_id, picks, is_public, share_slug)")
      .order("created_at", { ascending: false }),
  ]);
  const list: RecipeCollection[] = (folders ?? []).map((f) => ({ id: f.id, name: f.name, recipes: [] }));
  for (const s of saves ?? []) {
    const r = s.recipe as unknown as { id: string; owner_id: string; title: string; template_id: string; picks: Record<string, string[]>; is_public: boolean; share_slug: string | null } | null;
    if (!r) continue;
    const c = list.find((x) => x.id === s.folder_id) ?? list[0];
    if (!c) continue;
    c.recipes.push({
      id: s.id, recipeId: r.id, title: r.title, templateId: r.template_id, picks: r.picks ?? {},
      savedAt: new Date(s.created_at).getTime(), isPublic: r.is_public, shareSlug: r.share_slug, isOwn: r.owner_id === userId,
    });
  }
  cache = list;
  loadedFor = userId;
  emit();
}

/** Einmalige Übernahme der früheren Geräte-Sammlungen. */
async function migrateLegacy(userId: string, authorName?: string | undefined) {
  let legacy: Array<{ name: string; recipes: Array<{ title: string; templateId: string; picks: Record<string, string[]> }> }> = [];
  try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "[]"); } catch { legacy = []; }
  if (!legacy.length) return;
  for (const c of legacy) {
    const { data: f } = await supabase.from("recipe_folders").insert({ owner_id: userId, name: c.name }).select("id").single();
    if (!f) continue;
    for (const r of c.recipes) {
      try {
        const items: RecipeItem[] = Object.values(r.picks ?? {}).flat().map((id) => ({ productId: id, name: "", quantity: "" }));
        const rec = await createRecipe({ ownerId: userId, authorName, title: r.title, templateId: r.templateId, picks: r.picks, items });
        await supabase.from("recipe_saves").insert({ user_id: userId, recipe_id: rec.id, folder_id: f.id });
      } catch { /* einzelnes Rezept überspringen */ }
    }
  }
  try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
}

let current: { id: string; name?: string | undefined } | null = null;
export async function refreshCollections() {
  if (current) await load(current.id);
}

export function useRecipeCollections(user: { id: string; name?: string | undefined } | null | undefined) {
  useEffect(() => {
    if (!user) { current = null; if (cache !== EMPTY) { cache = EMPTY; loadedFor = null; emit(); } return; }
    current = { id: user.id, name: user.name };
    if (loadedFor === user.id) return;
    migrateLegacy(user.id, user.name).finally(() => load(user.id));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => cache, () => EMPTY);
}

export async function createCollection(userId: string, name: string) {
  const { data, error } = await supabase.from("recipe_folders")
    .insert({ owner_id: userId, name: name.trim() || "Meine Rezepte", sort_order: cache.length }).select("id").single();
  if (error) throw error;
  await refreshCollections();
  return data.id;
}
export async function renameCollection(id: string, name: string) {
  if (!name.trim()) return;
  await supabase.from("recipe_folders").update({ name: name.trim() }).eq("id", id);
  await refreshCollections();
}
export async function deleteCollection(id: string) {
  await supabase.from("recipe_folders").delete().eq("id", id);
  await refreshCollections();
}
/** Speichert ein bestehendes Rezept (eigenes oder geteiltes) in einen Ordner. */
export async function saveToFolder(userId: string, recipeId: string, folderId: string) {
  const { error } = await supabase.from("recipe_saves")
    .upsert({ user_id: userId, recipe_id: recipeId, folder_id: folderId }, { onConflict: "user_id,recipe_id" });
  if (error) throw error;
  await refreshCollections();
}
export async function moveSaved(saveId: string, folderId: string) {
  await supabase.from("recipe_saves").update({ folder_id: folderId }).eq("id", saveId);
  await refreshCollections();
}
export async function deleteSaved(saveId: string) {
  await supabase.from("recipe_saves").delete().eq("id", saveId);
  await refreshCollections();
}
