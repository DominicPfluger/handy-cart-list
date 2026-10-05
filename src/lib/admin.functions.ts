import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TRANSLATED_LOCALES as BUILTIN_LOCALES } from "@/i18n";

/** Eingebaute + im Admin angelegte Zielsprachen. */
async function targetLocales(sb: any): Promise<string[]> {
  const { data } = await sb.from("app_locales").select("id");
  return [...new Set([...BUILTIN_LOCALES, ...((data ?? []) as Array<{ id: string }>).map((r) => r.id)])];
}

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

    type E = { id: string; name: string; type: "department" | "product" };
    let entities: E[];
    const existing = new Set<string>();
    if (data.ids) {
      // Gezielt: nur die angefragten Einträge und deren Übersetzungen laden (schnell)
      const ids = data.ids.length ? data.ids : ["00000000-0000-0000-0000-000000000000"];
      const [deps, prods, tr] = await Promise.all([
        sb.from("departments").select("id, name").in("id", ids),
        sb.from("products").select("id, name").in("id", ids),
        sb.from("catalog_translations").select("entity_id, locale").in("entity_id", ids),
      ]);
      entities = [
        ...((deps.data ?? []) as Array<{ id: string; name: string }>).map((d) => ({ ...d, type: "department" as const })),
        ...((prods.data ?? []) as Array<{ id: string; name: string }>).map((p) => ({ ...p, type: "product" as const })),
      ];
      for (const r of tr.data ?? []) existing.add(`${r.entity_id}|${r.locale}`);
    } else {
      const [deps, prods] = await Promise.all([
        sb.from("departments").select("id, name"),
        (async () => { const all: Array<{ id: string; name: string }> = []; for (let f = 0; ; f += 1000) { const r = await sb.from("products").select("id, name").order("id").range(f, f + 999); all.push(...(r.data ?? [])); if (!r.data || r.data.length < 1000) break; } return { data: all }; })(),
      ]);
      entities = [
        ...((deps.data ?? []) as Array<{ id: string; name: string }>).map((d) => ({ ...d, type: "department" as const })),
        ...((prods.data ?? []) as Array<{ id: string; name: string }>).map((p) => ({ ...p, type: "product" as const })),
      ];
      for (let from = 0; ; from += 1000) {
        const { data: rows } = await sb.from("catalog_translations").select("entity_id, locale").order("id").range(from, from + 999);
        for (const r of rows ?? []) existing.add(`${r.entity_id}|${r.locale}`);
        if (!rows || rows.length < 1000) break;
      }
    }

    let written = 0;
    let remaining = 0;
    await Promise.all(
      (await targetLocales(context.supabase)).map(async (locale) => {
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
          (await targetLocales(context.supabase)).filter((l) => !skip.has(l)).map(async (locale) => {
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
  mode: z.enum(["web", "ai"]).default("ai"),
  count: z.number().int().min(5).max(25).default(15),
});

/** Websuche (Firecrawl) nach Shop-Seiten zur Kategorie; liefert gekürzten Text + Quellen. */
async function webContext(path: string, market: string): Promise<{ text: string; ok: boolean }> {
  const lovable = process.env["LOVABLE_API_KEY"];
  const fc = process.env["FIRECRAWL_API_KEY"];
  if (!lovable || !fc) return { text: "", ok: false };
  const leaf = path.split("›").map((s) => s.trim()).filter(Boolean).slice(-2).join(" ");
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": fc },
      body: JSON.stringify({ query: `${leaf} Supermarkt Sortiment online kaufen ${market}`, limit: 5, scrapeOptions: { formats: ["markdown"], onlyMainContent: true } }),
    });
    if (!res.ok) { console.error("Firecrawl search", res.status, await res.text()); return { text: "", ok: false }; }
    const j = (await res.json()) as { data?: { web?: Array<{ url?: string; title?: string; markdown?: string }> } | Array<{ url?: string; title?: string; markdown?: string }> };
    const list = Array.isArray(j.data) ? j.data : (j.data?.web ?? []);
    const parts = list.map((r) => {
      let host = ""; try { host = new URL(r.url ?? "").hostname.replace(/^www\./, ""); } catch { /* */ }
      return `### Quelle: ${host}\n${(r.markdown ?? r.title ?? "").slice(0, 7000)}`;
    }).filter((s) => s.length > 30);
    const text = parts.join("\n\n").slice(0, 30000);
    return { text, ok: text.length > 200 };
  } catch (e) { console.error(e); return { text: "", ok: false }; }
}

/** KI-Vorschläge für fehlende, relevante Produkte einer Kategorie (optional mit Websuche). */
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
    const web = data.mode === "web" ? await webContext(data.path, data.market ?? "DE") : { text: "", ok: false };
    const webFailed = data.mode === "web" && !web.ok;
    const mkText = data.market
      ? `Zielmarkt: Land mit ISO-Code ${data.market}. Schlage Produkte vor, die in Supermärkten DIESES Landes typisch und relevant sind, sortiert nach Relevanz in diesem Land (lokale Spezialitäten und Marken-Klassiker eingeschlossen). ` +
        "scope: 'market', wenn das Produkt typisch nur für diesen Markt ist, sonst 'global'. "
      : "scope: immer 'global'. ";
    const webText = web.ok
      ? "Unter 'web' findest du Auszüge aus Online-Shops. Leite die Vorschläge vorrangig daraus ab (generische Produktnamen, keine Marken, keine Packungsgrössen). source: Domain der Quelle, oder leer wenn nicht aus dem Web. "
      : "source: immer leer. ";
    const r = await aiJson<{ items: Array<{ name: string; emoji: string; reason: string; scope: "global" | "market"; source: string }> }>(
      mkText + webText + "Du kuratierst den Katalog einer deutschsprachigen Einkaufslisten-App (Schweiz/Deutschland/Österreich). " +
        `Schlage ${data.count} relevante Produkte vor, die in der genannten Kategorie FEHLEN und die Kundinnen im Supermarkt typischerweise kaufen. Sie müssen thematisch genau zur Kategorie passen. ` +
        "Keine Duplikate, keine Synonyme bereits vorhandener Einträge, keine Einträge aus der Ausschlussliste, kein 'Beliebige'-Präfix. " +
        "Deutsche Namen (de-DE), kurz, wie im Regal. Sortiert nach Relevanz. emoji: ein passendes Emoji. reason: max. 6 Wörter.",
      JSON.stringify({ kategorie: data.path, vorhanden: data.existing, ausschliessen: data.exclude, ...(web.ok ? { web: web.text } : {}) }),
      "suggestions",
      {
        type: "object", additionalProperties: false, required: ["items"],
        properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "emoji", "reason", "scope", "source"],
          properties: { name: { type: "string" }, emoji: { type: "string" }, reason: { type: "string" }, scope: { type: "string", enum: ["global", "market"] }, source: { type: "string" } } } } },
      },
    );
    const have = new Set([...data.existing, ...data.exclude].map((n) => n.toLowerCase()));
    return {
      webFailed,
      items: r.items.filter((x) => x.name.trim() && !have.has(x.name.trim().toLowerCase())).map((x) => ({ ...x, name: x.name.trim(), source: x.source?.trim() || undefined, scope: data.market && x.scope === "market" ? "market" as const : "global" as const })),
    };
  });

/** KI-Vorschläge für Varianten eines Produkts (ohne bereits vorhandene). */
export const suggestVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ productId: z.string().uuid(), count: z.number().int().min(1).max(25).default(10) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: prod } = await context.supabase.from("products").select("name, variants, department_id").eq("id", data.productId).single();
    if (!prod) throw new Error("Produkt nicht gefunden");
    const path: string[] = [];
    let dep: string | null = prod.department_id;
    for (let i = 0; dep && i < 5; i++) {
      const { data: d }: { data: { name: string; parent_id: string | null } | null } = await context.supabase.from("departments").select("name, parent_id").eq("id", dep).single();
      if (!d) break;
      path.unshift(d.name); dep = d.parent_id;
    }
    const existing: string[] = prod.variants ?? [];
    const { aiJson } = await import("./translate.server");
    const r = await aiJson<{ items: Array<{ name: string }> }>(
      "Du kuratierst den Katalog einer deutschsprachigen Einkaufslisten-App. " +
        `Schlage ${data.count} typische Varianten für das genannte Produkt vor (z. B. Sorte, Geschmack, Farbe, Ausführung, Fettstufe), wie sie im Supermarkt erhältlich sind. ` +
        "Nur die Variantenbezeichnung (kurz, 1–3 Wörter, Deutsch de-DE), ohne den Produktnamen zu wiederholen, keine Marken, keine Packungsgrössen, keine bereits vorhandenen Varianten oder Synonyme davon. Sortiert nach Relevanz.",
      JSON.stringify({ produkt: prod.name, kategorie: path.join(" › "), vorhanden: existing }),
      "variants",
      { type: "object", additionalProperties: false, required: ["items"], properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["name"], properties: { name: { type: "string" } } } } } },
    );
    const have = new Set(existing.map((v) => v.toLowerCase()));
    const out: string[] = [];
    for (const x of r.items) {
      const n = x.name.trim();
      if (n && !have.has(n.toLowerCase())) { have.add(n.toLowerCase()); out.push(n); }
    }
    return { items: out.slice(0, data.count) };
  });

/** KI-Vorschlag für den Bildtext (hint) eines Kategorie-Bildes, abgeleitet aus den Produkten der Kategorie. */
export const suggestImagePrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ departmentId: z.string().uuid(), productIds: z.array(z.string().uuid()).max(60).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: dept } = await context.supabase.from("departments").select("name, emoji, parent_id").eq("id", data.departmentId).single();
    const { data: prods } = data.productIds?.length
      ? await context.supabase.from("products").select("name").in("id", data.productIds)
      : await context.supabase.from("products").select("name").eq("department_id", data.departmentId).order("sort_order").limit(30);
    if (!dept || !prods?.length) return { prompt: "" };
    // Kategorie-Kontext: Überkategorie, Unterkategorien und Geschwister miteinbeziehen,
    // damit der Vorschlag die aktuelle Kategorie klar von ihren Nachbarn abgrenzt.
    const [{ data: parent }, { data: children }, { data: siblings }] = await Promise.all([
      dept.parent_id
        ? context.supabase.from("departments").select("name").eq("id", dept.parent_id).single()
        : Promise.resolve({ data: null }),
      context.supabase.from("departments").select("name").eq("parent_id", data.departmentId).order("sort_order").limit(40),
      dept.parent_id
        ? context.supabase.from("departments").select("name").eq("parent_id", dept.parent_id).neq("id", data.departmentId).order("sort_order").limit(40)
        : Promise.resolve({ data: null }),
    ]);
    const { aiJson } = await import("./translate.server");
    const r = await aiJson<{ prompt: string }>(
      "Du erstellst Bildbeschreibungen für Kategorie-Bilder einer Einkaufslisten-App. " +
        "Formuliere aus Kategoriename und enthaltenen Produkten eine kurze, bildbeschreibende Stichwort-Zeile (max. 120 Zeichen, Deutsch): " +
        "die typischsten Produkte nennen, Stil: appetitliches Produktfoto, heller einfarbiger Hintergrund. Nur die Zeile, keine Erklärung. " +
        "Beachte den Kategorie-Kontext: Die Beschreibung soll zum Thema der Überkategorie passen und die Kategorie klar von ihren Geschwister-Kategorien abgrenzen (nicht deren typische Produkte zeigen).",
      JSON.stringify({
        kategorie: dept.name,
        ueberkategorie: parent?.name ?? null,
        unterkategorien: (children ?? []).map((x) => x.name),
        geschwister: (siblings ?? []).map((x) => x.name),
        produkte: prods.map((x) => x.name),
      }),
      "image_prompt",
      { type: "object", additionalProperties: false, required: ["prompt"], properties: { prompt: { type: "string" } } },
    );
    return { prompt: r.prompt.trim().slice(0, 300) };
  });

/** KI-Relevanz-Sortierung: pro Gruppe (Überschrift) die Namen nach Relevanz ordnen. */
export const rankProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    path: z.string().max(300),
    criterion: z.enum(["popularity", "alphabetical", "price", "similarity"]).default("popularity"),
    groups: z.array(z.array(z.string().max(120)).max(300)).max(40),
    market: z.string().regex(/^[A-Z]{2}$/).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.market) {
      const { data: ok } = await context.supabase.rpc("is_market_admin", { _user_id: context.userId, _market: data.market });
      if (!ok) await assertAdmin(context);
    } else await assertAdmin(context);
    const { aiJson } = await import("./translate.server");
    const crit = {
      popularity: "nach Relevanz: am häufigsten gekaufte Klassiker zuerst, Spezialitäten und Nischenprodukte zuletzt",
      alphabetical: "alphabetisch",
      price: "nach typischem Preis, günstig zuerst",
      similarity: "nach Ähnlichkeit: Produkte derselben Sorte oder Art direkt hintereinander gruppieren (z. B. alle Apfelsorten, alle Vollkorn-Varianten), innerhalb einer Gruppe die bekannteren zuerst",
    }[data.criterion];
    const r = await aiJson<{ groups: string[][] }>(
      `Sortiere die Produkte einer Einkaufslisten-Kategorie ${crit}${data.market ? ` – bezogen auf Kaufgewohnheiten und Supermarkt-Sortiment im Land mit ISO-Code ${data.market}` : ""}. Jede Gruppe wird separat sortiert, Gruppenreihenfolge bleibt. ` +
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
          (await targetLocales(context.supabase)).filter((l) => !skip.has(l)).map(async (locale) => {
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
      templateId: z.string().min(1).max(60),
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
        .insert({ template_id: data.templateId, name: data.name, emoji: data.emoji, parent_id: data.parentId ?? null, sort_order: data.sortOrder ?? 999 })
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
          (await targetLocales(context.supabase)).filter((l) => !skip.has(l)).map(async (locale) => {
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
    const ids = [data.id];
    for (let index = 0; index < ids.length; index++) {
      const parentId = ids[index];
      if (!parentId) continue;
      const { data: kids, error: readError } = await sb.from("recipe_groups").select("id").eq("parent_id", parentId);
      if (readError) throw new Error(readError.message);
      ids.push(...((kids ?? []) as Array<{ id: string }>).map((k) => k.id));
    }
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
    const rows = (await Promise.all((await targetLocales(context.supabase)).map(async (locale) => {
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
    let q = sb.from("products").select("id, variants");
    if (data.productId) q = q.eq("id", data.productId);
    const { data: prods } = await q;
    const plist = (prods ?? []) as Array<{ id: string; variants: string[] }>;
    let eq = sb.from("variant_translations").select("id, product_id, variant, locale, is_manual");
    if (data.productId) eq = eq.eq("product_id", data.productId);
    const { data: existing } = await eq;
    const ex = (existing ?? []) as Array<{ id: string; product_id: string; variant: string; locale: string; is_manual: boolean }>;
    // Übersetzungen entfernter Varianten löschen
    const current = new Set(plist.flatMap((p) => (p.variants ?? []).map((v) => `${p.id}|${v}`)));
    const stale = ex.filter((r) => !current.has(`${r.product_id}|${r.variant}`)).map((r) => r.id);
    for (let i = 0; i < stale.length; i += 200) await sb.from("variant_translations").delete().in("id", stale.slice(i, i + 200));
    // Manuelle Übersetzungen bleiben, automatische werden ersetzt
    const manual = new Set(ex.filter((r) => r.is_manual).map((r) => `${r.product_id}|${r.variant}|${r.locale}`));
    const unique = [...new Set(plist.flatMap((p) => p.variants ?? []))];
    if (!unique.length) return { written: 0 };
    const { translateNames } = await import("./translate.server");
    const src = Object.fromEntries(unique.map((v, i) => [`v${i}`, v]));
    let written = 0;
    await Promise.all((await targetLocales(context.supabase)).map(async (locale) => {
      let r: Record<string, string> = {};
      try { r = await translateNames(src, locale); } catch { return; }
      const map = new Map(unique.map((v, i) => [v, r[`v${i}`]]));
      const rows = plist.flatMap((p) => (p.variants ?? [])
        .filter((v) => map.get(v) && !manual.has(`${p.id}|${v}|${locale}`))
        .map((v) => ({ product_id: p.id, variant: v, locale, name: map.get(v)!, is_manual: false })));
      if (rows.length) { const { error } = await sb.from("variant_translations").upsert(rows, { onConflict: "product_id,variant,locale" }); if (!error) written += rows.length; }
    }));
    return { written };
  });

// ---------- Neue Sprachen ----------
export const listAppLocales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data } = await sb.from("app_locales").select("id, label, flag, created_at").order("created_at");
    const { de } = await import("@/i18n/de");
    const total = Object.keys(de).length;
    const out = [] as Array<{ id: string; label: string; flag: string; ui: number; uiTotal: number; catalog: number }>;
    for (const l of (data ?? []) as Array<{ id: string; label: string; flag: string }>) {
      const [{ count: ui }, { count: cat }] = await Promise.all([
        sb.from("ui_translations").select("id", { count: "exact", head: true }).eq("locale", l.id),
        sb.from("catalog_translations").select("id", { count: "exact", head: true }).eq("locale", l.id),
      ]);
      out.push({ ...l, ui: ui ?? 0, uiTotal: total, catalog: cat ?? 0 });
    }
    return out;
  });

export const createAppLocale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().regex(/^[a-z]{2}-[A-Z]{2}$/), label: z.string().min(2).max(60), flag: z.string().min(1).max(16) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (BUILTIN_LOCALES.includes(data.id) || data.id === "de-DE") throw new Error("Diese Sprache gibt es schon");
    const { error } = await context.supabase.from("app_locales").upsert(data, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAppLocale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("catalog_translations").delete().eq("locale", data.id);
    await context.supabase.from("variant_translations").delete().eq("locale", data.id);
    const { error } = await context.supabase.from("app_locales").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Übersetzt die nächsten fehlenden App-Texte (max. `limit`) in die angelegte Sprache. */
export const translateUiBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ locale: z.string(), limit: z.number().int().min(10).max(200).default(150) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: loc } = await sb.from("app_locales").select("id, label").eq("id", data.locale).single();
    if (!loc) throw new Error("Sprache nicht gefunden");
    const { de } = await import("@/i18n/de");
    const have = new Set<string>();
    for (let f = 0; ; f += 1000) {
      const { data: rows } = await sb.from("ui_translations").select("key").eq("locale", data.locale).range(f, f + 999);
      for (const r of rows ?? []) have.add(r.key);
      if (!rows || rows.length < 1000) break;
    }
    const missing = Object.entries(de as Record<string, string>).filter(([k]) => !have.has(k));
    const batch = Object.fromEntries(missing.slice(0, data.limit));
    if (missing.length === 0) return { written: 0, remaining: 0 };
    const { translateUiTexts } = await import("./translate.server");
    const out = await translateUiTexts(batch, loc.id, loc.label);
    const rows = Object.entries(out).map(([key, text]) => ({ locale: loc.id, key, text }));
    if (rows.length) {
      const { error } = await sb.from("ui_translations").upsert(rows, { onConflict: "locale,key" });
      if (error) throw new Error(error.message);
    }
    return { written: rows.length, remaining: Math.max(0, missing.length - rows.length) };
  });

const SUGGEST_UNITS = ["stueck", "gramm", "kilogramm", "milliliter", "liter", "flasche", "dose", "beutel", "packung", "schachtel", "becher", "glas", "tube", "buendel", "netz", "rolle", "sixpack"];
const normName = (s: string) => s.toLowerCase().replace(/ß/g, "ss").replace(/[^a-z0-9äöüéèàç]/g, "");

/** KI schlägt typische, noch fehlende Produkte für eine Kategorie vor (Admin). */
export const suggestCategoryProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ departmentId: z.string().uuid(), keywords: z.string().max(200).optional(), exclude: z.array(z.string().max(120)).max(300).default([]), count: z.number().int().min(1).max(20).default(10) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: depts } = await sb.from("departments").select("id,name,parent_id");
    const byId = new Map(((depts ?? []) as Array<{ id: string; name: string; parent_id: string | null }>).map((d) => [d.id, d]));
    const path: string[] = [];
    let c = byId.get(data.departmentId); let g = 0;
    while (c && g++ < 20) { path.unshift(c.name); c = c.parent_id ? byId.get(c.parent_id) : undefined; }
    if (!path.length) throw new Error("Kategorie nicht gefunden");
    const deptList = [...byId.values()];
    const selfDept = byId.get(data.departmentId);
    const childTitles = deptList.filter((d) => d.parent_id === data.departmentId).map((d) => d.name);
    const siblingTitles = deptList.filter((d) => d.id !== data.departmentId && d.parent_id === (selfDept?.parent_id ?? null)).map((d) => d.name).slice(0, 40);
    const { data: here } = await sb.from("products").select("id,name").eq("department_id", data.departmentId);
    const { data: al } = await sb.from("product_aliases").select("product_id").eq("department_id", data.departmentId);
    const all: Array<{ id: string; name: string }> = [];
    for (let from = 0; ; from += 1000) {
      const { data: page } = await sb.from("products").select("id,name").range(from, from + 999);
      all.push(...((page ?? []) as Array<{ id: string; name: string }>));
      if (!page || page.length < 1000) break;
    }
    const inHere = new Set([...((here ?? []) as Array<{ id: string }>).map((r) => r.id), ...((al ?? []) as Array<{ product_id: string }>).map((r) => r.product_id)]);
    const byName = new Map(all.map((p) => [normName(p.name), p.id]));
    const existingNames = all.filter((p) => inHere.has(p.id)).map((p) => p.name);
    const { aiJson } = await import("./translate.server");
    const r = await aiJson<{ items: Array<{ name: string; emoji: string; quantity: number; unit: string; relevance: number }> }>(
      `Du pflegst den Produktkatalog einer Schweizer Einkaufslisten-App. Schlage genau ${data.count} typische, im Supermarkt übliche Produkte vor, die in der genannten Kategorie noch fehlen, abgeleitet vom Kategorie-Titel und den Titeln der Unterkategorien (klar abgegrenzt von den Nachbar-Kategorien), sortiert nach Relevanz (wie häufig im Supermarkt gekauft, häufigste zuerst). relevance: 1–100. Keine Einträge aus der Liste 'Bereits vorgeschlagen'. ` +
        "Deutsche Namen, kurz, ohne Marken, Schweizer Schreibweise (ss statt ß). Keine Duplikate oder Varianten der vorhandenen Produkte. " +
        `Ein passendes Emoji, typische Standardmenge und Einheit aus: ${SUGGEST_UNITS.join(", ")}.`,
      `Kategorie: ${path.join(" › ")}\nUnterkategorien: ${childTitles.join(", ") || "(keine)"}\nNachbar-Kategorien (deren Produkte NICHT vorschlagen): ${siblingTitles.join(", ") || "(keine)"}\nVorhanden: ${existingNames.join(", ") || "(keine)"}${data.keywords?.trim() ? `\nStichworte: ${data.keywords.trim()}` : ""}${data.exclude.length ? `\nBereits vorgeschlagen: ${data.exclude.join(", ")}` : ""}`,
      "product_suggestions",
      {
        type: "object", additionalProperties: false, required: ["items"],
        properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "emoji", "quantity", "unit", "relevance"],
          properties: { name: { type: "string" }, emoji: { type: "string" }, quantity: { type: "number" }, unit: { type: "string", enum: SUGGEST_UNITS }, relevance: { type: "number" } } } } },
      },
    );
    const seen = new Set<string>(data.exclude.map(normName));
    return [...(r.items ?? [])].sort((a, b) => (b.relevance || 0) - (a.relevance || 0)).flatMap((it) => {
      const n = it.name.trim().replace(/ß/g, "ss");
      const key = normName(n);
      if (!n || seen.has(key)) return [];
      seen.add(key);
      const existingId = byName.get(key) ?? null;
      if (existingId && inHere.has(existingId)) return [];
      return [{ name: n, emoji: it.emoji.trim() || "🛒", quantity: it.quantity > 0 ? it.quantity : 1, unit: it.unit, existingId, relevance: Math.max(1, Math.min(100, Math.round(it.relevance || 50))) }];
    });
  });

/** Führt ein Dublett-Produkt in ein Zielprodukt zusammen: Verweise umbiegen, Name als Synonym übernehmen, Quelle löschen. */
export const mergeProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => z.object({ keepId: z.string().uuid(), removeId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.keepId === data.removeId) throw new Error("Gleiche Produkte");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: src } = await sb.from("products").select("id, name").eq("id", data.removeId).single();
    if (!src) throw new Error("Quellprodukt nicht gefunden");
    // Verweise auf das Zielprodukt umbiegen (Konflikte werden ignoriert)
    for (const table of ["list_items", "pantry_items", "product_aliases", "product_brands", "product_cuisines", "product_reference_prices", "product_market_order", "product_market_exclusions", "recipe_ingredients", "import_candidates"]) {
      const col = table === "import_candidates" ? "match_product_id" : "product_id";
      await sb.from(table).update({ [col]: data.keepId }).eq(col, data.removeId);
    }
    // Fehlende Übersetzungen übernehmen
    const { data: srcTr } = await sb.from("catalog_translations").select("locale, name, is_manual").eq("entity_type", "product").eq("entity_id", data.removeId);
    const { data: dstTr } = await sb.from("catalog_translations").select("locale").eq("entity_type", "product").eq("entity_id", data.keepId);
    const have = new Set((dstTr ?? []).map((r: any) => r.locale));
    for (const t of srcTr ?? []) {
      if (!have.has(t.locale)) await sb.from("catalog_translations").insert({ entity_type: "product", entity_id: data.keepId, locale: t.locale, name: t.name, is_manual: t.is_manual });
    }
    // Synonyme der Quelle + deren Name als Synonyme des Ziels übernehmen
    const { data: srcSyn } = await sb.from("product_synonyms").select("locale, term").eq("product_id", data.removeId);
    const terms = [...(srcSyn ?? []), { locale: "de-DE", term: src.name }];
    for (const s of terms) {
      await sb.from("product_synonyms").upsert({ product_id: data.keepId, locale: s.locale, term: s.term }, { onConflict: "product_id,locale,lower(term)", ignoreDuplicates: true });
    }
    const { error } = await sb.from("products").delete().eq("id", data.removeId);
    if (error) throw new Error(error.message);
    return { merged: src.name as string };
  });

// ============= Sicherung vor Massenänderungen =============

type BackupGroup = { table: string; filterColumn: string; filterIds: string[]; rows: Record<string, unknown>[] };
type BackupPayload = { deletes?: BackupGroup[]; created?: { table: string; ids: string[] }[] };
type LooseResult = { data: Record<string, unknown>[] | null; error: { message: string } | null };
/** Dynamische Tabellennamen (Sicherungsdaten) entgehen so der strikten Typprüfung. */
type LooseTable = {
  select(c: string): { in(c: string, v: string[]): PromiseLike<LooseResult> };
  delete(): { in(c: string, v: string[]): PromiseLike<LooseResult> };
  insert(rows: Record<string, unknown>[]): PromiseLike<LooseResult>;
};
const loose = (sb: { from(t: string): unknown }) => sb as unknown as { from(t: string): LooseTable };

/** Vor einer Massenlöschung die betroffenen Zeilen sichern (null = nichts zu löschen). */
export const createBulkBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      label: z.string().min(1).max(200),
      deletes: z.array(z.object({
        table: z.string().min(1).max(64),
        filterColumn: z.string().min(1).max(64),
        filterIds: z.array(z.string().uuid()).min(1).max(500),
      })).max(10),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const deletes: BackupGroup[] = [];
    for (const g of data.deletes) {
      const { data: rows, error } = await loose(sb).from(g.table).select("*").in(g.filterColumn, g.filterIds);
      if (error) throw new Error(error.message);
      if (rows?.length) deletes.push({ table: g.table, filterColumn: g.filterColumn, filterIds: g.filterIds, rows });
    }
    if (!deletes.length) return null;
    const { data: row, error } = await sb
      .from("admin_backups")
      .insert({ user_id: context.userId, label: data.label, payload: { deletes } as never })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return (row as { id: string }).id;
  });

/** Sicherungspunkt zurücknehmen: gelöschte Zeilen wiederherstellen, neu angelegte entfernen. */
export const undoBulkBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: row, error } = await sb.from("admin_backups").select("payload").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    const payload = ((row as { payload: BackupPayload } | null)?.payload ?? {}) as BackupPayload;
    // Neu angelegte Einträge entfernen (Produkte inkl. ihrer Übersetzungen)
    for (const c of payload.created ?? []) {
      if (c.table === "products") await sb.from("catalog_translations").delete().in("entity_id", c.ids);
      const { error: e } = await loose(sb).from(c.table).delete().in("id", c.ids);
      if (e) throw new Error(e.message);
    }
    // Gelöschte Originalzeilen wiederherstellen
    for (const g of payload.deletes ?? []) {
      if (!g.rows?.length) continue;
      await loose(sb).from(g.table).delete().in(g.filterColumn, g.filterIds);
      const { error: e } = await loose(sb).from(g.table).insert(g.rows);
      if (e) throw new Error(e.message);
    }
    const { error: delErr } = await sb.from("admin_backups").delete().eq("id", data.id);
    if (delErr) throw new Error(delErr.message);
    return { ok: true };
  });

// ============= Marktdaten importieren =============

/** Marktpreise, Reihenfolge und Sichtbarkeit je Markt aus eingefügten Zeilen übernehmen. */
export const importMarketData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      market: z.string().length(2),
      currency: z.string().min(1).max(8),
      rows: z.array(z.object({
        productId: z.string().uuid(),
        price: z.number().positive().nullable(),
        sortOrder: z.number().int().min(0).max(9999).nullable(),
        hidden: z.boolean(),
      })).min(1).max(1000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    let prices = 0, orders = 0, hidden = 0, shown = 0;
    for (const r of data.rows) {
      if (r.price != null) {
        const { error } = await sb.from("product_reference_prices").upsert(
          { product_id: r.productId, market: data.market, price: r.price, currency: data.currency, observed_at: new Date().toISOString() },
          { onConflict: "product_id,market" },
        );
        if (error) throw new Error(error.message);
        prices++;
      }
      if (r.sortOrder != null) {
        const { error } = await sb.from("product_market_order").upsert(
          { product_id: r.productId, market: data.market, sort_order: r.sortOrder },
          { onConflict: "product_id,market" },
        );
        if (error) throw new Error(error.message);
        orders++;
      }
      if (r.hidden) {
        const { error } = await sb.from("product_market_exclusions").upsert(
          { product_id: r.productId, market: data.market },
          { onConflict: "product_id,market", ignoreDuplicates: true },
        );
        if (error) throw new Error(error.message);
        hidden++;
      } else {
        const { error } = await sb.from("product_market_exclusions").delete().eq("product_id", r.productId).eq("market", data.market);
        if (error) throw new Error(error.message);
        shown++;
      }
    }
    return { prices, orders, hidden, shown };
  });

/** Übersetzt eine neue Mengenangabe (Lang-/Kurzform) in alle Zielsprachen (Admin). */
export const translateUnitLabels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ label: z.string().min(1).max(60), short: z.string().min(1).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { translateUiTexts } = await import("./translate.server");
    const locales = await targetLocales(context.supabase);
    const out: Record<string, { label: string; short: string }> = { "de-DE": { label: data.label, short: data.short } };
    const texts = { label: `Mengeneinheit: ${data.label}`, short: `Abkürzung der Mengeneinheit „${data.label}": ${data.short}` };
    await Promise.all(locales.map(async (loc) => {
      try {
        const r = await translateUiTexts(
          { label: data.label, short: data.short },
          loc,
          `${loc} — these are a unit of measure for groceries (long name and its abbreviation; context: ${texts.label})`,
        );
        out[loc] = { label: r['label'] || data.label, short: r['short'] || data.short };
      } catch { /* einzelne Sprache überspringen */ }
    }));
    return out;
  });

export const translateDietLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ label: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { translateUiTexts } = await import("./translate.server");
    const locales = await targetLocales(context.supabase);
    const out: Record<string, string> = { "de-DE": data.label };
    await Promise.all(locales.map(async (loc) => {
      try {
        const r = await translateUiTexts({ label: data.label }, loc, `${loc} — this is a diet / nutrition style used to filter groceries (e.g. vegan, halal, low carb)`);
        out[loc] = r['label'] || data.label;
      } catch { /* einzelne Sprache überspringen */ }
    }));
    return out;
  });

/** KI-Vorschlag: Produkte einer Kategorie in sinnvolle Gruppen mit Überschriften einteilen. */
export const suggestHeadings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      path: z.string().max(300),
      products: z.array(z.object({ id: z.string().uuid(), name: z.string().max(120) })).min(2).max(400),
      keywords: z.string().max(200).default(""),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { aiJson } = await import("./translate.server");
    const keys = data.products.map((p, i) => ({ k: `p${i}`, name: p.name }));
    const r = await aiJson<{ groups: Array<{ name: string; keys: string[] }> }>(
      "Du kuratierst den Katalog einer deutschsprachigen Einkaufslisten-App. Teile die Produkte der genannten Kategorie in 2 bis 8 sinnvolle Gruppen ein, " +
        "wie Zwischenüberschriften im Supermarktregal (z. B. bei Käse: Hartkäse, Weichkäse, Frischkäse). Jede Gruppe bekommt eine kurze deutsche Überschrift (1–3 Wörter, de-DE, ss statt ß), " +
        "die nicht einfach den Kategorienamen wiederholt. Ordne JEDES Produkt genau einer Gruppe zu (über seinen Schlüssel k). Gruppen in sinnvoller Regal-Reihenfolge, Produkte innerhalb nach Relevanz." +
        (data.keywords.trim() ? ` Wunsch der Admin: ${data.keywords.trim()}.` : ""),
      JSON.stringify({ kategorie: data.path, produkte: keys }),
      "headings",
      {
        type: "object", additionalProperties: false, required: ["groups"],
        properties: { groups: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "keys"],
          properties: { name: { type: "string" }, keys: { type: "array", items: { type: "string" } } } } } },
      },
    );
    const byKey = new Map(keys.map((k, i) => [k.k, data.products[i]!.id]));
    const used = new Set<string>();
    const groups = r.groups
      .map((g) => ({ name: g.name.trim().replace(/ß/g, "ss").slice(0, 80), productIds: g.keys.map((k) => byKey.get(k)).filter((id): id is string => !!id && !used.has(id) && (used.add(id), true)) }))
      .filter((g) => g.name && g.productIds.length);
    const missing = data.products.map((p) => p.id).filter((id) => !used.has(id));
    if (missing.length) {
      if (groups.length) groups[groups.length - 1]!.productIds.push(...missing);
      else groups.push({ name: "Weitere", productIds: missing });
    }
    return { groups };
  });
