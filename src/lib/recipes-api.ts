// Rezept-Community: Lesen/Schreiben über den Browser-Client (RLS schützt die Daten).
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type RecipeItem = { productId: string; name: string; emoji?: string | null; quantity: string; unit?: string | null };
export type FeedRecipe = {
  id: string; title: string; description: string | null; template_id: string; items: RecipeItem[]; product_ids: string[];
  share_slug: string | null; author_name: string | null; created_at: string;
  avg_rating: number; rating_count: number; save_count: number; match_count: number; image_path: string | null;
};
export type FeedOrder = "rating" | "saves" | "favorites";

export async function fetchFeed(order: FeedOrder, productIds?: string[], limit = 10): Promise<FeedRecipe[]> {
  if (order === "favorites" && (!productIds || productIds.length === 0)) return [];
  const args: { _order: string; _limit: number; _product_ids?: string[] } = { _order: order, _limit: limit };
  if (order === "favorites" && productIds) args._product_ids = productIds;
  const { data, error } = await supabase.rpc("recipe_feed", args);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    items: (r.items as unknown as RecipeItem[]) ?? [],
    avg_rating: Number(r.avg_rating), rating_count: Number(r.rating_count),
    save_count: Number(r.save_count), match_count: Number(r.match_count),
  }));
}

export function makeSlug() {
  const a = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  const buf = crypto.getRandomValues(new Uint8Array(10));
  for (const b of buf) s += a[b % a.length];
  return s;
}

export async function createRecipe(input: {
  ownerId: string; authorName?: string | undefined; title: string; description?: string | null | undefined; templateId: string;
  picks: Record<string, string[]>; items: RecipeItem[]; isPublic?: boolean | undefined; imagePath?: string | null | undefined;
  satiety?: string | null | undefined; spiciness?: string | null | undefined; priceClass?: string | null | undefined;
}) {
  const { data, error } = await supabase.from("recipes").insert({
    owner_id: input.ownerId,
    author_name: input.authorName ?? null,
    title: input.title,
    description: input.description ?? null,
    template_id: input.templateId,
    picks: input.picks as unknown as Json,
    items: input.items as unknown as Json,
    product_ids: input.items.map((i) => i.productId),
    is_public: !!input.isPublic,
    image_path: input.imagePath ?? null,
    satiety: input.satiety ?? null,
    spiciness: input.spiciness ?? null,
    price_class: input.priceClass ?? null,
    share_slug: input.isPublic ? makeSlug() : null,
  }).select("id, share_slug").single();
  if (error) throw error;
  return data;
}

/** Macht ein Rezept öffentlich und liefert den Teilen-Slug. */
export async function publishRecipe(id: string): Promise<string> {
  const { data: cur } = await supabase.from("recipes").select("share_slug").eq("id", id).single();
  const slug = cur?.share_slug ?? makeSlug();
  const { error } = await supabase.from("recipes").update({ is_public: true, share_slug: slug }).eq("id", id);
  if (error) throw error;
  return slug;
}

export async function unpublishRecipe(id: string) {
  const { error } = await supabase.from("recipes").update({ is_public: false }).eq("id", id);
  if (error) throw error;
}

export async function rateRecipe(recipeId: string, userId: string, stars: number) {
  const { error } = await supabase.from("recipe_ratings")
    .upsert({ recipe_id: recipeId, user_id: userId, stars }, { onConflict: "recipe_id,user_id" });
  if (error) throw error;
}

export async function myRating(recipeId: string, userId: string) {
  const { data } = await supabase.from("recipe_ratings").select("stars").eq("recipe_id", recipeId).eq("user_id", userId).maybeSingle();
  return data?.stars ?? 0;
}

export type RecipeComment = { id: string; user_id: string; author_name: string | null; body: string; created_at: string };
export async function fetchComments(recipeId: string): Promise<RecipeComment[]> {
  const { data, error } = await supabase.from("recipe_comments")
    .select("id, user_id, author_name, body, created_at").eq("recipe_id", recipeId).order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
export async function addComment(recipeId: string, userId: string, authorName: string | undefined, body: string) {
  const { error } = await supabase.from("recipe_comments").insert({ recipe_id: recipeId, user_id: userId, author_name: authorName ?? null, body: body.trim().slice(0, 1000) });
  if (error) throw error;
}
export async function deleteComment(id: string) {
  const { error } = await supabase.from("recipe_comments").delete().eq("id", id);
  if (error) throw error;
}

export function shareUrl(slug: string) {
  return `${window.location.origin}/rezept/${slug}`;
}

export async function shareLink(slug: string, title: string): Promise<"shared" | "copied"> {
  const url = shareUrl(slug);
  if (navigator.share) {
    try { await navigator.share({ title, url }); return "shared"; } catch { /* abgebrochen → kopieren */ }
    }
  try { await navigator.clipboard?.writeText(url); } catch { /* Clipboard gesperrt → trotzdem teilen */ }
  return "copied";
}

export type CommunityRecipe = {
  id: string; owner_id: string; title: string; description: string | null; template_id: string; items: RecipeItem[];
  share_slug: string | null; author_name: string | null; created_at: string; is_public: boolean; image_path: string | null;
};

/** Alle öffentlichen Rezepte (neueste zuerst), optional nur von einer Person. */
export async function fetchCommunity(authorId?: string): Promise<CommunityRecipe[]> {
  let q = supabase.from("recipes")
    .select("id, owner_id, title, description, template_id, items, share_slug, author_name, created_at, is_public, image_path")
    .eq("is_public", true).order("created_at", { ascending: false }).limit(300);
  if (authorId) q = q.eq("owner_id", authorId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, items: (r.items as unknown as RecipeItem[]) ?? [] }));
}

/** Eigene Rezepte (privat + öffentlich). */
export async function fetchMyRecipes(userId: string): Promise<CommunityRecipe[]> {
  const { data, error } = await supabase.from("recipes")
    .select("id, owner_id, title, description, template_id, items, share_slug, author_name, created_at, is_public, image_path")
    .eq("owner_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, items: (r.items as unknown as RecipeItem[]) ?? [] }));
}

/** Einzelnes Rezept laden (eigenes oder öffentliches — RLS filtert). */
export async function fetchRecipe(id: string): Promise<CommunityRecipe | null> {
  const { data, error } = await supabase.from("recipes")
    .select("id, owner_id, title, description, template_id, items, share_slug, author_name, created_at, is_public, image_path")
    .eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, items: (data.items as unknown as RecipeItem[]) ?? [] } : null;
}

/** Öffentliche Rezepte samt Eigenschaften für die Kriterien-Suche. */
export type TraitRecipe = {
  id: string; title: string; description: string | null; template_id: string; share_slug: string;
  author_name: string | null; created_at: string; image_path: string | null;
  satiety: string | null; spiciness: string | null; price_class: string | null;
};

export async function fetchTraitRecipes(): Promise<TraitRecipe[]> {
  const { data, error } = await supabase.from("recipes")
    .select("id, title, description, template_id, share_slug, author_name, created_at, image_path, satiety, spiciness, price_class")
    .eq("is_public", true).not("share_slug", "is", null)
    .order("created_at", { ascending: false }).limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as TraitRecipe[];
}
