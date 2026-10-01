import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RECIPE_TEMPLATES } from "@/lib/recipe-templates";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getLocale, translate } from "@/i18n";
import { useServerFn } from "@tanstack/react-start";
import { saveRecipeGroup, deleteRecipeGroup } from "@/lib/admin.functions";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

type Row = { id: string; template_id: string; step_key: string; product_id: string; sort_order: number; group_id: string | null };
type Grp = { id: string; parent_id: string | null; name: string; emoji: string | null; sort_order: number };

async function loadGroups() {
  const { data, error } = await supabase.from("recipe_groups").select("id, parent_id, name, emoji, sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Grp[];
}
type Dept = { id: string; name: string; parent_id: string | null; emoji?: string | null; sort_order?: number };
type Prod = { id: string; name: string; department_id: string; emoji: string | null; sort_order?: number };

async function loadRecipeIngredients() {
  const rows: Row[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await supabase
      .from("recipe_ingredients")
      .select("id, template_id, step_key, product_id, sort_order, group_id")
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
  const [pickerGroup, setPickerGroup] = useState<string>("");
  const { data: groupsData } = useQuery({ queryKey: ["admin-recipe-groups"], queryFn: loadGroups });
  const groups = groupsData ?? [];
  const saveGroupFn = useServerFn(saveRecipeGroup);
  const deleteGroupFn = useServerFn(deleteRecipeGroup);
  const tops = groups.filter((g) => !g.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  const kidsOf = (id: string) => groups.filter((g) => g.parent_id === id).sort((a, b) => a.sort_order - b.sort_order);
  const groupOptions = tops.flatMap((g) => [{ id: g.id, label: `${g.emoji ?? ""} ${g.name}`.trim() }, ...kidsOf(g.id).map((k) => ({ id: k.id, label: `— ${k.emoji ?? ""} ${k.name}`.replace("  ", " ") }))]);

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
      await qc.invalidateQueries({ queryKey: ["admin-recipe-groups"] });
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

  const setGroup = (rowId: string, groupId: string) =>
    run(async () => {
      const { error } = await supabase.from("recipe_ingredients").update({ group_id: groupId || null }).eq("id", rowId);
      if (error) throw new Error(error.message);
    });
  const addGroup = (parentId: string | null) => {
    const name = window.prompt(T(parentId ? "adm.recipeGroupSub" : "adm.recipeGroupNew").replace("+ ", ""))?.trim();
    if (!name) return;
    const emoji = window.prompt("Emoji", "")?.trim() || null;
    const siblings = groups.filter((g) => (g.parent_id ?? null) === parentId);
    run(() => saveGroupFn({ data: { name, emoji, parentId, sortOrder: Math.max(0, ...siblings.map((g) => g.sort_order)) + 1 } }));
  };
  const editGroup = (g: Grp) => {
    const name = window.prompt(T("adm.recipeGroups"), g.name)?.trim();
    if (!name) return;
    const emoji = window.prompt("Emoji", g.emoji ?? "")?.trim() || null;
    run(() => saveGroupFn({ data: { id: g.id, name, emoji } }));
  };
  const removeGroup = (g: Grp) => {
    if (!window.confirm(T("adm.recipeGroupDelete", { name: g.name }))) return;
    run(() => deleteGroupFn({ data: { id: g.id } }));
  };
  const moveGroup = (g: Grp, dir: -1 | 1) =>
    run(async () => {
      const sib = groups.filter((x) => (x.parent_id ?? null) === (g.parent_id ?? null)).sort((a, b) => a.sort_order - b.sort_order);
      const i = sib.findIndex((x) => x.id === g.id);
      const o = sib[i + dir];
      if (!o) return;
      const a = sib.map((x, k) => ({ id: x.id, so: k + 1 }));
      a[i]!.so = i + dir + 1; a[i + dir]!.so = i + 1;
      for (const x of a) {
        const { error } = await supabase.from("recipe_groups").update({ sort_order: x.so }).eq("id", x.id);
        if (error) throw new Error(error.message);
      }
    });

  const openPicker = (stepKey: string) => {
    setPickerStep(stepKey);
    setPickerDept(null);
    setPickerGroup("");
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
  /** Alle Produkt-IDs einer Kategorie inkl. aller Unterkategorien. */
  const deptProductIds = (deptId: string): string[] => {
    const ids = prods.filter((p) => p.department_id === deptId).map((p) => p.id);
    for (const child of depts.filter((d) => d.parent_id === deptId)) ids.push(...deptProductIds(child.id));
    return ids;
  };
  const toggleDeptPick = (deptId: string, on: boolean) =>
    setPickerSel((x) => {
      const n = new Set(x);
      for (const id of deptProductIds(deptId)) { if (on) n.add(id); else n.delete(id); }
      return n;
    });
  const applyPicker = (stepKey: string) =>
    run(async () => {
      const assigned = assignedFor(stepKey);
      const had = new Set(assigned.map((r) => r.product_id));
      const add = [...pickerSel].filter((id) => !had.has(id));
      const remove = [...had].filter((id) => !pickerSel.has(id));
      let max = Math.max(0, ...assigned.map((r) => r.sort_order));
      if (add.length) {
        const { error } = await supabase.from("recipe_ingredients").upsert(
          add.map((product_id) => ({ template_id: tplId!, step_key: stepKey, product_id, sort_order: ++max, group_id: pickerGroup || null })),
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

      <div className="space-y-1 rounded-xl border border-border bg-background p-2">
        <p className="text-xs font-semibold text-foreground">🗂️ {T("adm.recipeGroups")}</p>
        {tops.map((g, gi) => (
          <div key={g.id} className="space-y-0.5">
            <GroupRow g={g} first={gi === 0} last={gi === tops.length - 1} busy={busy} onEdit={editGroup} onDelete={removeGroup} onMove={moveGroup} bold />
            <div className="pl-5">
              {kidsOf(g.id).map((k, ki, arr) => (
                <GroupRow key={k.id} g={k} first={ki === 0} last={ki === arr.length - 1} busy={busy} onEdit={editGroup} onDelete={removeGroup} onMove={moveGroup} />
              ))}
              <button type="button" disabled={busy} onClick={() => addGroup(g.id)} className="text-[11px] text-primary">{T("adm.recipeGroupSub")}</button>
            </div>
          </div>
        ))}
        <button type="button" disabled={busy} onClick={() => addGroup(null)} className="text-xs font-medium text-primary">{T("adm.recipeGroupNew")}</button>
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
                        <select
                          value={r.group_id ?? ""}
                          disabled={busy}
                          onChange={(e) => setGroup(r.id, e.target.value)}
                          className="max-w-[9rem] rounded-md border border-border bg-background px-1 py-0.5 text-[11px] text-foreground"
                          aria-label={T("adm.recipeGroups")}
                        >
                          <option value="">{T("adm.recipeGroupNone")}</option>
                          {groupOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
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
                      {childDepts.map((d) => {
                        const ids = deptProductIds(d.id);
                        const chosen = ids.filter((id) => pickerSel.has(id)).length;
                        return (
                          <div key={d.id} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent/40">
                            <input
                              type="checkbox"
                              checked={ids.length > 0 && chosen === ids.length}
                              ref={(el) => { if (el) el.indeterminate = chosen > 0 && chosen < ids.length; }}
                              disabled={ids.length === 0}
                              onChange={(e) => toggleDeptPick(d.id, e.target.checked)}
                              className="accent-primary"
                              aria-label={d.name}
                            />
                            <button type="button" onClick={() => setPickerDept(d.id)} className="flex min-w-0 flex-1 items-center justify-between">
                              <span className="truncate">{d.emoji} {d.name} <span className="text-muted-foreground">({chosen}/{ids.length})</span></span><span className="text-muted-foreground">›</span>
                            </button>
                          </div>
                        );
                      })}
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
                    <label className="flex items-center gap-2 text-xs text-foreground">
                      {T("adm.recipeGroupTarget")}
                      <select value={pickerGroup} onChange={(e) => setPickerGroup(e.target.value)} className="min-w-0 flex-1 rounded-md border border-border bg-background px-1 py-1 text-xs">
                        <option value="">{T("adm.recipeGroupNone")}</option>
                        {groupOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                    </label>
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

function GroupRow({ g, first, last, busy, bold, onEdit, onDelete, onMove }: {
  g: Grp; first: boolean; last: boolean; busy: boolean; bold?: boolean;
  onEdit: (g: Grp) => void; onDelete: (g: Grp) => void; onMove: (g: Grp, d: -1 | 1) => void;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button type="button" onClick={() => onEdit(g)} className={`min-w-0 flex-1 truncate text-left text-foreground ${bold ? "font-semibold" : ""}`}>
        {g.emoji} {g.name}
      </button>
      <button type="button" disabled={busy || first} onClick={() => onMove(g, -1)} className="px-1 text-muted-foreground disabled:opacity-30">▲</button>
      <button type="button" disabled={busy || last} onClick={() => onMove(g, 1)} className="px-1 text-muted-foreground disabled:opacity-30">▼</button>
      <button type="button" disabled={busy} onClick={() => onDelete(g)} className="px-1 text-destructive" aria-label="delete">🗑</button>
    </div>
  );
}
