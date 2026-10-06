import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Eye, EyeOff, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MessageKey } from "@/i18n/de";
import { supabase } from "@/integrations/supabase/client";
import { useT, useLocale, useAllLocales, translate } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allDietRows, loadDiets, dietLabel, dietEmoji, useDietsVersion, type DietRow, type DietLabels } from "@/hooks/use-diet-filter";
import { translateDietLabel } from "@/lib/admin.functions";

const db = supabase as any;
const slug = (s: string) => s.toLowerCase().replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function DietsPanel() {
  const { t } = useT();
  const locale = useLocale();
  useDietsVersion();
  const [list, setList] = useState<DietRow[]>(allDietRows());
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [busy, setBusy] = useState(false);
  const translateFn = useServerFn(translateDietLabel);
  const [editing, setEditing] = useState<DietRow | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const refresh = async () => setList([...(await loadDiets())]);
  useEffect(() => { void refresh(); }, []);

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = list.findIndex((u) => u.id === e.active.id);
    const to = list.findIndex((u) => u.id === e.over!.id);
    const next = arrayMove(list, from, to).map((u, i) => ({ ...u, sort_order: i + 1 }));
    setList(next);
    const changed = next.filter((u, i) => list[i]?.id !== u.id);
    const results = await Promise.all(changed.map((u) => db.from("diets").update({ sort_order: u.sort_order }).eq("id", u.id)));
    const bad = results.find((r: any) => r.error);
    if (bad) toast.error(bad.error.message);
    await refresh();
  };

  const add = async () => {
    const l = label.trim();
    if (!l) return;
    const id = slug(l);
    if (!id || list.some((u) => u.id === id)) { toast.error(t("diets.exists")); return; }
    setBusy(true);
    try {
      const labels = await translateFn({ data: { label: l } }).catch(() => ({ "de-DE": l }));
      const { error } = await db.from("diets").insert({ id, emoji: emoji.trim() || null, labels, sort_order: list.length + 1, enabled: true, builtin: false });
      if (error) throw new Error(error.message);
      setLabel(""); setEmoji("");
      toast.success(t("diets.added"));
      await refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const toggle = async (u: DietRow) => {
    const { error } = await db.from("diets").update({ enabled: !u.enabled }).eq("id", u.id);
    if (error) toast.error(error.message); else await refresh();
  };

  const remove = async (u: DietRow) => {
    const { count } = await db.from("products").select("id", { count: "exact", head: true }).contains("excluded_diets", [u.id]);
    if (count) { toast.error(t("diets.inUse", { n: count })); return; }
    const { error } = await db.from("diets").delete().eq("id", u.id);
    if (error) toast.error(error.message); else { toast.success(t("diets.deleted")); await refresh(); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("diets.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("diets.hint")}</p>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3">
        <Input className="w-16" placeholder="🥗" value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label={t("diets.emoji")} />
        <Input className="min-w-0 flex-1" placeholder={t("diets.label")} value={label} onChange={(e) => setLabel(e.target.value)} />
        <Button onClick={add} disabled={busy || !label.trim()}>{busy ? t("units.translating") : t("diets.add")}</Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={list.map((u) => u.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y rounded-xl border bg-card">
            {list.map((u) => <DietItem key={u.id} u={u} locale={locale} onToggle={toggle} onEdit={setEditing} onRemove={remove} />)}
          </ul>
        </SortableContext>
      </DndContext>
      {editing && <DietEditDialog u={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await refresh(); }} />}
    </div>
  );
}

function DietItem({ u, locale, onToggle, onEdit, onRemove }: {
  u: DietRow; locale: string; onToggle: (u: DietRow) => void; onEdit: (u: DietRow) => void; onRemove: (u: DietRow) => void;
}) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: u.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 px-2 py-2 ${isDragging ? "bg-muted" : ""} ${u.enabled ? "" : "opacity-50"}`}>
      <button className="cursor-grab touch-none p-1 text-muted-foreground" {...attributes} {...listeners} aria-label="drag">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-6 text-center" aria-hidden="true">{dietEmoji(u.id)}</span>
      <span className="min-w-0 flex-1 truncate">{dietLabel(u.id, locale)}</span>
      <Button size="icon" variant="outline" aria-label={u.enabled ? t("units.visible") : t("units.hidden")} title={u.enabled ? t("units.visible") : t("units.hidden")} onClick={() => onToggle(u)}>
        {u.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </Button>
      <Button size="icon" variant="outline" aria-label={t("units.edit")} title={t("units.edit")} onClick={() => onEdit(u)}><Pencil className="h-4 w-4" /></Button>
      <Button size="icon" variant="outline" aria-label={t("units.delete")} title={t("units.delete")} onClick={() => onRemove(u)}><Trash2 className="h-4 w-4" /></Button>
    </li>
  );
}

function DietEditDialog({ u, onClose, onSaved }: { u: DietRow; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const locale = useLocale();
  const locales = useAllLocales();
  const translateFn = useServerFn(translateDietLabel);
  const def = (loc: string) => (u.builtin ? translate(loc, `diet.${u.id}` as MessageKey) : "");
  const [emoji, setEmoji] = useState(u.emoji ?? "");
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(locales.map((l) => [l.id, u.labels?.[l.id] ?? def(l.id)])));
  const [busy, setBusy] = useState(false);

  const fillAi = async () => {
    const de = draft["de-DE"]?.trim();
    if (!de) return;
    setBusy(true);
    try {
      const out = await translateFn({ data: { label: de } });
      setDraft((d) => {
        const n = { ...d };
        for (const [loc, v] of Object.entries(out)) if (!n[loc]?.trim()) n[loc] = v;
        return n;
      });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true);
    const labels: DietLabels = {};
    for (const [loc, v] of Object.entries(draft)) if (v.trim() && v.trim() !== def(loc)) labels[loc] = v.trim();
    const { error } = await db.from("diets").update({ labels, emoji: emoji.trim() || null }).eq("id", u.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("units.saved"));
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>{t("diets.editTitle", { name: dietLabel(u.id, locale) })}</DialogTitle></DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <label className="mb-2 flex items-center gap-2 px-1 text-sm">
            <span className="w-28 text-muted-foreground">{t("diets.emoji")}</span>
            <Input className="h-8 w-20" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </label>
          {locales.map((l) => (
            <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-2 px-1 py-1">
              <span className="truncate text-sm">{l.flag} {l.label}</span>
              <Input className="h-8" value={draft[l.id] ?? ""} placeholder={def(l.id)} onChange={(e) => setDraft((d) => ({ ...d, [l.id]: e.target.value }))} />
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={fillAi} disabled={busy}><Sparkles className="mr-1 h-4 w-4" />{busy ? t("units.translating") : t("units.aiFill")}</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>{t("units.cancel")}</Button>
            <Button onClick={save} disabled={busy}>{t("units.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
