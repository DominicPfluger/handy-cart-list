import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type PublicRecipe = {
  id: string; title: string; templateId: string; picks: Record<string, string[]>;
  items: Array<{ productId: string; name: string; emoji?: string | null; quantity: string; unit?: string | null }>;
  authorName: string | null; createdAt: string; slug: string; imagePath: string | null;
};

/** Öffentliches Rezept per Teilen-Link (nur is_public, anon-Leserechte). */
export const getRecipeBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug).slice(0, 40) }))
  .handler(async ({ data }): Promise<PublicRecipe | null> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: r } = await sb.from("recipes")
      .select("id, title, template_id, picks, items, author_name, created_at, share_slug, image_path")
      .eq("share_slug", data.slug).eq("is_public", true).maybeSingle();
    if (!r) return null;
    return {
      id: r.id, title: r.title, templateId: r.template_id,
      picks: (r.picks as Record<string, string[]>) ?? {},
      items: (r.items as PublicRecipe["items"]) ?? [],
      authorName: r.author_name, createdAt: r.created_at, slug: r.share_slug!, imagePath: r.image_path,
    };
  });
