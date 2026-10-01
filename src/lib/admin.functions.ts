import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TRANSLATED_LOCALES } from "@/i18n";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Kein Admin-Zugriff");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: m } = await context.supabase.from("market_admins").select("market").eq("user_id", context.userId);
    return { isAdmin: Boolean(data), userId: context.userId, markets: ((m ?? []) as Array<{ market: string }>).map((r) => r.market) };
  });

/**
 * Ergänzt fehlende (nicht manuell bearbeitete) Übersetzungen per KI.
 * Mit `ids` nur für diese Einträge; sonst für den ganzen Katalog (max. `limit` Namen je Sprache pro Aufruf).
 */
export const translateMissing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).optional(), limit: z.number().int().min(1).max(200).default(120) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { translateNames } = await import("./translate.server");
    const sb = context.supabase;

    const [deps, prods] = await Promise.all([
      sb.from("departments").select("id, name"),
      (async () => { const all: Array<{ id: string; name: string }> = []; for (let f = 0; ; f += 1000) { const r = await sb.from("products").select("id, name").order("id").range(f, f + 999); all.push(...(r.data ?? [])); if (!r.data || r.data.length < 1000) break; } return { data: all }; })(),
    ]);
    type E = { id: string; name: string; type: "department" | "product" };
    let entities: E[] = [
      ...((deps.data ?? []) as Array<{ id: string; name: string }>).map((d) => ({ ...d, type: "department" as const })),
      ...((prods.data ?? []) as Array<{ id: string; name: string }>).map((p) => ({ ...p, type: "product" as const })),
    ];
    if (data.ids) entities = entities.filter((e) => data.ids!.includes(e.id));

    const existing = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data: rows } = await sb.from("catalog_translations").select("entity_id, locale").order("id").range(from, from + 999);
      for (const r of rows ?? []) existing.add(`${r.entity_id}|${r.locale}`);
      if (!rows || rows.length < 1000) break;
    }

    let written = 0;
    let remaining = 0;
    await Promise.all(
      TRANSLATED_LOCALES.map(async (locale) => {
        const missing = entities.filter((e) => !existing.has(`${e.id}|${locale}`));
        const batch = missing.slice(0, data.limit);
        remaining += missing.length - batch.length;
        if (batch.length === 0) return;
        const names = Object.fromEntries(batch.map((e) => [e.id, e.name]));
        const result = await translateNames(names, locale);
        const rows = batch
          .filter((e) => result[e.id])
          .map((e) => ({ entity_type: e.type, entity_id: e.id, locale, name: result[e.id]!, is_manual: false }));
        if (rows.length) {
          const { error } = await sb.from("catalog_translations").upsert(rows, { onConflict: "entity_type,entity_id,locale", ignoreDuplicates: true });
          if (error) throw new Error(error.message);
          written += rows.length;
        }
      }),
    );
    return { written, remaining };
  });

/** Überschrift in einer Kategorie anlegen/ändern (nur Admins); Name wird in alle Sprachen übersetzt. */
export const saveHeading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      departmentId: z.string().uuid(),
      beforeProductId: z.string().uuid(),
      name: z.string().trim().min(1).max(80).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    let id = data.id;
    if (id) {
      const patch: { department_id: string; before_product_id: string; name?: string } = { department_id: data.departmentId, before_product_id: data.beforeProductId };
      if (data.name) patch.name = data.name;
      const { error } = await sb.from("product_headings").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      if (!data.name) throw new Error("Name fehlt");
      const { data: row, error } = await sb
        .from("product_headings")
        .insert({ department_id: data.departmentId, before_product_id: data.beforeProductId, name: data.name })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      id = row.id as string;
    }
    if (data.name) {
      const { translateNames } = await import("./translate.server");
      const name = data.name;
      const { data: manual } = await sb.from("catalog_translations").select("locale").eq("entity_id", id).eq("is_manual", true);
      const skip = new Set(((manual ?? []) as Array<{ locale: string }>).map((m) => m.locale));
      const rows = (
        await Promise.all(
          TRANSLATED_LOCALES.filter((l) => !skip.has(l)).map(async (locale) => {
            try {
              const r = await translateNames({ [id!]: name }, locale);
              return r[id!] ? [{ entity_type: "heading", entity_id: id!, locale, name: r[id!]!, is_manual: false }] : [];
            } catch { return []; }
          }),
        )
      ).flat();
      if (rows.length) await sb.from("catalog_translations").upsert(rows, { onConflict: "entity_type,entity_id,locale" });
    }
    return { id };
  });

export const deleteHeading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("product_headings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("catalog_translations").delete().eq("entity_id", data.id);
    return { ok: true };
  });

const ctxSchema = z.object({
  path: z.string().max(300),
  existing: z.array(z.string().max(120)).max(400),
  exclude: z.array(z.string().max(120)).max(400).default([]),
  market: z.string().regex(/^[A-Z]{2}$/).optional(),
});

/** KI-Vorschläge für fehlende, relevante Produkte einer Kategorie. */
export const suggestProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ctxSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (data.market) {
      const { data: a } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      const { data: m } = a ? { data: true } : await context.supabase.rpc("is_market_admin", { _user_id: context.userId, _market: data.market });
      if (!m) throw new Error("Kein Admin-Zugriff");
    } else await assertAdmin(context);
    const { aiJson } = await import("./translate.server");
    const mkText = data.market
      ? `Zielmarkt: Land mit ISO-Code ${data.market}. Schlage Produkte vor, die in Supermärkten DIESES Landes typisch und relevant sind, sortiert nach Relevanz in diesem Land (lokale Spezialitäten und Marken-Klassiker eingeschlossen). ` +
        "scope: 'market', wenn das Produkt typisch nur für diesen Markt ist, sonst 'global'. "
      : "scope: immer 'global'. ";
    const r = await aiJson<{ items: Array<{ name: string; emoji: string; reason: string; scope: "global" | "market" }> }>(
      mkText + "Du kuratierst den Katalog einer deutschsprachigen Einkaufslisten-App (Schweiz/Deutschland/Österreich). " +
        "Schlage 8–15 relevante Produkte vor, die in der genannten Kategorie FEHLEN und die Kundinnen im Supermarkt typischerweise kaufen. " +
        "Keine Duplikate, keine Synonyme bereits vorhandener Einträge, keine Einträge aus der Ausschlussliste, kein 'Beliebige'-Präfix. " +
        "Deutsche Namen (de-DE), kurz, wie im Regal. Sortiert nach Relevanz. emoji: ein passendes Emoji. reason: max. 6 Wörter.",
      JSON.stringify({ kategorie: data.path, vorhanden: data.existing, ausschliessen: data.exclude }),
      "suggestions",
      {
        type: "object", additionalProperties: false, required: ["items"],
        properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "emoji", "reason", "scope"],
          properties: { name: { type: "string" }, emoji: { type: "string" }, reason: { type: "string" }, scope: { type: "string", enum: ["global", "market"] } } } } },
      },
    );
    const have = new Set([...data.existing, ...data.exclude].map((n) => n.toLowerCase()));
    return { items: r.items.filter((x) => x.name.trim() && !have.has(x.name.trim().toLowerCase())).map((x) => ({ ...x, name: x.name.trim(), scope: data.market && x.scope === "market" ? "market" as const : "global" as const })) };
  });

/** KI-Relevanz-Sortierung: pro Gruppe (Überschrift) die Namen nach Relevanz ordnen. */
export const rankProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    path: z.string().max(300),
    criterion: z.enum(["popularity", "alphabetical", "price", "similarity"]).default("popularity"),
    groups: z.array(z.array(z.string().max(120)).max(300)).max(40),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson } = await import("./translate.server");
    const crit = {
      popularity: "nach Relevanz: am häufigsten gekaufte Klassiker zuerst, Spezialitäten und Nischenprodukte zuletzt",
      alphabetical: "alphabetisch",
      price: "nach typischem Preis, günstig zuerst",
      similarity: "nach Ähnlichkeit: Produkte derselben Sorte oder Art direkt hintereinander gruppieren (z. B. alle Apfelsorten, alle Vollkorn-Varianten), innerhalb einer Gruppe die bekannteren zuerst",
    }[data.criterion];
    const r = await aiJson<{ groups: string[][] }>(
      `Sortiere die Produkte einer Einkaufslisten-Kategorie ${crit}. Jede Gruppe wird separat sortiert, Gruppenreihenfolge bleibt. ` +
        "Gib exakt dieselben Namen zurück (keine hinzufügen, keine entfernen, nicht umschreiben).",
      JSON.stringify({ kategorie: data.path, gruppen: data.groups }),
      "ranking",
      { type: "object", additionalProperties: false, required: ["groups"],
        properties: { groups: { type: "array", items: { type: "array", items: { type: "string" } } } } },
    );
    // Absicherung: nur bekannte Namen, fehlende hinten anhängen
    return {
      groups: data.groups.map((g, i) => {
        const out = (r.groups[i] ?? []).filter((n, k, a) => g.includes(n) && a.indexOf(n) === k);
        return [...out, ...g.filter((n) => !out.includes(n))];
      }),
    };
  });

/** Rezept-Zutaten eines Schritts nach Beliebtheit oder Relevanz ordnen (KI, nur Admins). */
export const sortRecipeIngredients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    recipe: z.string().max(80),
    step: z.string().max(80),
    criterion: z.enum(["popularity", "relevance"]),
    names: z.array(z.string().max(120)).max(800),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson } = await import("./translate.server");
    const crit = data.criterion === "popularity"
      ? "nach Beliebtheit: Zutaten, die für dieses Gericht am häufigsten verwendet werden, zuerst; seltene zuletzt"
      : "nach Relevanz: Zutaten, die am besten zu diesem Schritt und dieser Rezept-Kategorie passen, zuerst; unpassende zuletzt";
    const r = await aiJson<{ names: string[] }>(
      `Sortiere die Zutaten für den Schritt „${data.step}" im Rezept „${data.recipe}" ${crit}. ` +
        "Gib exakt dieselben Namen zurück (keine hinzufügen, keine entfernen, nicht umschreiben).",
      JSON.stringify({ zutaten: data.names }),
      "recipe_ranking",
      { type: "object", additionalProperties: false, required: ["names"],
        properties: { names: { type: "array", items: { type: "string" } } } },
    );
    const out = (r.names ?? []).filter((n, k, a) => data.names.includes(n) && a.indexOf(n) === k);
    return { names: [...out, ...data.names.filter((n) => !out.includes(n))] };
  });

/** Länderküche anlegen/ändern (nur Admins); Name wird in alle Sprachen übersetzt (manuelle bleiben). */
export const saveCuisine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(60), emoji: z.string().max(16).nullable(), sortOrder: z.number().int().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    let id = data.id;
    let renamed = true;
    if (id) {
      const { data: prev } = await sb.from("cuisines").select("name").eq("id", id).single();
      renamed = prev?.name !== data.name;
      const { error } = await sb.from("cuisines").update({ name: data.name, emoji: data.emoji }).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await sb.from("cuisines").insert({ name: data.name, emoji: data.emoji, sort_order: data.sortOrder ?? 999 }).select("id").single();
      if (error) throw new Error(error.message);
      id = row.id as string;
    }
    if (renamed) {
      const { translateNames } = await import("./translate.server");
      const { data: manual } = await sb.from("catalog_translations").select("locale").eq("entity_id", id).eq("is_manual", true);
      const skip = new Set(((manual ?? []) as Array<{ locale: string }>).map((m) => m.locale));
      const rows = (
        await Promise.all(
          TRANSLATED_LOCALES.filter((l) => !skip.has(l)).map(async (locale) => {
            try {
              const r = await translateNames({ [id!]: `${data.name} (Küche)` }, locale);
              const n = r[id!]?.replace(/\s*\([^)]*\)\s*$/, "").trim();
              return n ? [{ entity_type: "cuisine", entity_id: id!, locale, name: n, is_manual: false }] : [];
            } catch { return []; }
          }),
        )
      ).flat();
      if (rows.length) await sb.from("catalog_translations").upsert(rows, { onConflict: "entity_type,entity_id,locale" });
    }
    return { id };
  });

export const deleteCuisine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("cuisines").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await context.supabase.from("catalog_translations").delete().eq("entity_id", data.id);
    return { ok: true };
  });

/** KI schlägt aus einer Kandidatenliste Produkte vor, die in einer Küche typisch sind. */
export const suggestCuisineProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ cuisine: z.string().max(60), candidates: z.array(z.object({ id: z.string(), name: z.string().max(120), path: z.string().max(200) })).max(400) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson } = await import("./translate.server");
    const list = data.candidates.map((c, i) => ({ i, name: c.name, kategorie: c.path }));
    const r = await aiJson<{ picks: number[] }>(
      `Wähle aus der Liste die Supermarkt-Produkte, die in der Küche „${data.cuisine}" typische, gebräuchliche Zutaten sind. Non-Food nie. Gib nur die Indizes zurück.`,
      JSON.stringify(list),
      "picks",
      { type: "object", additionalProperties: false, required: ["picks"], properties: { picks: { type: "array", items: { type: "integer" } } } },
    );
    return { ids: (r.picks ?? []).map((i) => data.candidates[i]?.id).filter((x): x is string => Boolean(x)) };
  });

export const suggestBrands = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ products: z.array(z.object({ id: z.string(), name: z.string().max(120), path: z.string().max(200) })).min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson } = await import("./translate.server");
    const list = data.products.map((p, i) => ({ i, name: p.name, kategorie: p.path }));
    const r = await aiJson<{ items: { i: number; brands: { name: string; markets: string[] }[] }[] }>(
      `Du bist Experte für Supermarkt-Sortimente. Nenne für jedes Produkt die 0–5 bekanntesten, verbreiteten Handelsmarken, unter denen Kunden das Produkt kennen (z. B. Schoko-Haselnuss-Creme → Nutella; Kokos-Schoko-Riegel → Bounty; Papiertaschentücher → Tempo). Nur echte, im Supermarkt erhältliche Marken, keine Eigenmarken von Händlern. Generische Frischware (Obst, Gemüse, Fleisch, Brot) und Produkte ohne prägende Marke → leere Liste. markets: Ländercodes aus DE, AT, CH, US, GB, CA, ES, MX, FR, IT, PT, BR, NL, BE, in denen die Marke verbreitet ist; leeres Array wenn praktisch überall erhältlich.`,
      JSON.stringify(list),
      "brands",
      { type: "object", additionalProperties: false, required: ["items"], properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["i", "brands"], properties: { i: { type: "integer" }, brands: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "markets"], properties: { name: { type: "string" }, markets: { type: "array", items: { type: "string" } } } } } } } } } },
    );
    return { items: (r.items ?? []).map((it) => ({ productId: data.products[it.i]?.id ?? "", brands: it.brands })).filter((x) => x.productId) };
  });

/** Rezept-Kategorie anlegen/ändern (nur Admins); Name wird in alle Sprachen übersetzt (manuelle bleiben). */
export const saveRecipeGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid().optional(),
      parentId: z.string().uuid().nullable().optional(),
      name: z.string().trim().min(1).max(60),
      emoji: z.string().max(16).nullable(),
      sortOrder: z.number().int().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    let id = data.id;
    let renamed = true;
    if (id) {
      const { data: prev } = await sb.from("recipe_groups").select("name").eq("id", id).single();
      renamed = prev?.name !== data.name;
      const { error } = await sb.from("recipe_groups").update({ name: data.name, emoji: data.emoji }).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: row, error } = await sb
        .from("recipe_groups")
        .insert({ name: data.name, emoji: data.emoji, parent_id: data.parentId ?? null, sort_order: data.sortOrder ?? 999 })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      id = row.id as string;
    }
    if (renamed) {
      const { translateNames } = await import("./translate.server");
      const { data: manual } = await sb.from("catalog_translations").select("locale").eq("entity_id", id).eq("is_manual", true);
      const skip = new Set(((manual ?? []) as Array<{ locale: string }>).map((m) => m.locale));
      const rows = (
        await Promise.all(
          TRANSLATED_LOCALES.filter((l) => !skip.has(l)).map(async (locale) => {
            try {
              const r = await translateNames({ [id!]: `${data.name} (Zutaten-Kategorie)` }, locale);
              const n = r[id!]?.replace(/\s*\([^)]*\)\s*$/, "").trim();
              return n ? [{ entity_type: "recipe_group", entity_id: id!, locale, name: n, is_manual: false }] : [];
            } catch { return []; }
          }),
        )
      ).flat();
      if (rows.length) await sb.from("catalog_translations").upsert(rows, { onConflict: "entity_type,entity_id,locale" });
    }
    return { id };
  });

export const deleteRecipeGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: kids } = await sb.from("recipe_groups").select("id").eq("parent_id", data.id);
    const ids = [data.id, ...((kids ?? []) as Array<{ id: string }>).map((k) => k.id)];
    const { error } = await sb.from("recipe_groups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await sb.from("catalog_translations").delete().in("entity_id", ids);
    return { ok: true };
  });

const marketSchema = z.string().regex(/^[A-Z]{2}$/);

/** Markt-Admin per E-Mail zuweisen (nur Haupt-Admin). */
export const addMarketAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(200), market: marketSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    let userId: string | null = null;
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data: res, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      userId = res.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (res.users.length < 200) break;
    }
    if (!userId) throw new Error("Kein Konto mit dieser E-Mail gefunden");
    const { error } = await context.supabase.from("market_admins").upsert({ user_id: userId, email, market: data.market }, { onConflict: "user_id,market", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Name eines Marktprodukts in alle Sprachen übersetzen (Haupt- oder zuständiger Markt-Admin). */
export const translateMarketProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: p } = await sb.from("products").select("name, markets").eq("id", data.id).single();
    if (!p) throw new Error("Produkt nicht gefunden");
    const { data: main } = await sb.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const markets = (p.markets ?? []) as string[];
    if (!main) {
      if (markets.length !== 1) throw new Error("Kein Zugriff");
      const { data: ok } = await sb.rpc("is_market_admin", { _user_id: context.userId, _market: markets[0]! });
      if (!ok) throw new Error("Kein Zugriff");
    }
    const { translateNames } = await import("./translate.server");
    const rows = (await Promise.all(TRANSLATED_LOCALES.map(async (locale) => {
      try { const r = await translateNames({ [data.id]: p.name }, locale); return r[data.id] ? [{ entity_type: "product", entity_id: data.id, locale, name: r[data.id]!, is_manual: false }] : []; } catch { return []; }
    }))).flat();
    if (rows.length) await sb.from("catalog_translations").upsert(rows, { onConflict: "entity_type,entity_id,locale" });
    return { written: rows.length };
  });

/** Varianten eines Produkts (oder aller Produkte) in alle Sprachen übersetzen; vorhandene Übersetzungen bleiben. */
export const translateVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ productId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: main } = await sb.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!main) {
      if (!data.productId) throw new Error("Kein Admin-Zugriff");
      const { data: ok } = await sb.rpc("is_market_product_admin", { _product_id: data.productId, _user_id: context.userId });
      if (!ok) throw new Error("Kein Zugriff");
    }
    let q = sb.from("products").select("id, variants").not("variants", "eq", "{}");
    if (data.productId) q = q.eq("id", data.productId);
    const { data: prods } = await q;
    const { data: existing } = await sb.from("variant_translations").select("product_id, variant, locale");
    const have = new Set(((existing ?? []) as Array<{ product_id: string; variant: string; locale: string }>).map((r) => `${r.product_id}|${r.variant}|${r.locale}`));
    const unique = [...new Set(((prods ?? []) as Array<{ variants: string[] }>).flatMap((p) => p.variants ?? []))];
    if (!unique.length) return { written: 0 };
    const { translateNames } = await import("./translate.server");
    const src = Object.fromEntries(unique.map((v, i) => [`v${i}`, v]));
    let written = 0;
    await Promise.all(TRANSLATED_LOCALES.map(async (locale) => {
      let r: Record<string, string> = {};
      try { r = await translateNames(src, locale); } catch { return; }
      const map = new Map(unique.map((v, i) => [v, r[`v${i}`]]));
      const rows = ((prods ?? []) as Array<{ id: string; variants: string[] }>).flatMap((p) => (p.variants ?? [])
        .filter((v) => map.get(v) && !have.has(`${p.id}|${v}|${locale}`))
        .map((v) => ({ product_id: p.id, variant: v, locale, name: map.get(v)!, is_manual: false })));
      if (rows.length) { const { error } = await sb.from("variant_translations").upsert(rows, { onConflict: "product_id,variant,locale", ignoreDuplicates: true }); if (!error) written += rows.length; }
    }));
    return { written };
  });
