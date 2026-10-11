import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

type Alias = { id: string; product_id: string; department_id: string; sort_order: number };
type Prod = { id: string; name: string; emoji: string | null; department_id: string };

export const KEY = ["admin-product-aliases"];
export async function loadAliases() {
  const { data, error } = await supabase.from("product_aliases").select("id, product_id, department_id, sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Alias[];
}

function useActions() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>) => {
    setBusy(true);
    try {
      const { error } = await fn();
      if (error) throw new Error(error.message);
      await qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

/** Im Produkt-Editor: „Auch anzeigen in…" */
export function ProductAliasEditor({ product, prods, options, bare }: { product: Prod; prods: Prod[]; options: { id: string; label: string }[]; bare?: boolean | undefined }) {
  const { data } = useQuery({ queryKey: KEY, queryFn: loadAliases });
  const { busy, run } = useActions();
  const [pick, setPick] = useState("");
  const mine = (data ?? []).filter((a) => a.product_id === product.id);
  const blocked = new Set([product.department_id, ...mine.map((a) => a.department_id)]);
  const label = (id: string) => options.find((o) => o.id === id)?.label ?? id;
  const add = () => {
    if (!pick) return;
    const max = Math.max(0, ...prods.filter((p) => p.department_id === pick).map((p) => (p as Prod & { sort_order?: number }).sort_order ?? 0), ...(data ?? []).filter((a) => a.department_id === pick).map((a) => a.sort_order));
    run(() => supabase.from("product_aliases").upsert({ product_id: product.id, department_id: pick, sort_order: max + 1 }, { onConflict: "product_id,department_id", ignoreDuplicates: true }));
    setPick("");
  };
  return (
    <div className={`space-y-1.5 ${bare ? "" : "rounded-xl border border-border p-2"}`}>
      {!bare && <p className="text-xs font-semibold text-foreground">{T("palias.alsoIn")}</p>}
      {mine.map((a) => (
        <div key={a.id} className="flex items-center gap-2 text-xs">
          <span className="min-w-0 flex-1 truncate text-foreground">{label(a.department_id)}</span>
          <button type="button" disabled={busy} onClick={() => run(() => supabase.from("product_aliases").delete().eq("id", a.id))} className="px-1 text-destructive" aria-label={T("adm.delete")}>✕</button>
        </div>
      ))}
      <div className="flex gap-2">
        <select value={pick} onChange={(e) => setPick(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs">
          <option value="">{T("adm.alsoUnderPick")}</option>
          {options.filter((o) => !blocked.has(o.id)).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button type="button" disabled={busy || !pick} onClick={add} className="rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-40">+</button>
      </div>
    </div>
  );
}

