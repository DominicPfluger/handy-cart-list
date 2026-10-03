import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RECIPE_TEMPLATES } from "@/lib/recipe-templates";
import { normalizeSearch } from "@/lib/catalog-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { getLocale, translate } from "@/i18n";
import { useServerFn } from "@tanstack/react-start";
import { sortRecipeIngredients, saveRecipeGroup, deleteRecipeGroup } from "@/lib/admin.functions";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

type Row = { id: string; template_id: string; step_key: string; product_id: string; sort_order: number; group_id: string | null };
type Group = { id: string; template_id: string; parent_id: string | null; name: string; emoji: string | null; sort_order: number };
type Dept = { id: string; name: string; parent_id: string | null; emoji?: string | null; sort_order?: number };
type TplRow = { id: string; emoji: string; color: string; sort_order: number; enabled: boolean };
type StepRow = { id: string; template_id: string; key: string; name: string; emoji: string | null; min: number; max: number; required: boolean; sort_order: number };
type PopRow = { id: string; template_id: string; picks: Record<string, string[]>; sort_order: number };

async function loadTplRows(): Promise<TplRow[]> {
  const { data, error } = await supabase.from("recipe_templates").select("id, emoji, color, sort_order, enabled").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as TplRow[];
}
async function loadStepRows(): Promise<StepRow[]> {
  const { data, error } = await supabase.from("recipe_steps").select("id, template_id, key, name, emoji, min, max, required, sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as StepRow[];
}
async function loadPopRows(): Promise<PopRow[]> {
  const { data, error } = await supabase.from("recipe_popular").select("id, template_id, picks, sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as PopRow[];
}
/** Anzeigename einer Vorlage: eingebaute über i18n, eigene über ihre Kennung. */
const tplLabel = (id: string) =>
  RECIPE_TEMPLATES.some((b) => b.id === id) ? T(`rk.cat.${id}` as MessageKey) : id;
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

async function loadRecipeGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from("recipe_groups").select("id, template_id, parent_id, name, emoji, sort_order").order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Group[];
}

/** Bereich „Rezept-Verwaltung“: Vorlagen, Zutatenbereiche (Schritte), Oberkategorien, beliebte Kombinationen. */
export function RecipeAdmin({ depts, prods }: { depts: Dept[]; prods: Prod[] }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-recipe-ingredients"], queryFn: loadRecipeIngredients });
  const { data: groupData } = useQuery({ queryKey: ["admin-recipe-groups"], queryFn: loadRecipeGroups });
  const { data: tplRows } = useQuery({ queryKey: ["admin-recipe-templates"], queryFn: loadTplRows });
  const { data: stepRows } = useQuery({ queryKey: ["admin-recipe-steps"], queryFn: loadStepRows });
  const { data: popRows } = useQuery({ queryKey: ["admin-recipe-popular"], queryFn: loadPopRows });
  const [open, setOpen] = useState(true);
  const [stepsOpen, setStepsOpen] = useState(true);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [tplId, setTplId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const saveGroupFn = useServerFn(saveRecipeGroup);
  const deleteGroupFn = useServerFn(deleteRecipeGroup);
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [groupParent, setGroupParent] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("");
  const [dragGroup, setDragGroup] = useState<string | null>(null);
  const [dragTpl, setDragTpl] = useState<string | null>(null);
  const [dragStep, setDragStep] = useState<string | null>(null);
  // Vorlagen-/Oberkategorien-Verwaltung
  const [manageOpen, setManageOpen] = useState(false);
  const [tplForm, setTplForm] = useState<{ id: string; emoji: string } | null>(null);
  const [stepForm, setStepForm] = useState<{ id: string | null; key: string; name: string; emoji: string; min: number; max: number; required: boolean } | null>(null);
  const [popForm, setPopForm] = useState("");

  const templates = tplRows ?? [];
  const stepsFor = (tid: string) => (stepRows ?? []).filter((s) => s.template_id === tid).sort((a, b) => a.sort_order - b.sort_order);
  const steps = tplId ? stepsFor(tplId) : [];
  const pops = tplId ? (popRows ?? []).filter((p) => p.template_id === tplId).sort((a, b) => a.sort_order - b.sort_order) : [];
  const rows = data ?? [];
  const groups = (groupData ?? []).filter((g) => g.template_id === tplId);

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
  const runTpl = (fn: () => Promise<unknown>) =>
    run(async () => {
      await fn();
      await qc.invalidateQueries({ queryKey: ["admin-recipe-templates"] });
      await qc.invalidateQueries({ queryKey: ["admin-recipe-steps"] });
      await qc.invalidateQueries({ queryKey: ["admin-recipe-popular"] });
    });

  const saveTpl = () => runTpl(async () => {
    if (!tplForm) return;
    const id = tplForm.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!id) return;
    const emoji = tplForm.emoji.trim() || "🍽️";
    const exists = templates.some((x) => x.id === id);
    const q = exists
      ? supabase.from("recipe_templates").update({ emoji }).eq("id", id)
      : supabase.from("recipe_templates").insert({ id, emoji, sort_order: templates.length + 1 });
    const { error } = await q;
    if (error) throw new Error(error.message);
    setTplForm(null);
  });
  const removeTpl = (t: TplRow) => {
    if (!window.confirm(T("adm.tplDeleteConfirm", { name: tplLabel(t.id) }))) return;
    void runTpl(async () => {
      const { error } = await supabase.from("recipe_templates").delete().eq("id", t.id);
      if (error) throw new Error(error.message);
      if (tplId === t.id) setTplId(null);
    });
  };
  const toggleTpl = (t: TplRow) => runTpl(async () => {
    const { error } = await supabase.from("recipe_templates").update({ enabled: !t.enabled }).eq("id", t.id);
    if (error) throw new Error(error.message);
  });
  const reorderTpl = (sourceId: string, target: TplRow) => runTpl(async () => {
    const list = [...templates].sort((a, b) => a.sort_order - b.sort_order);
    const from = list.findIndex((x) => x.id === sourceId);
    const to = list.findIndex((x) => x.id === target.id);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    for (let i = 0; i < next.length; i++) {
      const row = next[i];
      if (!row) continue;
      const { error } = await supabase.from("recipe_templates").update({ sort_order: i + 1 }).eq("id", row.id);
      if (error) throw new Error(error.message);
    }
  });

  const saveStep = () => runTpl(async () => {
    if (!stepForm || !tplId) return;
    const key = stepForm.key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const name = stepForm.name.trim();
    if (!key || !name) return;
    const payload = { template_id: tplId, key, name, emoji: stepForm.emoji.trim() || null, min: stepForm.min, max: stepForm.max, required: stepForm.required };
    const q = stepForm.id
      ? supabase.from("recipe_steps").update(payload).eq("id", stepForm.id)
      : supabase.from("recipe_steps").insert({ ...payload, sort_order: steps.length + 1 });
    const { error } = await q;
    if (error) throw new Error(error.message);
    setStepForm(null);
  });
  const removeStep = (s: StepRow) => {
    if (!window.confirm(T("adm.stepDeleteConfirm", { name: s.name }))) return;
    void runTpl(async () => {
      const { error } = await supabase.from("recipe_steps").delete().eq("id", s.id);
      if (error) throw new Error(error.message);
    });
  };
  const reorderStep = (sourceId: string, target: StepRow) => runTpl(async () => {
    const list = steps;
    const from = list.findIndex((x) => x.id === sourceId);
    const to = list.findIndex((x) => x.id === target.id);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    for (let i = 0; i < next.length; i++) {
      const row = next[i];
      if (!row) continue;
      const { error } = await supabase.from("recipe_steps").update({ sort_order: i + 1 }).eq("id", row.id);
      if (error) throw new Error(error.message);
    }
  });

  const addPop = () => runTpl(async () => {
    if (!tplId || !popForm.trim()) return;
    const picks: Record<string, string[]> = {};
    for (const part of popForm.split(";")) {
      const [k, v] = part.split(":");
      if (!k?.trim() || !v?.trim()) continue;
      picks[k.trim()] = v.split(",").map((x) => x.trim()).filter(Boolean);
    }
    if (Object.keys(picks).length === 0) return;
    const { error } = await supabase.from("recipe_popular").insert({ template_id: tplId, picks, sort_order: pops.length + 1 });
    if (error) throw new Error(error.message);
    setPopForm("");
  });
  const removePop = (p: PopRow) => {
    if (!window.confirm(T("adm.popularDeleteConfirm"))) return;
    void runTpl(async () => {
      const { error } = await supabase.from("recipe_popular").delete().eq("id", p.id);
      if (error) throw new Error(error.message);
    });
  };

  const groupTree = (parentId: string | null) => groups.filter((g) => g.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const descendants = (id: string): string[] => [id, ...groupTree(id).flatMap((g) => descendants(g.id))];
  const groupRows = (parentId: string | null): Array<{ group: Group; depth: number }> =>
    groupTree(parentId).flatMap((group) => [{ group, depth: 0 }, ...groupRows(group.id).map(({ group: child, depth }) => ({ group: child, depth: depth + 1 }))]);
  const startGroup = (parentId: string | null, group?: Group) => {
    setGroupFormOpen(true);
    setEditGroupId(group?.id ?? null);
    setGroupParent(group?.parent_id ?? parentId);
    setGroupName(group?.name ?? "");
    setGroupEmoji(group?.emoji ?? "");
  };
  const saveGroup = () => run(async () => {
    if (!groupName.trim()) return;
    if (!tplId) return;
    const multi = !editGroupId && !groupParent;
    const names = multi ? groupName.split("\n").map((n) => n.trim()).filter(Boolean) : [groupName.trim()];
    let sortOrder = groupTree(groupParent).length + 1;
    for (const name of names) {
      await saveGroupFn({ data: { templateId: tplId, id: editGroupId ?? undefined, parentId: groupParent, name, emoji: groupEmoji.trim() || null, sortOrder: sortOrder++ } });
    }
    await qc.invalidateQueries({ queryKey: ["admin-recipe-groups"] });
    setGroupFormOpen(false); setGroupName(""); setEditGroupId(null); setGroupParent(null); setGroupEmoji("");
  });
  const removeGroup = (g: Group) => {
    const ids = descendants(g.id);
    const count = rows.filter((r) => r.group_id && ids.includes(r.group_id)).length;
    if (!window.confirm(`${T("adm.recipeGroupDelete", { name: g.name })}\n${groupTree(g.id).length ? `${descendants(g.id).length - 1} ${T("adm.recipeGroupSub")}\n` : ""}${count} ${T("adm.assigned")}`)) return;
    void run(async () => {
      await deleteGroupFn({ data: { id: g.id } });
      await qc.invalidateQueries({ queryKey: ["admin-recipe-groups"] });
    });
  };
  const reorderGroup = (sourceId: string, target: Group) => run(async () => {
    const siblings = groupTree(target.parent_id);
    const from = siblings.findIndex((g) => g.id === sourceId);
    const to = siblings.findIndex((g) => g.id === target.id);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...siblings];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    for (let i = 0; i < next.length; i++) {
      const row = next[i];
      if (!row) continue;
      const { error } = await supabase.from("recipe_groups").update({ sort_order: i + 1 }).eq("id", row.id);
      if (error) throw new Error(error.message);
    }
    await qc.invalidateQueries({ queryKey: ["admin-recipe-groups"] });
  });

  return (
    <section className="rounded-xl border border-border bg-card p-3">
      <Button type="button" variant="ghost" aria-expanded={open} aria-controls="recipe-admin-content" onClick={() => setOpen((v) => !v)} className="flex h-auto w-full items-center justify-between px-0 text-left hover:bg-transparent">
        <span className="text-sm font-semibold text-foreground">🍽️ {T("adm.recipeManage")}</span>
        <span aria-hidden="true" className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </Button>
      <div id="recipe-admin-content" className={`mt-3 space-y-3 ${open ? "" : "hidden"}`}>

      <div className="flex flex-wrap items-center gap-1.5">
        {templates.map((x) => (
          <button
            key={x.id}
            onClick={() => { setTplId(x.id); setStepForm(null); }}
            aria-pressed={tplId === x.id}
            className={`rounded-full border px-2.5 py-1 text-xs ${tplId === x.id ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground"} ${x.enabled ? "" : "opacity-50 line-through"}`}
          >
            {x.emoji} {tplLabel(x.id)}
          </button>
        ))}
        <Button type="button" variant="outline" size="sm" aria-expanded={manageOpen} aria-controls="recipe-admin-templates" onClick={() => setManageOpen((v) => !v)} className={`h-auto rounded-full px-2.5 py-1 text-xs ${manageOpen ? "border-primary bg-primary/15 text-foreground" : "border-dashed border-border bg-background text-muted-foreground"}`}>
          ⚙️ {T("adm.tplManage")} <span aria-hidden="true">{manageOpen ? "▲" : "▼"}</span>
        </Button>
      </div>

        <div id="recipe-admin-templates" className={`space-y-2 rounded-lg border border-border bg-background p-2 ${manageOpen ? "" : "hidden"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">{T("adm.tplManage")}</span>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setTplForm({ id: "", emoji: "" })}>{T("adm.tplNew")}</Button>
          </div>
          {templates.map((t) => (
            <div key={t.id} draggable={!busy} onDragStart={(e) => { e.dataTransfer.setData("text/plain", t.id); setDragTpl(t.id); }} onDragEnd={() => setDragTpl(null)} onDragOver={(e) => { if (dragTpl) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (dragTpl) void reorderTpl(dragTpl, t); setDragTpl(null); }} className="flex items-center gap-1.5 border-b border-border/50 py-1 text-xs">
              <span className="cursor-grab text-muted-foreground" title={T("adm.drag")}>⠿</span>
              <span className="min-w-0 flex-1 truncate text-foreground">{t.emoji} {tplLabel(t.id)} <span className="text-muted-foreground">({t.id})</span></span>
              <button type="button" disabled={busy} onClick={() => toggleTpl(t)} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${t.enabled ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {t.enabled ? T("adm.tplEnabled") : T("adm.tplDisabled")}
              </button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setTplForm({ id: t.id, emoji: t.emoji })}>{T("adm.edit")}</Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => removeTpl(t)}>{T("adm.delete")}</Button>
            </div>
          ))}
          {tplForm && (
            <div className="flex flex-wrap items-center gap-2">
              <Input aria-label={T("adm.tplId")} placeholder={T("adm.tplId")} value={tplForm.id} onChange={(e) => setTplForm({ ...tplForm, id: e.target.value })} className="min-w-32 flex-1" disabled={templates.some((x) => x.id === tplForm.id)} />
              <Input aria-label="Emoji" placeholder="Emoji" value={tplForm.emoji} onChange={(e) => setTplForm({ ...tplForm, emoji: e.target.value })} className="w-20" />
              <Button size="sm" disabled={busy || !tplForm.id.trim()} onClick={saveTpl}>{T("adm.save")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setTplForm(null)}>{T("adm.cancel")}</Button>
            </div>
          )}

          {tplId && (
            <div className="space-y-2 border-t border-border pt-2">
              <div className="space-y-1 border-t border-border pt-2">
                <span className="text-xs font-semibold text-foreground">{T("adm.popular")}</span>
                {pops.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5 border-b border-border/50 py-1 text-xs">
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{Object.entries(p.picks).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" · ")}</span>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => removePop(p)}>{T("adm.delete")}</Button>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-2">
                  <Input aria-label={T("adm.popularNew")} placeholder={T("adm.popularHint")} value={popForm} onChange={(e) => setPopForm(e.target.value)} className="min-w-40 flex-1" />
                  <Button size="sm" disabled={busy || !popForm.trim()} onClick={addPop}>{T("adm.popularNew")}</Button>
                </div>
              </div>

              <div className="space-y-1 border-t border-border pt-2">
                <span className="text-xs font-semibold text-foreground">{T("adm.preview")}</span>
                <div className="rounded-xl border border-border bg-card p-2">
                  <p className="text-sm font-semibold text-foreground">{templates.find((x) => x.id === tplId)?.emoji} {tplLabel(tplId)}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {steps.map((s) => (
                      <span key={s.id} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground">{s.emoji} {s.name} {s.required ? "*" : ""}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      {tplId && (
        <div className="space-y-4">
          <div className="space-y-2 border-b border-border pb-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <Button type="button" variant="ghost" aria-expanded={stepsOpen} aria-controls="recipe-admin-steps" onClick={() => setStepsOpen((v) => !v)} className="h-auto min-w-0 justify-start gap-2 px-0 text-left text-sm font-semibold hover:bg-transparent">
                <span aria-hidden="true" className="shrink-0 text-xs text-muted-foreground">{stepsOpen ? "▲" : "▼"}</span>
                <span className="min-w-0 truncate">{tplLabel(tplId)} · {T("adm.tplManage")}</span>
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => { setStepsOpen(true); setStepForm({ id: null, key: "", name: "", emoji: "", min: 1, max: 1, required: true }); }}>{T("adm.stepNew")}</Button>
            </div>
            <div id="recipe-admin-steps" className={`space-y-2 ${stepsOpen ? "" : "hidden"}`}>
            {steps.map((s) => (
              <div key={s.id} draggable={!busy} onDragStart={(e) => { e.dataTransfer.setData("text/plain", s.id); setDragStep(s.id); }} onDragEnd={() => setDragStep(null)} onDragOver={(e) => { if (dragStep) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (dragStep) void reorderStep(dragStep, s); setDragStep(null); }} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 border-b border-border/50 py-1 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="cursor-grab text-muted-foreground" title={T("adm.drag")}>⠿</span>
                  <span className="min-w-0 truncate text-foreground">{s.emoji} {s.name} <span className="text-muted-foreground">({s.min}–{s.max}{s.required ? ` · ${T("adm.stepRequired")}` : ""})</span></span>
                </span>
                <span className="flex shrink-0 items-center">
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStepForm({ id: s.id, key: s.key, name: s.name, emoji: s.emoji ?? "", min: s.min, max: s.max, required: s.required })}>{T("adm.edit")}</Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => removeStep(s)}>{T("adm.delete")}</Button>
                </span>
              </div>
            ))}
            {stepForm && (
              <div className="space-y-2 rounded-lg border border-border p-2">
                <p className="text-xs font-semibold text-foreground">{stepForm.id ? T("adm.stepEdit") : T("adm.stepNew")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input aria-label={T("adm.tplId")} placeholder={T("adm.tplId")} value={stepForm.key} onChange={(e) => setStepForm({ ...stepForm, key: e.target.value })} className="w-28" disabled={!!stepForm.id} />
                  <Input aria-label={T("add.name")} placeholder={T("add.name")} value={stepForm.name} onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })} className="min-w-32 flex-1" />
                  <Input aria-label="Emoji" placeholder="Emoji" value={stepForm.emoji} onChange={(e) => setStepForm({ ...stepForm, emoji: e.target.value })} className="w-16" />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground">
                  <label className="flex items-center gap-1">{T("adm.stepMin")} <Input type="number" min={0} max={20} value={stepForm.min} onChange={(e) => setStepForm({ ...stepForm, min: Math.max(0, Number(e.target.value) || 0) })} className="w-16" /></label>
                  <label className="flex items-center gap-1">{T("adm.stepMax")} <Input type="number" min={1} max={20} value={stepForm.max} onChange={(e) => setStepForm({ ...stepForm, max: Math.max(1, Number(e.target.value) || 1) })} className="w-16" /></label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={stepForm.required} onChange={(e) => setStepForm({ ...stepForm, required: e.target.checked })} className="accent-primary" /> {T("adm.stepRequired")}</label>
                  <Button size="sm" disabled={busy || !stepForm.key.trim() || !stepForm.name.trim()} onClick={saveStep}>{T("adm.save")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setStepForm(null)}>{T("adm.cancel")}</Button>
                </div>
              </div>
            )}
            </div>
          </div>
          <div className="space-y-2 border-b border-border pb-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <Button type="button" variant="ghost" aria-expanded={groupsOpen} aria-controls="recipe-admin-groups" onClick={() => setGroupsOpen((v) => !v)} className="h-auto min-w-0 justify-start gap-2 px-0 text-left text-sm font-semibold hover:bg-transparent">
                <span aria-hidden="true" className="shrink-0 text-xs text-muted-foreground">{groupsOpen ? "▲" : "▼"}</span>
                <span className="min-w-0 truncate">{T("adm.recipeGroups")}</span>
              </Button>
              <Button size="sm" variant="outline" disabled={busy || !tplId} onClick={() => { setGroupsOpen(true); startGroup(null); }}>{T("adm.recipeGroupNew")}</Button>
            </div>
            <div id="recipe-admin-groups" className={`space-y-2 ${groupsOpen ? "" : "hidden"}`}>
            {groupTree(null).map((parent) => (
              <div key={parent.id} className="space-y-1">
                {[{ group: parent, depth: 0 }, ...groupRows(parent.id).map(({ group, depth }) => ({ group, depth: depth + 1 }))].map(({ group: g, depth }) => (
                  <div key={g.id} draggable={!busy} onDragStart={(e) => { e.dataTransfer.setData("text/plain", g.id); setDragGroup(g.id); }} onDragEnd={() => setDragGroup(null)} onDragOver={(e) => { if (dragGroup) e.preventDefault(); }} onDrop={(e) => { e.preventDefault(); if (dragGroup) void reorderGroup(dragGroup, g); setDragGroup(null); }} className={`flex items-center gap-1.5 border-b border-border/50 py-1 text-xs ${depth ? "pl-5" : "font-semibold"}`}>
                    {depth > 1 && <span className="text-muted-foreground">{"› ".repeat(depth - 1)}</span>}
                    <span className="cursor-grab text-muted-foreground" title={T("adm.drag")}>⠿</span>
                    <span className="min-w-0 flex-1 break-words text-foreground">{g.emoji} {g.name}</span>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => startGroup(g.parent_id, g)}>{T("adm.edit")}</Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => removeGroup(g)}>{T("adm.delete")}</Button>
                  </div>
                ))}
              </div>
            ))}
            {groupFormOpen && <div className="flex flex-wrap items-start gap-2">
              {!editGroupId && !groupParent ? (
                <textarea aria-label={T("add.name")} placeholder={T("add.name")} value={groupName} onChange={(e) => setGroupName(e.target.value)} rows={4} className="min-w-32 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              ) : (
                <Input aria-label={T("add.name")} placeholder={T("add.name")} value={groupName} onChange={(e) => setGroupName(e.target.value)} className="min-w-32 flex-1" />
              )}
              <Input aria-label="Emoji" placeholder="Emoji" value={groupEmoji} onChange={(e) => setGroupEmoji(e.target.value)} className="w-20" />
              <Button size="sm" disabled={busy || !groupName.trim()} onClick={saveGroup}>{T("adm.save")}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setGroupFormOpen(false); setGroupName(""); setGroupParent(null); setEditGroupId(null); }}>{T("adm.cancel")}</Button>
            </div>}
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}

/** Bereich „Zutaten-Zuweisung“: pro Rezept-Schritt Produkte per Checkbox zuweisen, suchen, sortieren. */
export function RecipeAssignAdmin({ depts, prods }: { depts: Dept[]; prods: Prod[] }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-recipe-ingredients"], queryFn: loadRecipeIngredients });
  const { data: groupData } = useQuery({ queryKey: ["admin-recipe-groups"], queryFn: loadRecipeGroups });
  const { data: tplRows } = useQuery({ queryKey: ["admin-recipe-templates"], queryFn: loadTplRows });
  const { data: stepRows } = useQuery({ queryKey: ["admin-recipe-steps"], queryFn: loadStepRows });
  const [open, setOpen] = useState(true);
  const [ingredientOpen, setIngredientOpen] = useState<Record<string, boolean>>({});
  const [tplId, setTplId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [pickerStep, setPickerStep] = useState<string | null>(null);
  const [pickerDept, setPickerDept] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSel, setPickerSel] = useState<Set<string>>(new Set());
  const [dragRow, setDragRow] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<{ id: string; pos: "top" | "bottom" } | null>(null);
  const sortFn = useServerFn(sortRecipeIngredients);
  const [selRows, setSelRows] = useState<Set<string>>(new Set());
  const [bulkGroup, setBulkGroup] = useState("");

  const deptById = useMemo(() => new Map(depts.map((d) => [d.id, d])), [depts]);
  const prodById = useMemo(() => new Map(prods.map((p) => [p.id, p])), [prods]);
  const path = (id: string) => {
    const out: string[] = [];
    for (let d = deptById.get(id); d; d = d.parent_id ? deptById.get(d.parent_id) : undefined) out.unshift(d.name);
    return out.join(" › ");
  };

  const templates = tplRows ?? [];
  const steps = tplId ? (stepRows ?? []).filter((s) => s.template_id === tplId).sort((a, b) => a.sort_order - b.sort_order) : [];
  const tpl = tplId ? { id: tplId, steps: steps.map((s) => ({ key: s.key, label: s.name })) } : null;
  const rows = data ?? [];
  const groups = (groupData ?? []).filter((g) => g.template_id === tplId);
  const assignedFor = (stepKey: string) =>
    rows
      .filter((r) => r.template_id === tplId && r.step_key === stepKey)
      .sort((a, b) => a.sort_order - b.sort_order);
  const groupTree = (parentId: string | null) => groups.filter((g) => g.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const groupRows = (parentId: string | null): Array<{ group: Group; depth: number }> =>
    groupTree(parentId).flatMap((group) => [{ group, depth: 0 }, ...groupRows(group.id).map(({ group: child, depth }) => ({ group: child, depth: depth + 1 }))]);

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

  const assignGroup = (row: Row, id: string | null) => run(async () => {
    const { error } = await supabase.from("recipe_ingredients").update({ group_id: id }).eq("id", row.id);
    if (error) throw new Error(error.message);
  });

  const toggleSelRow = (id: string) =>
    setSelRows((x) => { const n = new Set(x); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  /** Allen gewählten Zeilen auf einmal eine Rezept-Kategorie zuweisen (oder entfernen). */
  const bulkAssignGroup = (ids: string[], groupId: string | null) => run(async () => {
    if (!ids.length) return;
    const { error } = await supabase.from("recipe_ingredients").update({ group_id: groupId }).in("id", ids);
    if (error) throw new Error(error.message);
    setSelRows(new Set());
    setBulkGroup("");
  });

  /** Alle gewählten Zeilen auf einmal aus dem Zutatenbereich entfernen. */
  const bulkDeleteRows = (ids: string[]) => {
    if (!ids.length) return;
    if (!window.confirm(T("adm.bulkDeleteConfirm", { n: ids.length }))) return;
    void run(async () => {
      const { error } = await supabase.from("recipe_ingredients").delete().in("id", ids);
      if (error) throw new Error(error.message);
      setSelRows(new Set());
      setBulkGroup("");
    });
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

  /** Zutat per Drag & Drop vor/hinter eine andere Zutat desselben Schritts setzen. */
  const dropRow = (stepKey: string, dragId: string, targetId: string, pos: "top" | "bottom") =>
    run(async () => {
      const list = assignedFor(stepKey);
      const from = list.findIndex((r) => r.id === dragId);
      if (from < 0 || dragId === targetId) return;
      const next = [...list];
      const [item] = next.splice(from, 1);
      let to = next.findIndex((r) => r.id === targetId);
      if (to < 0) return;
      if (pos === "bottom") to += 1;
      next.splice(to, 0, item!);
      for (let k = 0; k < next.length; k++) {
        if (next[k]!.sort_order === k + 1) continue;
        const { error } = await supabase.from("recipe_ingredients").update({ sort_order: k + 1 }).eq("id", next[k]!.id);
        if (error) throw new Error(error.message);
      }
    });

  /** Alphabetisch nach Produktnamen sortieren — lokal, ohne KI. */
  const sortAlpha = (stepKey: string) => {
    const list = assignedFor(stepKey);
    if (list.length < 2) return;
    run(async () => {
      const ordered = [...list].sort((a, b) =>
        (prodById.get(a.product_id)?.name ?? a.product_id).localeCompare(prodById.get(b.product_id)?.name ?? b.product_id, "de"));
      for (let k = 0; k < ordered.length; k++) {
        if (ordered[k]!.sort_order === k + 1) continue;
        const { error } = await supabase.from("recipe_ingredients").update({ sort_order: k + 1 }).eq("id", ordered[k]!.id);
        if (error) throw new Error(error.message);
      }
      toast.success(T("adm.recipeSortDone"));
    });
  };

  const sortStep = (stepKey: string, stepLabel: string, criterion: "popularity" | "relevance") => {
    const list = assignedFor(stepKey);
    if (list.length < 2) return;
    if (!window.confirm(T("adm.recipeSortConfirm"))) return;
    run(async () => {
      const names = list.map((r) => prodById.get(r.product_id)?.name ?? r.product_id);
      const res = await sortFn({ data: { recipe: T(`rk.cat.${tplId}` as MessageKey), step: stepLabel, criterion, names } });
      const pool = [...list];
      const ordered: Row[] = [];
      for (const n of res.names) {
        const i = pool.findIndex((r) => (prodById.get(r.product_id)?.name ?? r.product_id) === n);
        if (i >= 0) ordered.push(pool.splice(i, 1)[0]!);
      }
      ordered.push(...pool);
      for (let k = 0; k < ordered.length; k++) {
        if (ordered[k]!.sort_order === k + 1) continue;
        const { error } = await supabase.from("recipe_ingredients").update({ sort_order: k + 1 }).eq("id", ordered[k]!.id);
        if (error) throw new Error(error.message);
      }
      toast.success(T("adm.recipeSortDone"));
    });
  };

  const openPicker = (stepKey: string) => {
    setPickerStep(stepKey);
    setPickerDept(null);
    setPickerSearch("");
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
  const pickerQuery = normalizeSearch(pickerSearch);
  const pickerMatches = pickerQuery
    ? prods.filter((p) => normalizeSearch(p.name).includes(pickerQuery) || normalizeSearch(path(p.department_id)).includes(pickerQuery))
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
      setPickerSearch("");
    });

  return (
    <section className="rounded-xl border border-border bg-card p-3">
      <Button type="button" variant="ghost" aria-expanded={open} aria-controls="recipe-assign-content" onClick={() => setOpen((v) => !v)} className="flex h-auto w-full items-center justify-between px-0 text-left hover:bg-transparent">
        <span className="text-sm font-semibold text-foreground">🧺 {T("adm.recipeAssign")}</span>
        <span aria-hidden="true" className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </Button>
      <div id="recipe-assign-content" className={`mt-3 space-y-3 ${open ? "" : "hidden"}`}>

      <div className="flex flex-wrap items-center gap-1.5">
        {templates.map((x) => (
          <button
            key={x.id}
            onClick={() => { setTplId(x.id); setSearch(""); setPickerStep(null); setPickerSearch(""); setSelRows(new Set()); setBulkGroup(""); }}
            aria-pressed={tplId === x.id}
            className={`rounded-full border px-2.5 py-1 text-xs ${tplId === x.id ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground"} ${x.enabled ? "" : "opacity-50 line-through"}`}
          >
            {x.emoji} {tplLabel(x.id)}
          </button>
        ))}
      </div>

      {tpl && (
        <div className="space-y-4">
          <Input
            aria-label={T("adm.recipeIngredientSearch")}
            placeholder={T("adm.recipeIngredientSearch")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl"
          />
          {search.trim() && !prods.some((p) => normalizeSearch(p.name).includes(normalizeSearch(search)) || normalizeSearch(path(p.department_id)).includes(normalizeSearch(search))) && (
            <p className="text-xs text-muted-foreground">{T("adm.noHits")}</p>
          )}
          {tpl.steps.map((s) => {
            const assigned = assignedFor(s.key);
            const assignedIds = new Set(assigned.map((r) => r.product_id));
            const q = normalizeSearch(search);
            const matches = (p: Prod) => normalizeSearch(p.name).includes(q) || normalizeSearch(path(p.department_id)).includes(q);
            const visibleAssigned = q ? assigned.filter((r) => { const p = prodById.get(r.product_id); return p ? matches(p) : normalizeSearch(r.product_id).includes(q); }) : assigned;
            const candidates = q
              ? prods.filter((p) => !assignedIds.has(p.id) && matches(p))
              : [];
            const sectionKey = `${tplId}:${s.key}`;
            const expanded = Boolean(q) || (ingredientOpen[sectionKey] ?? false);
            return (
              <div key={s.key} className={`space-y-1.5 ${q && !visibleAssigned.length && !candidates.length ? "hidden" : ""}`}>
                <Button type="button" variant="ghost" aria-expanded={expanded} aria-controls={`recipe-admin-ingredient-${sectionKey}`} onClick={() => setIngredientOpen((prev) => ({ ...prev, [sectionKey]: !expanded }))} className="h-auto w-full justify-start gap-2 px-0 text-left text-xs font-semibold hover:bg-transparent">
                  <span aria-hidden="true" className="shrink-0 text-muted-foreground">{expanded ? "▲" : "▼"}</span>
                  <span className="min-w-0 truncate">{s.label} <span className="font-normal text-muted-foreground">({assigned.length})</span></span>
                </Button>
                <div id={`recipe-admin-ingredient-${sectionKey}`} className={`space-y-1.5 ${expanded ? "" : "hidden"}`}>
                {(() => {
                  const stepSel = assigned.map((r) => r.id).filter((id) => selRows.has(id));
                  if (!stepSel.length) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-2.5 py-2 text-xs">
                      <span className="font-semibold text-foreground">{T("adm.bulkSelected", { n: stepSel.length })}</span>
                      <select aria-label={T("adm.recipeGroupTarget")} value={bulkGroup} disabled={busy} onChange={(e) => setBulkGroup(e.target.value)} className="max-w-44 rounded border border-border bg-background p-1 text-xs text-foreground">
                        <option value="">{T("adm.recipeGroupNone")}</option>
                        {groupRows(null).map(({ group: g, depth }) => <option key={g.id} value={g.id}>{depth ? `${groups.find((x) => x.id === g.parent_id)?.name ?? ""} › ` : ""}{g.name}</option>)}
                      </select>
                      <Button size="sm" disabled={busy} onClick={() => void bulkAssignGroup(stepSel, bulkGroup || null)}>{T("adm.bulkAssign")}</Button>
                      <Button size="sm" variant="destructive" disabled={busy} onClick={() => bulkDeleteRows(stepSel)}>{T("adm.bulkDelete")}</Button>
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setSelRows((x) => { const n = new Set(x); for (const id of stepSel) n.delete(id); return n; }); setBulkGroup(""); }}>{T("adm.clearSelection")}</Button>
                    </div>
                  );
                })()}
                {assigned.length > 1 && (
                  <select
                    value=""
                    disabled={busy}
                    onChange={(e) => { const v = e.target.value as "popularity" | "relevance" | "alpha"; if (v === "alpha") sortAlpha(s.key); else if (v) sortStep(s.key, s.label, v); }}
                    className="rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-foreground"
                    aria-label={T("adm.recipeSortBy")}
                  >
                    <option value="">{T("adm.recipeSortBy")}</option>
                    <option value="popularity">{T("adm.recipeSortPopularity")}</option>
                    <option value="relevance">{T("adm.recipeSortRelevance")}</option>
                    <option value="alpha">{T("adm.recipeSortAlpha")}</option>
                  </select>
                )}
                {assigned.length > 0 && (() => {
                  const ids = assigned.map((r) => r.id);
                  const chosen = ids.filter((id) => selRows.has(id)).length;
                  return (
                    <label className="flex items-center gap-2 px-1 text-[11px] font-semibold text-foreground">
                      <input type="checkbox" checked={chosen === ids.length} ref={(el) => { if (el) el.indeterminate = chosen > 0 && chosen < ids.length; }} onChange={(e) => setSelRows((x) => { const n = new Set(x); for (const id of ids) { if (e.target.checked) n.add(id); else n.delete(id); } return n; })} className="accent-primary" />
                      {T("adm.selectAll")} <span className="font-normal text-muted-foreground">({chosen}/{ids.length})</span>
                    </label>
                  );
                })()}
                <div className="space-y-1">
                  {visibleAssigned.map((r) => {
                    const p = prodById.get(r.product_id);
                    const i = assigned.findIndex((x) => x.id === r.id);
                    const over = dropAt?.id === r.id ? dropAt.pos : null;
                    return (
                      <div
                        key={r.id}
                        onDragOver={(e) => {
                          if (!dragRow || dragRow === r.id) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropAt({ id: r.id, pos: e.clientY > rect.top + rect.height / 2 ? "bottom" : "top" });
                        }}
                        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node) && dropAt?.id === r.id) setDropAt(null); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const id = dragRow;
                          const pos = dropAt?.id === r.id ? dropAt.pos : null;
                          setDragRow(null);
                          setDropAt(null);
                          if (id && pos) void dropRow(s.key, id, r.id, pos);
                        }}
                        className={`relative flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs ${dragRow === r.id ? "opacity-40" : ""}`}
                      >
                        {over && <span className={`pointer-events-none absolute inset-x-1 h-0.5 rounded bg-primary ${over === "top" ? "-top-1" : "-bottom-1"}`} />}
                        <span
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", p?.name ?? r.id); // Firefox startet Drag nur mit setData
                            const row = e.currentTarget.parentElement;
                            if (row) e.dataTransfer.setDragImage(row, 16, row.offsetHeight / 2);
                            setDragRow(r.id);
                          }}
                          onDragEnd={() => { setDragRow(null); setDropAt(null); }}
                          className="-my-1 -ml-1.5 cursor-grab select-none px-1.5 py-1 text-sm text-muted-foreground active:cursor-grabbing"
                          aria-label={T("adm.drag")}
                        >⠿</span>
                        <input type="checkbox" aria-label={T("adm.selectRow")} checked={selRows.has(r.id)} disabled={busy} onChange={() => toggleSelRow(r.id)} className="accent-primary" />
                        <input type="checkbox" checked disabled={busy} onChange={() => toggle(s.key, r.product_id, false)} className="accent-primary" />
                        <span className="min-w-0 flex-1 truncate text-foreground">{p?.emoji} {p?.name ?? r.product_id}</span>
                        <select aria-label={`${p?.name ?? r.product_id} · ${T("adm.recipeGroupTarget")}`} value={r.group_id ?? ""} disabled={busy} onChange={(e) => void assignGroup(r, e.target.value || null)} className="max-w-28 rounded border border-border bg-background p-1 text-xs text-foreground">
                          <option value="">{T("adm.recipeGroupNone")}</option>
                          {groupRows(null).map(({ group: g, depth }) => <option key={g.id} value={g.id}>{depth ? `${groups.find((x) => x.id === g.parent_id)?.name ?? ""} › ` : ""}{g.name}</option>)}
                        </select>
                        <button type="button" disabled={busy || i === 0} onClick={() => move(s.key, r.product_id, -1)} className="px-1 text-muted-foreground disabled:opacity-30">▲</button>
                        <button type="button" disabled={busy || i === assigned.length - 1} onClick={() => move(s.key, r.product_id, 1)} className="px-1 text-muted-foreground disabled:opacity-30">▼</button>
                      </div>
                    );
                  })}
                  {!q && assigned.length === 0 && <p className="text-xs text-muted-foreground">{T("adm.recipeStepEmpty")}</p>}
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
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => openPicker(s.key)} className="text-xs font-medium text-primary">
                      {T("adm.fromCatalog")}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5 rounded-lg border border-primary/40 bg-background p-2">
                    <div className="flex items-center gap-2 text-xs">
                      {pickerDept && (
                        <button type="button" onClick={() => setPickerDept(deptById.get(pickerDept)?.parent_id ?? null)} className="px-1 text-muted-foreground">←</button>
                      )}
                      <span className="shrink-0 truncate font-semibold text-foreground">{pickerDept ? path(pickerDept) : T("adm.fromCatalog")}</span>
                      <Input
                        aria-label={T("adm.recipeIngredientSearch")}
                        placeholder={T("adm.recipeIngredientSearch")}
                        value={pickerSearch}
                        onChange={(e) => setPickerSearch(e.target.value)}
                        className="h-9 min-w-0 flex-1"
                      />
                    </div>
                    <div className="max-h-72 space-y-0.5 overflow-y-auto">
                      {pickerQuery && pickerMatches.length > 0 && (() => {
                        const ids = pickerMatches.map((p) => p.id);
                        const chosen = ids.filter((id) => pickerSel.has(id)).length;
                        return (
                          <label className="flex items-center gap-2 rounded-lg border-b border-border px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/40">
                            <input
                              type="checkbox"
                              checked={chosen === ids.length}
                              ref={(el) => { if (el) el.indeterminate = chosen > 0 && chosen < ids.length; }}
                              onChange={(e) => setPickerSel((x) => {
                                const n = new Set(x);
                                for (const id of ids) { if (e.target.checked) n.add(id); else n.delete(id); }
                                return n;
                              })}
                              className="accent-primary"
                            />
                            <span>{T("adm.selectAll")} <span className="font-normal text-muted-foreground">({chosen}/{ids.length})</span></span>
                          </label>
                        );
                      })()}
                      {!pickerQuery && childDepts.map((d) => {
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
                      {(pickerQuery ? pickerMatches : deptProds).map((p) => (
                        <label key={p.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-accent/40">
                          <input type="checkbox" checked={pickerSel.has(p.id)} onChange={() => togglePick(p.id)} className="accent-primary" />
                          <span className="min-w-0 flex-1 text-foreground">{p.emoji} {p.name}{pickerQuery && <span className="block truncate text-[10px] text-muted-foreground">{path(p.department_id)}</span>}</span>
                        </label>
                      ))}
                      {pickerQuery && pickerMatches.length === 0 && <p className="px-2 py-1 text-xs text-muted-foreground">{T("adm.noHits")}</p>}
                    </div>
                    {!pickerQuery && deptProds.length > 0 && (
                      <div className="flex gap-3 text-xs">
                        <button type="button" onClick={() => setPickerSel((x) => new Set([...x, ...deptProds.map((p) => p.id)]))} className="text-primary">{T("adm.selectAll")}</button>
                        <button type="button" onClick={() => setPickerSel((x) => { const n = new Set(x); deptProds.forEach((p) => n.delete(p.id)); return n; })} className="text-primary">{T("adm.selectNone")}</button>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setPickerStep(null); setPickerSearch(""); }}>{T("adm.cancel")}</Button>
                      <Button size="sm" disabled={busy} onClick={() => applyPicker(s.key)}>{T("adm.apply")} ({pickerSel.size})</Button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </section>
  );
}
