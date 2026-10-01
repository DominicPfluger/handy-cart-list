import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Kein Admin-Zugriff");
}

const CURRENCIES: Record<string, string> = {
  CH: "CHF", DE: "EUR", AT: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", BE: "EUR", NL: "EUR", PT: "EUR",
  GB: "GBP", US: "USD", CA: "CAD", MX: "MXN", BR: "BRL",
};

/** Status: wie viele Produkte noch Bild bzw. Richtpreis (je Markt, global) brauchen. */
export const catalogMediaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ market: z.string().length(2).default("CH") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { count: noImage } = await sb.from("products").select("id", { count: "exact", head: true }).is("image_path", null);
    const { count: total } = await sb.from("products").select("id", { count: "exact", head: true });
    const marketEntries = await Promise.all(
      Object.keys(CURRENCIES).map(async (m) => {
        const { count } = await sb.from("product_reference_prices").select("id", { count: "exact", head: true }).eq("market", m);
        return [m, count ?? 0] as const;
      }),
    );
    const markets = Object.fromEntries(marketEntries) as Record<string, number>;
    return { total: total ?? 0, noImage: noImage ?? 0, priced: markets[data.market] ?? 0, markets };
  });

/** Dauerhafte Bildergalerie: alle Produkte mit Bild, durchsuchbar, seitenweise. */
export const listProductImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ q: z.string().default(""), page: z.number().int().min(0).default(0), perPage: z.number().int().min(1).max(60).default(30) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = context.supabase;
    const q = data.q.trim();
    let query = sb
      .from("products")
      .select("id, name, image_path", { count: "exact" })
      .not("image_path", "is", null)
      .order("name")
      .range(data.page * data.perPage, (data.page + 1) * data.perPage - 1);
    if (q) query = query.ilike("name", `%${q}%`);
    const { data: rows, count, error } = await query;
    if (error) throw new Error(error.message);
    const items = await Promise.all(
      ((rows ?? []) as Array<{ id: string; name: string; image_path: string }>).map(async (p) => {
        const signed = await supabaseAdmin.storage.from("catalog-images").createSignedUrl(p.image_path, 3600);
        return { id: p.id, name: p.name, url: signed.data?.signedUrl ?? null };
      }),
    );
    return { items, total: count ?? 0, page: data.page, perPage: data.perPage };
  });

/** Erzeugt KI-Bilder für die nächsten `limit` Produkte ohne Bild und speichert sie im Katalog-Speicher. */
export const generateProductImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(10).default(5) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { generateProductImage } = await import("./product-media.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = context.supabase;

    const { data: products } = await sb
      .from("products")
      .select("id, name, emoji")
      .is("image_path", null)
      .order("sort_order")
      .limit(data.limit);
    const list = (products ?? []) as Array<{ id: string; name: string; emoji: string | null }>;

    let done = 0;
    const errors: string[] = [];
    const items: Array<{ id: string; name: string; url: string | null }> = [];
    for (const p of list) {
      try {
        const bytes = await generateProductImage(p.name, p.emoji);
        const path = `products/${p.id}.png`;
        const up = await supabaseAdmin.storage.from("catalog-images").upload(path, bytes, { contentType: "image/png", upsert: true });
        if (up.error) throw new Error(up.error.message);
        const upd = await sb.from("products").update({ image_path: path }).eq("id", p.id);
        if (upd.error) throw new Error(upd.error.message);
        const signed = await supabaseAdmin.storage.from("catalog-images").createSignedUrl(path, 3600);
        items.push({ id: p.id, name: p.name, url: signed.data?.signedUrl ?? null });
        done++;
      } catch (e) {
        errors.push(`${p.name}: ${e instanceof Error ? e.message : String(e)}`);
        if (errors.length >= 3) break; // bei wiederholten Fehlern (z. B. Guthaben) abbrechen
      }
    }
    return { done, attempted: list.length, errors, items };
  });

/** Schätzt KI-Richtpreise für die nächsten `limit` Produkte ohne Preis im gewählten Markt. */
export const generateReferencePrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ market: z.string().length(2), limit: z.number().int().min(1).max(100).default(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { estimatePrices } = await import("./product-media.server");
    const sb = context.supabase;
    const currency = CURRENCIES[data.market] ?? "EUR";

    const { data: existing } = await sb.from("product_reference_prices").select("product_id").eq("market", data.market);
    const have = new Set(((existing ?? []) as Array<{ product_id: string }>).map((r) => r.product_id));

    const missing: Array<{ id: string; name: string; default_quantity: number; default_unit: string }> = [];
    for (let from = 0; missing.length < data.limit; from += 1000) {
      const { data: rows } = await sb
        .from("products")
        .select("id, name, default_quantity, default_unit")
        .order("sort_order")
        .range(from, from + 999);
      if (!rows || rows.length === 0) break;
      for (const r of rows as Array<{ id: string; name: string; default_quantity: number; default_unit: string }>) {
        if (!have.has(r.id)) missing.push(r);
        if (missing.length >= data.limit) break;
      }
      if (rows.length < 1000) break;
    }
    if (missing.length === 0) return { done: 0, remaining: 0 };

    const estimates = await estimatePrices(missing, data.market);
    const byKey = new Map(estimates.map((e) => [e.key, e]));
    const rows = missing
      .map((p) => {
        const e = byKey.get(p.id);
        if (!e || !(e.price > 0)) return null;
        return {
          product_id: p.id,
          market: data.market,
          price: e.price,
          currency,
          pack_size: e.pack_size,
          pack_unit: e.pack_unit,
          unit_price: e.unit_price,
          unit_basis: e.unit_basis,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    if (rows.length > 0) {
      const { error } = await sb.from("product_reference_prices").upsert(rows, { onConflict: "product_id,market" });
      if (error) throw new Error(error.message);
    }
    return { done: rows.length, remaining: have.size + rows.length };
  });
