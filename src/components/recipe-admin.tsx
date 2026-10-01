import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RECIPE_TEMPLATES } from "@/lib/recipe-templates";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

type Row = { id: string; template_id: string; step_key: string; product_id: string; sort_order: number };
type Dept = { id: string; name: string; parent_id: string | null; emoji?: string | null; sort_order?: number };
type Prod = { id: string; name: string; department_id: string; emoji: string | null; sort_order?: number };

async function loadRecipeIngredients() {
  const rows: Row[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select("id, template_id, step_key, product_id, sort_order")
      .order("sort_order")
      .range(f, f + 999);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

/** Bereich „Rezept-Zutaten" im Admin-Panel: pro Rezept-Schritt Produkte per Checkbox zuweisen. */
export function RecipeAdmin({ depts, prods }: { depts: Dept[]; prods: Prod[] }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-recipe-ingredients"], queryFn: loadRecipeIngredients });
  const [open, setOpen] = useState(false);
  const [tplId, setTplId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pickerStep, setPickerStep] = useState<string | null>(null);
  const [pickerDept, setPickerDept] = useState<string | null>(null);
  const [pickerSel, setPickerSel] = useState<Set<string>>(new Set());

  const deptById = useMemo(() => new Map(depts.map((d) => [d.id, d])), [depts]);
  const prodById = useMemo(() => new Map(prods.map((p) => [p.id, p])), [prods]);
  const path = (id: string) => {
    const out: string[] = [];
    for (let d = deptById.get(id); d; d = d.parent_id ? deptById.get(d.parent_id) : undefined) out.unshift(d.name);
    return out.join(" › ");
  };

  const tpl = RECIPE_TEMPLATES.find((x) => x.id === tplId) ?? null;
  const rows = data ?? [];
  const assignedFor = (stepKey: string) =>
    rows
      .filter((r) => r.template_id === tplId && r.step_key === stepKey)
      .sort((a, b) => a.sort_order - b.sort_order);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["admin-recipe-ingredients"] });
      qc.invalidateQueries({ queryKey: ["catalog"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (stepKey: string, productId: string, on: boolean) =>
    run(async () => {
      if (on) {
        const max = Math.max(0, ...assignedFor(stepKey).map((r) => r.sort_order));
        const { error } = await supabase
          .from("recipe_ingredients")
          .upsert({ template_id: tplId!, step_key: stepKey, product_id: productId, sort_order: max + 1 }, { onConflict: "template_id,step_key,product_id" });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("recipe_ingredients")
          .delete()
          .eq("template_id", tplId!)
          .eq("step_key", stepKey)
          .eq("product_id", productId);
        if (error) throw new Error(error.message);
      }
    });

  const move = (stepKey: string, productId: string, dir: -1 | 1) =>
    run(async () => {
      const list = assignedFor(stepKey);
      const i = list.findIndex((r) => r.product_id === productId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      const a = list[i]!, b = list[j]!;
      const { error: e1 } = await supabase.from("recipe_ingredients").update({ sort_order: b.sort_order }).eq("id", a.id);
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await supabase.from("recipe_ingredients").update({ sort_order: a.sort_order }).eq("id", b.id);
      if (e2) throw new Error(e2.message);
    });

  const openPicker = (stepKey: string) => {
    setPickerStep(stepKey);
    setPickerDept(null);
    setPickerSel(new Set(assignedFor(stepKey).map((r) => r.product_id)));
  };
  const togglePick = (id: string) =>
    setPickerSel((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const childDepts = depts
    .filter((d) => (d.parent_id ?? null) === pickerDept)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const deptProds = pickerDept
    ? prods.filter((p) => p.department_id === pickerDept).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];
  const applyPicker = (stepKey: string) =>
    run(async () => {
      const assigned = assignedFor(stepKey);
      const had = new Set(assigned.map((r) => r.product_id));
      const add = [...pickerSel].filter((id) => !had.has(id));
      const remove = [...had].filter((id) => !pickerSel.has(id));
      let max = Math.max(0, ...assigned.map((r) => r.sort_order));
      if (add.length) {
        const { error } = await supabase.from("recipe_ingredients").upsert(
          add.map((product_id) => ({ template_id: tplId!, step_key: stepKey, product_id, sort_order: ++max })),
          { onConflict: "template_id,step_key,product_id" },
        );
        if (error) throw new Error(error.message);
      }
      if (remove.length) {
        const { error } = await supabase.from("recipe_ingredients").delete()
          .eq("template_id", tplId!).eq("step_key", stepKey).in("product_id", remove);
        if (error) throw new Error(error.message);
      }
      setPickerStep(null);
    });



  if (!open) {
    return (
      <Button variant="outline" className="w-full rounded-xl" onClick={() => setOpen(true)}>
        🍽️ {T("adm.recipeIngredients")}
      </Button>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground">🍽️ {T("adm.recipeIngredients")}</h2>
        <button onClick={() => { setOpen(false); setTplId(null); }} className="text-xs text-muted-foreground">{T("adm.close")}</button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {RECIPE_TEMPLATES.map((x) => (
          <button
            key={x.id}
            onClick={() => { setTplId(x.id); setSearch(""); setPickerStep(null); }}
            aria-pressed={tplId === x.id}
            className={`rounded-full border px-2.5 py-1 text-xs ${tplId === x.id ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground"}`}
          >
            {x.emoji} {T(`rk.cat.${x.id}` as MessageKey)}
          </button>
        ))}
      </div>

      {tpl && (
        <div className="space-y-4">
          <Input
            placeholder={T("adm.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl"
          />
          {tpl.steps.map((s) => {
            const assigned = assignedFor(s.key);
            const assignedIds = new Set(assigned.map((r) => r.product_id));
            const q = search.trim().toLowerCase();
            const candidates = q
              ? prods.filter((p) => !assignedIds.has(p.id) && (p.name.toLowerCase().includes(q) || path(p.department_id).toLowerCase().includes(q))).slice(0, 20)
              : [];
            return (
              <div key={s.key} className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground">
                  {s.label} <span className="font-normal text-muted-foreground">({assigned.length})</span>
                </p>
                <div className="space-y-1">
                  {assigned.map((r, i) => {
                    const p = prodById.get(r.product_id);
                    return (
                      <label key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs">
                        <input type="checkbox" checked disabled={busy} onChange={() => toggle(s.key, r.product_id, false)} className="accent-primary" />
                        <span className="min-w-0 flex-1 truncate text-foreground">{p?.emoji} {p?.name ?? r.product_id}</span>
                        <span className="hidden sm:block truncate text-[10px] text-muted-foreground">{p ? path(p.department_id) : ""}</span>
                        <button type="button" disabled={busy || i === 0} onClick={() => move(s.key, r.product_id, -1)} className="px-1 text-muted-foreground disabled:opacity-30">▲</button>
                        <button type="button" disabled={busy || i === assigned.length - 1} onClick={() => move(s.key, r.product_id, 1)} className="px-1 text-muted-foreground disabled:opacity-30">▼</button>
                      </label>
                    );
                  })}
                  {assigned.length === 0 && <p className="text-xs text-muted-foreground">{T("adm.recipeStepEmpty")}</p>}
                </div>
                {candidates.length > 0 && (
                  <div className="space-y-1 rounded-lg border border-dashed border-border p-1.5">
                    {candidates.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-accent/40">
                        <input type="checkbox" checked={false} disabled={busy} onChange={() => toggle(s.key, p.id, true)} className="accent-primary" />
                        <span className="min-w-0 flex-1 truncate text-foreground">{p.emoji} {p.name}</span>
                        <span className="hidden sm:block truncate text-[10px] text-muted-foreground">{path(p.department_id)}</span>
                      </label>
                    ))}
                  </div>
                )}
                {pickerStep !== s.key ? (
                  <button type="button" onClick={() => openPicker(s.key)} className="text-xs font-medium text-primary">
                    {T("adm.fromCatalog")}
                  </button>
                ) : (
                  <div className="space-y-1.5 rounded-lg border border-primary/40 bg-background p-2">
                    <div className="flex items-center gap-2 text-xs">
                      {pickerDept && (
                        <button type="button" onClick={() => setPickerDept(deptById.get(pickerDept)?.parent_id ?? null)} className="px-1 text-muted-foreground">←</button>
                      )}
                      <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{pickerDept ? path(pickerDept) : T("adm.fromCatalog")}</span>
                    </div>
                    <div className="max-h-72 space-y-0.5 overflow-y-auto">
                      {childDepts.map((d) => (
                        <button key={d.id} type="button" onClick={() => setPickerDept(d.id)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent/40">
                          <span className="truncate">{d.emoji} {d.name}</span><span className="text-muted-foreground">›</span>
                        </button>
                      ))}
                      {deptProds.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-accent/40">
                          <input type="checkbox" checked={pickerSel.has(p.id)} onChange={() => togglePick(p.id)} className="accent-primary" />
                          <span className="min-w-0 flex-1 truncate text-foreground">{p.emoji} {p.name}</span>
                        </label>
                      ))}
                    </div>
                    {deptProds.length > 0 && (
                      <div className="flex gap-3 text-xs">
                        <button type="button" onClick={() => setPickerSel((x) => new Set([...x, ...deptProds.map((p) => p.id)]))} className="text-primary">{T("adm.selectAll")}</button>
                        <button type="button" onClick={() => setPickerSel((x) => { const n = new Set(x); deptProds.forEach((p) => n.delete(p.id)); return n; })} className="text-primary">{T("adm.selectNone")}</button>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setPickerStep(null)}>{T("adm.cancel")}</Button>
                      <Button size="sm" disabled={busy} onClick={() => applyPicker(s.key)}>{T("adm.apply")} ({pickerSel.size})</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
