import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { RECIPE_TRAITS, TRAIT_GROUPS, splitTaste, toggleTaste, type TraitGroup } from "@/lib/recipe-traits";
import { normalizeSearch } from "@/lib/catalog-query";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

type Row = { id: string; title: string; is_public: boolean; satiety: string | null; spiciness: string | null; price_class: string | null; taste: string | null };
const KEY = ["admin-recipe-traits"];

export function RecipeTraitsAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: KEY,
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes")
        .select("id, title, is_public, satiety, spiciness, price_class, taste")
        .order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
  const missing = (r: Row) => TRAIT_GROUPS.some((g) => !r[g]);
  const rows = useMemo(() => {
    const n = normalizeSearch(q);
    return data.filter((r) => (!onlyMissing || missing(r)) && (!n || normalizeSearch(r.title).includes(n)));
  }, [data, onlyMissing, q]);
  const missingCount = data.filter(missing).length;

  async function setTrait(r: Row, g: TraitGroup, v: string) {
    const value = v || null;
    qc.setQueryData<Row[]>(KEY, (old) => old?.map((x) => (x.id === r.id ? { ...x, [g]: value } : x)));
    const { error } = await supabase.from("recipes").update({ [g]: value } as { satiety?: string | null }).eq("id", r.id);
    if (error) { toast.error(error.message); qc.invalidateQueries({ queryKey: KEY }); }
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-3">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left font-semibold">
        <span>🏷️ {T("adm.recipeTraits")}</span><span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">{T("adm.recipeTraitsHint", { n: missingCount })}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("adm.recipeTraitsSearch")} className="max-w-xs" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
              {T("adm.recipeTraitsOnlyMissing")}
            </label>
          </div>
          {isLoading ? <p className="text-sm text-muted-foreground">…</p> : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{T("adm.recipeTraitsNone")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="mb-1 text-sm font-medium">{r.title}{!r.is_public && <span className="ml-2 text-xs text-muted-foreground">🔒</span>}</div>
                  <div className="flex flex-wrap gap-2">
                    {TRAIT_GROUPS.map((g) => g === "taste" ? (
                      <span key={g} role="group" aria-label={T(`rk.${g}` as MessageKey)} className={`inline-flex flex-wrap items-center gap-1 rounded-md border px-1.5 py-1 ${r.taste ? "border-border" : "border-destructive"}`}>
                        <span className="text-xs text-muted-foreground">{RECIPE_TRAITS.taste.emoji}</span>
                        {RECIPE_TRAITS.taste.values.map((v) => {
                          const on = splitTaste(r.taste).includes(v);
                          return (
                            <button key={v} type="button" aria-pressed={on}
                              onClick={() => setTrait(r, "taste", toggleTaste(r.taste, v) ?? "")}
                              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}>
                              {T(`rk.taste.${v}` as MessageKey)}
                            </button>
                          );
                        })}
                      </span>
                    ) : (
                      <select key={g} aria-label={T(`rk.${g}` as MessageKey)} value={r[g] ?? ""}
                        onChange={(e) => setTrait(r, g, e.target.value)}
                        className={`rounded-md border bg-background px-2 py-1 text-sm ${r[g] ? "border-border" : "border-destructive"}`}>
                        <option value="">{RECIPE_TRAITS[g].emoji} {T(`rk.${g}` as MessageKey)} …</option>
                        {RECIPE_TRAITS[g].values.map((v) => (
                          <option key={v} value={v}>{RECIPE_TRAITS[g].emoji} {T(`rk.${g}.${v}` as MessageKey)}</option>
                        ))}
                      </select>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
