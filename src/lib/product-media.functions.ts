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

/** Erzeugt ein KI-Bild für eine Produktvariante und liefert den Speicherpfad (Speichern der Zuordnung macht der Client). */
export const generateVariantImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    productId: z.string().uuid(),
    variant: z.string().min(1).max(120),
    iconOnly: z.boolean().optional(),
    hint: z.string().max(300).optional(),
    opts: z.object({
      style: z.enum(["photo", "illustration"]).optional(),
      background: z.enum(["transparent", "white", "gradient"]).optional(),
      view: z.enum(["front", "top", "side"]).optional(),
      count: z.enum(["single", "group"]).optional(),
    }).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { generateProductImage } = await import("./product-media.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p, error } = await context.supabase.from("products").select("id, name, emoji").eq("id", data.productId).single();
    if (error || !p) throw new Error("Produkt nicht gefunden");
    const bytes = await generateProductImage(`${p.name} – ${data.variant}`, p.emoji, data.hint?.trim() || `the "${data.variant}" variety of ${p.name}`, data.opts);
    const path = `${data.iconOnly ? "variant-icons" : "variants"}/${p.id}-${crypto.randomUUID()}.webp`;
    const up = await supabaseAdmin.storage.from("catalog-images").upload(path, bytes, { contentType: "image/webp", upsert: true });
    if (up.error) throw new Error(up.error.message);
    return { path };
  });

/** Status: wie viele Produkte noch Bild bzw. Richtpreis (je Markt, global) brauchen. */
export const catalogMediaStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ market: z.string().length(2).default("CH") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { count: noImage } = await sb.from("products").select("id", { count: "exact", head: true }).is("image_path", null);
    const { count: missingIcons } = await sb.from("products").select("id", { count: "exact", head: true }).not("image_path", "is", null).is("icon_path", null);
    const { count: total } = await sb.from("products").select("id", { count: "exact", head: true });
    const marketEntries = await Promise.all(
      Object.keys(CURRENCIES).map(async (m) => {
        const { count } = await sb.from("product_reference_prices").select("id", { count: "exact", head: true }).eq("market", m);
        return [m, count ?? 0] as const;
      }),
    );
    const markets = Object.fromEntries(marketEntries) as Record<string, number>;
    return { total: total ?? 0, noImage: noImage ?? 0, missingIcons: missingIcons ?? 0, priced: markets[data.market] ?? 0, markets };
  });

/** Small, resumable batch of existing product images awaiting icon conversion in the admin browser. */
export const listProductsMissingIcons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(20).default(10) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: rows, error } = await context.supabase.from("products")
      .select("id, image_path").not("image_path", "is", null).is("icon_path", null).order("id").limit(data.limit);
    if (error) throw error;
    return (rows ?? []).filter((row): row is { id: string; image_path: string } => Boolean(row.image_path))
      .map((row) => ({ id: row.id, path: row.image_path }));
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
        return { id: p.id, name: p.name, path: p.image_path, url: signed.data?.signedUrl ?? null };
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
    const items: Array<{ id: string; name: string; path: string; url: string | null }> = [];
    for (const p of list) {
      try {
        const bytes = await generateProductImage(p.name, p.emoji);
        const path = `products/${p.id}-${crypto.randomUUID()}.webp`;
        const up = await supabaseAdmin.storage.from("catalog-images").upload(path, bytes, { contentType: "image/webp", upsert: true });
        if (up.error) throw new Error(up.error.message);
        const upd = await sb.from("products").update({ image_path: path, icon_path: null }).eq("id", p.id);
        if (upd.error) throw new Error(upd.error.message);
        const signed = await supabaseAdmin.storage.from("catalog-images").createSignedUrl(path, 3600);
        items.push({ id: p.id, name: p.name, path, url: signed.data?.signedUrl ?? null });
        done++;
      } catch (e) {
        errors.push(`${p.name}: ${e instanceof Error ? e.message : String(e)}`);
        if (errors.length >= 3) break; // bei wiederholten Fehlern (z. B. Guthaben) abbrechen
      }
    }
    return { done, attempted: list.length, errors, items };
  });

/** KI-Bild für genau ein Produkt oder eine Kategorie erzeugen (überschreibt ein vorhandenes). */
export const generateImageFor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      kind: z.enum(["product", "department"]).default("product"),
      iconOnly: z.boolean().optional(),
      hint: z.string().max(300).optional(),
      opts: z.object({
        style: z.enum(["photo", "illustration"]).optional(),
        background: z.enum(["transparent", "white", "gradient"]).optional(),
        view: z.enum(["front", "top", "side"]).optional(),
        count: z.enum(["single", "group"]).optional(),
      }).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { generateProductImage } = await import("./product-media.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = data.kind === "department" ? "departments" : "products";
    const { data: p, error } = await context.supabase.from(table).select("id, name, emoji").eq("id", data.id).single();
    if (error || !p) throw new Error(data.kind === "department" ? "Kategorie nicht gefunden" : "Produkt nicht gefunden");
    const bytes = await generateProductImage(p.name, p.emoji, data.hint, data.opts);
    // A new path makes the replacement visible immediately, even with cached signed URLs.
    const path = `${data.iconOnly ? "icons" : table}/${p.id}-${crypto.randomUUID()}.webp`;
    const up = await supabaseAdmin.storage.from("catalog-images").upload(path, bytes, { contentType: "image/webp", upsert: true });
    if (up.error) throw new Error(up.error.message);
    if (!data.iconOnly) {
      const upd = data.kind === "product"
        ? await context.supabase.from("products").update({ image_path: path, icon_path: null }).eq("id", p.id)
        : await context.supabase.from("departments").update({ image_path: path }).eq("id", p.id);
      if (upd.error) throw new Error(upd.error.message);
    }
    return { path };
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

/** Schätzt KI-Richtpreise für ALLE Produkte einer Kategorie (inkl. Unterkategorien) im gewählten Markt auf einmal. */
export const estimateCategoryPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ market: z.string().length(2), departmentId: z.string().uuid(), onlyMissing: z.boolean().default(true) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { estimatePrices } = await import("./product-media.server");
    const sb = context.supabase;
    const currency = CURRENCIES[data.market] ?? "EUR";

    // Kategorie + alle Unterkategorien rekursiv einsammeln
    const { data: depts } = await sb.from("departments").select("id, parent_id");
    const children = new Map<string | null, string[]>();
    for (const d of (depts ?? []) as Array<{ id: string; parent_id: string | null }>) {
      children.set(d.parent_id, [...(children.get(d.parent_id) ?? []), d.id]);
    }
    const deptIds: string[] = [];
    const stack = [data.departmentId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      deptIds.push(id);
      stack.push(...(children.get(id) ?? []));
    }

    const { data: prods } = await sb
      .from("products")
      .select("id, name, default_quantity, default_unit")
      .in("department_id", deptIds)
      .order("sort_order");
    let list = (prods ?? []) as Array<{ id: string; name: string; default_quantity: number; default_unit: string }>;
    const total = list.length;
    if (total === 0) return { done: 0, total: 0 };

    if (data.onlyMissing) {
      const { data: existing } = await sb.from("product_reference_prices").select("product_id").eq("market", data.market).in("product_id", list.map((p) => p.id));
      const have = new Set(((existing ?? []) as Array<{ product_id: string }>).map((r) => r.product_id));
      list = list.filter((p) => !have.has(p.id));
    }
    if (list.length === 0) return { done: 0, total };

    // in Blöcken von 50 schätzen (KI-Limit), dann upserten
    let done = 0;
    for (let i = 0; i < list.length; i += 50) {
      const chunk = list.slice(i, i + 50);
      const estimates = await estimatePrices(chunk, data.market);
      const byKey = new Map(estimates.map((e) => [e.key, e]));
      const rows = chunk
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
        done += rows.length;
      }
    }
    return { done, total };
  });

/** Schätzt den Richtpreis eines Produkts für alle aktiven Märkte und speichert ihn. */
export const estimateProductPricesAllMarkets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ productId: z.string().uuid(), skipExisting: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { estimatePrices } = await import("./product-media.server");
    const sb = context.supabase;
    const { data: prod, error } = await sb.from("products").select("id, name, default_quantity, default_unit").eq("id", data.productId).single();
    if (error || !prod) throw new Error(error?.message ?? "Produkt nicht gefunden");
    const { data: mk } = await sb.from("markets").select("code, currency, enabled").eq("enabled", true).order("sort_order");
    const markets = ((mk ?? []) as Array<{ code: string; currency: string }>);
    const list = markets.length > 0 ? markets : Object.entries(CURRENCIES).map(([code, currency]) => ({ code, currency }));
    const existing = data.skipExisting ? await sb.from("product_reference_prices").select("market").eq("product_id", prod.id) : null;
    if (existing?.error) throw new Error(existing.error.message);
    const present = new Set((existing?.data ?? []).map((r) => r.market));
    const missing = list.filter((m) => !present.has(m.code));
    const results = await Promise.allSettled(missing.map(async (m) => {
      const [e] = await estimatePrices([prod as any], m.code);
      if (!e || !(e.price > 0)) throw new Error("no price");
      const row = { product_id: prod.id, market: m.code, price: e.price, currency: m.currency || CURRENCIES[m.code] || "EUR", pack_size: e.pack_size, pack_unit: e.pack_unit, unit_price: e.unit_price, unit_basis: e.unit_basis };
      const { error: ue } = await sb.from("product_reference_prices").upsert(row, { onConflict: "product_id,market" });
      if (ue) throw new Error(ue.message);
      return { market: m.code, price: row.price, currency: row.currency, unit_price: row.unit_price, unit_basis: row.unit_basis };
    }));
    const items = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    return { items, failed: results.length - items.length };
  });

/** Schätzt den Richtpreis eines Produkts für genau einen Markt — ohne zu speichern. */
export const estimateProductPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ productId: z.string().uuid(), market: z.string().min(2).max(3) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { estimatePrices } = await import("./product-media.server");
    const sb = context.supabase;
    const { data: prod, error } = await sb.from("products").select("id, name, default_quantity, default_unit").eq("id", data.productId).single();
    if (error || !prod) throw new Error(error?.message ?? "Produkt nicht gefunden");
    const { data: mk } = await sb.from("markets").select("code, currency").eq("code", data.market).maybeSingle();
    const currency = (mk?.currency as string | undefined) || CURRENCIES[data.market] || "EUR";
    const [e] = await estimatePrices([prod as any], data.market);
    if (!e || !(e.price > 0)) throw new Error("Keine Schätzung erhalten");
    return { market: data.market, price: e.price, currency, pack_size: e.pack_size, pack_unit: e.pack_unit, unit_price: e.unit_price, unit_basis: e.unit_basis };
  });

/** Richtpreise eines Markts seitenweise (für Nachladen beim Scrollen). */
export const listReferencePrices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ market: z.string().min(2).max(3), q: z.string().default(""), offset: z.number().int().min(0).default(0), limit: z.number().int().min(1).max(100).default(30) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const q = data.q.trim();
    let query = context.supabase
      .from("product_reference_prices")
      .select("id, price, currency, pack_size, pack_unit, unit_price, unit_basis, observed_at, products!inner(name, departments(name))")
      .eq("market", data.market)
      .order("name", { referencedTable: "products" })
      .range(data.offset, data.offset + data.limit);
    if (q) query = query.ilike("products.name", `%${q}%`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const all = ((rows ?? []) as any[]).map((r) => ({
      id: r.id as string, name: (r.products?.name ?? "") as string, dept: (r.products?.departments?.name ?? "") as string, price: Number(r.price), currency: r.currency as string,
      pack_size: r.pack_size as number | null, pack_unit: r.pack_unit as string | null,
      unit_price: r.unit_price == null ? null : Number(r.unit_price), unit_basis: r.unit_basis as string | null, observed_at: r.observed_at as string,
    }));
    return { items: all.slice(0, data.limit), hasMore: all.length > data.limit };
  });
