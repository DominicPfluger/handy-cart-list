// Persönliche Rezeptliste mit verschachtelten Ordnern — in der Cloud, pro Konto.
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
  folderId: string;
  sortOrder: number;
  customTitle: string | null;
  isPublic: boolean;
  shareSlug: string | null;
  isOwn: boolean;
};
export type RecipeCollection = { id: string; name: string; parentId: string | null; recipes: SavedRecipe[] };

/** Ordner-Pfad, z. B. "Abendessen › Vegetarisch". */
export function folderPath(cols: RecipeCollection[], id: string): string {
  const parts: string[] = []; let cur = cols.find((c) => c.id === id); let guard = 0;
  while (cur && guard++ < 50) { parts.unshift(cur.name); cur = cur.parentId ? cols.find((c) => c.id === cur!.parentId) : undefined; }
  return parts.join(" › ");
}
/** Ordner in Baum-Reihenfolge mit Tiefe. */
export function flattenTree(cols: RecipeCollection[]): Array<{ c: RecipeCollection; depth: number }> {
  const ids = new Set(cols.map((c) => c.id));
  const out: Array<{ c: RecipeCollection; depth: number }> = [];
  const walk = (parent: string | null, depth: number) => {
    for (const c of cols.filter((x) => (x.parentId && ids.has(x.parentId) ? x.parentId : null) === parent)) { out.push({ c, depth }); walk(c.id, depth + 1); }
  };
  walk(null, 0);
  return out;
}

const LEGACY_KEY = "shoppi:recipe-collections";
const EMPTY: RecipeCollection[] = [];
let cache: RecipeCollection[] = EMPTY;
let loadedFor: string | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

async function load(userId: string) {
  const [{ data: folders }, { data: saves }] = await Promise.all([
    supabase.from("recipe_folders").select("id, name, sort_order, parent_id").order("sort_order").order("created_at"),
    supabase.from("recipe_saves")
      .select("id, folder_id, created_at, custom_title, sort_order, recipe:recipes(id, owner_id, title, template_id, picks, is_public, share_slug)")
      .order("sort_order").order("created_at", { ascending: false }),
  ]);
  const list: RecipeCollection[] = (folders ?? []).map((f) => ({ id: f.id, name: f.name, parentId: f.parent_id ?? null, recipes: [] }));
  for (const s of saves ?? []) {
    const r = s.recipe as unknown as { id: string; owner_id: string; title: string; template_id: string; picks: Record<string, string[]>; is_public: boolean; share_slug: string | null } | null;
    if (!r) continue;
    const c = list.find((x) => x.id === s.folder_id) ?? list[0];
    if (!c) continue;
    c.recipes.push({
      id: s.id, recipeId: r.id, title: s.custom_title || r.title, customTitle: s.custom_title, folderId: c.id, sortOrder: s.sort_order, templateId: r.template_id, picks: r.picks ?? {},
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

export async function createCollection(userId: string, name: string, parentId: string | null = null) {
  const { data, error } = await supabase.from("recipe_folders")
    .insert({ owner_id: userId, name: name.trim() || "Meine Rezepte", sort_order: cache.length, parent_id: parentId }).select("id").single();
  if (error) throw error;
  await refreshCollections();
  return data.id;
}
export async function renameCollection(id: string, name: string) {
  if (!name.trim()) return;
  await supabase.from("recipe_folders").update({ name: name.trim() }).eq("id", id);
  await refreshCollections();
}
export async function moveCollection(id: string, parentId: string | null) {
  const { error } = await supabase.from("recipe_folders").update({ parent_id: parentId }).eq("id", id);
  if (error) throw error;
  await refreshCollections();
}
/** Löscht einen Ordner; Rezepte und Unterordner wandern eine Ebene nach oben. */
export async function deleteCollection(id: string) {
  const f = cache.find((c) => c.id === id);
  const parent = f?.parentId ?? null;
  await supabase.from("recipe_folders").update({ parent_id: parent }).eq("parent_id", id);
  const target = parent ?? cache.find((c) => c.id !== id && !c.parentId)?.id ?? null;
  if (target) await supabase.from("recipe_saves").update({ folder_id: target }).eq("folder_id", id);
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
export async function deleteSaved(saveId: string) {
  await supabase.from("recipe_saves").delete().eq("id", saveId);
  await refreshCollections();
}

function setCache(next: RecipeCollection[]) { cache = next; emit(); }

export async function renameSaved(rec: SavedRecipe, title: string) {
  const t = title.trim();
  if (!t || t === rec.title) return;
  setCache(cache.map((c) => ({ ...c, recipes: c.recipes.map((r) => (r.id === rec.id ? { ...r, title: t } : r)) })));
  if (rec.isOwn) {
    await supabase.from("recipes").update({ title: t }).eq("id", rec.recipeId);
    await supabase.from("recipe_saves").update({ custom_title: null }).eq("id", rec.id);
  } else {
    await supabase.from("recipe_saves").update({ custom_title: t }).eq("id", rec.id);
  }
  await refreshCollections();
}

/** Neue Anordnung (optimistisch) übernehmen und speichern. */
export async function applyLayout(next: RecipeCollection[]) {
  const prev = new Map(cache.flatMap((c) => c.recipes.map((r, i) => [r.id, `${c.id}:${i}`] as const)));
  setCache(next);
  const changes: Array<{ id: string; folder_id: string; sort_order: number }> = [];
  for (const c of next) {
    const touched = c.recipes.some((r, i) => prev.get(r.id) !== `${c.id}:${i}`) || c.recipes.some((r, i) => r.sortOrder !== i);
    if (touched) c.recipes.forEach((r, i) => changes.push({ id: r.id, folder_id: c.id, sort_order: i }));
  }
  await Promise.all(changes.map((ch) => supabase.from("recipe_saves").update({ folder_id: ch.folder_id, sort_order: ch.sort_order }).eq("id", ch.id)));
}

/** Löschen; liefert eine Funktion zum Wiederherstellen. */
export async function deleteSavedWithUndo(rec: SavedRecipe, userId: string) {
  await deleteSaved(rec.id);
  return async () => {
    await supabase.from("recipe_saves").insert({
      user_id: userId, recipe_id: rec.recipeId, folder_id: rec.folderId, sort_order: rec.sortOrder, custom_title: rec.customTitle,
    });
    await refreshCollections();
  };
}
