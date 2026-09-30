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
    return { isAdmin: Boolean(data), userId: context.userId };
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
