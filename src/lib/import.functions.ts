import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TRANSLATED_LOCALES } from "@/i18n";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Kein Admin-Zugriff");
}

export const scanImportUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().url().max(2000), market: z.string().length(2), sourceId: z.string().uuid().nullable() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { scanToCandidates } = await import("./import.server");
    const res = await scanToCandidates(context.supabase, data);
    if (data.sourceId) await context.supabase.from("import_sources").update({ last_run_at: new Date().toISOString(), last_status: `ok: ${res.found} gefunden, ${res.pending} neu` }).eq("id", data.sourceId);
    return res;
  });

const accItem = z.object({
  id: z.string().uuid(),
  action: z.enum(["create", "link"]),
  name: z.string().min(1).max(120),
  department_id: z.string().uuid().nullable(),
  emoji: z.string().max(16).nullable(),
  price: z.number().nullable(),
});

export const acceptImportCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ items: z.array(accItem).min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const ids = data.items.map((i) => i.id);
    const { data: cands, error } = await sb.from("import_candidates").select("*").in("id", ids);
    if (error) throw new Error(error.message);
    const byId = new Map(((cands ?? []) as any[]).map((c) => [c.id, c]));
    const created: Array<{ id: string; name: string }> = [];
    let linked = 0;
    for (const it of data.items) {
      const c = byId.get(it.id);
      if (!c) continue;
      let productId: string | null = it.action === "link" ? c.match_product_id : null;
      if (it.action === "create") {
        if (!it.department_id) throw new Error(`Abteilung fehlt: ${it.name}`);
        const { data: p, error: e } = await sb.from("products").insert({ name: it.name.trim(), department_id: it.department_id, emoji: it.emoji, sort_order: 9999 }).select("id, name").single();
        if (e) throw new Error(e.message);
        productId = p.id; created.push(p);
      } else linked++;
      if (productId && (it.price ?? c.price)) {
        await sb.from("product_reference_prices").upsert({
          product_id: productId, market: c.market, price: it.price ?? c.price, currency: c.currency ?? "EUR",
          pack_size: c.pack_size, pack_unit: c.pack_unit, unit_price: c.unit_price, unit_basis: c.unit_basis,
          source_id: c.source_id, observed_at: new Date().toISOString(),
        }, { onConflict: "product_id,market" });
      }
      await sb.from("import_candidates").update({ status: "accepted", match_product_id: productId }).eq("id", it.id);
    }
    if (created.length) {
      const { translateNames } = await import("./translate.server");
      const names = Object.fromEntries(created.map((p) => [p.id, p.name]));
      await Promise.all(TRANSLATED_LOCALES.map(async (locale) => {
        try {
          const r = await translateNames(names, locale);
          const rows = created.filter((p) => r[p.id]).map((p) => ({ entity_type: "product", entity_id: p.id, locale, name: r[p.id]!, is_manual: false }));
          if (rows.length) await sb.from("catalog_translations").upsert(rows, { onConflict: "entity_type,entity_id,locale" });
        } catch (e) { console.error("translate", locale, e); }
      }));
    }
    return { created: created.length, linked };
  });

export const rejectImportCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ ids: z.array(z.string().uuid()).min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("import_candidates").update({ status: "rejected" }).in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
