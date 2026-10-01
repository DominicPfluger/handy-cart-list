import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { suggestBrands } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);
export const MARKETS = ["DE", "AT", "CH", "US", "GB", "CA", "ES", "MX", "FR", "IT", "PT", "BR", "NL", "BE"];
type Brand = { id: string; name: string; locales: string[]; sort_order: number };

/** Handelsmarken eines Produkts im Admin-Produkt-Editor bearbeiten. */
export function ProductBrandEditor({ productId, productName, path }: { productId: string; productName: string; path: string }) {
  const qc = useQueryClient();
  const suggest = useServerFn(suggestBrands);
  const key = ["admin-brands", productId];
  const { data: brands = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_brands").select("id, name, locales, sort_order").eq("product_id", productId).order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as Brand[];
    },
  });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const refresh = async () => { await qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["catalog"] }); };
  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true);
    try { const { error } = await fn(); if (error) throw new Error(error.message); await refresh(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  const add = (n: string, locales: string[] = []) =>
    supabase.from("product_brands").insert({ product_id: productId, name: n, locales, sort_order: (brands.at(-1)?.sort_order ?? 0) + 1 });

  const move = (b: Brand, dir: -1 | 1) => {
    const i = brands.indexOf(b); const o = brands[i + dir]; if (!o) return;
    run(async () => {
      const a = await supabase.from("product_brands").update({ sort_order: o.sort_order }).eq("id", b.id);
      if (a.error) return a;
      return supabase.from("product_brands").update({ sort_order: b.sort_order === o.sort_order ? b.sort_order + dir : b.sort_order }).eq("id", o.id);
    });
  };

  const runSuggest = async () => {
    setBusy(true);
    try {
      const r = await suggest({ data: { products: [{ id: productId, name: productName, path }] } });
      const existing = new Set(brands.map((b) => b.name.toLowerCase()));
      const fresh = (r.items[0]?.brands ?? []).filter((b) => !existing.has(b.name.toLowerCase()));
      if (!fresh.length) { toast(T("adm.brandNone")); return; }
      let order = (brands.at(-1)?.sort_order ?? 0) + 1;
      const { error } = await supabase.from("product_brands").insert(fresh.map((b) => ({ product_id: productId, name: b.name, locales: b.markets.filter((m) => MARKETS.includes(m)), sort_order: order++ })));
      if (error) throw new Error(error.message);
      await refresh();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{T("adm.brands")}</h3>
        <Button size="sm" variant="outline" disabled={busy} onClick={runSuggest}>✨ {T("adm.brandSuggest")}</Button>
      </div>
      <div className="space-y-1">
        {brands.map((b, i) => (
          <div key={b.id} className="rounded-lg border border-border bg-background p-2">
            <div className="flex items-center gap-1">
              <Input defaultValue={b.name} className="h-8 flex-1 text-sm" onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== b.name) run(() => supabase.from("product_brands").update({ name: v }).eq("id", b.id)); }} />
              <Button size="sm" variant="ghost" disabled={busy || i === 0} onClick={() => move(b, -1)}>▲</Button>
              <Button size="sm" variant="ghost" disabled={busy || i === brands.length - 1} onClick={() => move(b, 1)}>▼</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditId(editId === b.id ? null : b.id)} title={T("adm.brandMarkets")}>🌐</Button>
              <Button size="sm" variant="ghost" disabled={busy} aria-label={T("adm.delete")} onClick={() => { if (confirm(T("adm.brandDelete", { name: b.name }))) run(() => supabase.from("product_brands").delete().eq("id", b.id)); }}>✕</Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{b.locales.length ? b.locales.join(", ") : T("adm.brandAll")}</p>
            {editId === b.id && (
              <div className="mt-1 flex flex-wrap gap-1">
                {MARKETS.map((m) => {
                  const on = b.locales.includes(m);
                  return (
                    <button key={m} type="button" aria-pressed={on} disabled={busy}
                      onClick={() => run(() => supabase.from("product_brands").update({ locales: on ? b.locales.filter((x) => x !== m) : [...b.locales, m] }).eq("id", b.id))}
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${on ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground"}`}>{m}</button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={T("adm.brandAdd")} className="h-9 text-sm" />
        <Button size="sm" disabled={busy || !name.trim()} onClick={() => { const n = name.trim(); setName(""); run(() => add(n)); }}>+</Button>
      </div>
    </div>
  );
}
