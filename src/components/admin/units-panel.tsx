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
import { allUnitRows, loadUnits, unitLabel, unitShort, useUnitsVersion, type UnitRow, type UnitLabels } from "@/lib/units";
import { translateUnitLabels } from "@/lib/admin.functions";

const db = supabase as any;
const slug = (s: string) => s.toLowerCase().replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function UnitsPanel() {
  const { t } = useT();
  const locale = useLocale();
  useUnitsVersion();
  const [list, setList] = useState<UnitRow[]>(allUnitRows());
  const [label, setLabel] = useState("");
  const [short, setShort] = useState("");
  const [busy, setBusy] = useState(false);
  const translateLabels = useServerFn(translateUnitLabels);
  const [editing, setEditing] = useState<UnitRow | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const refresh = async () => setList([...(await loadUnits())]);
  useEffect(() => { void refresh(); }, []);

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = list.findIndex((u) => u.id === e.active.id);
    const to = list.findIndex((u) => u.id === e.over!.id);
    const next = arrayMove(list, from, to).map((u, i) => ({ ...u, sort_order: i + 1 }));
    setList(next);
    const changed = next.filter((u, i) => list[i]?.id !== u.id);
    const results = await Promise.all(changed.map((u) => db.from("units").update({ sort_order: u.sort_order }).eq("id", u.id)));
    if (results.some((r: any) => r.error)) toast.error(results.find((r: any) => r.error).error.message);
    await refresh();
  };

  const add = async () => {
    const l = label.trim(), s = short.trim();
    if (!l || !s) return;
    const id = slug(l);
    if (!id || list.some((u) => u.id === id)) { toast.error(t("units.exists")); return; }
    setBusy(true);
    try {
      const labels = await translateLabels({ data: { label: l, short: s } }).catch(() => ({ "de-DE": { label: l, short: s } }));
      const { error } = await db.from("units").insert({ id, labels, sort_order: list.length + 1, enabled: true, builtin: false });
      if (error) throw new Error(error.message);
      setLabel(""); setShort("");
      toast.success(t("units.added"));
      await refresh();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const toggle = async (u: UnitRow) => {
    const { error } = await db.from("units").update({ enabled: !u.enabled }).eq("id", u.id);
    if (error) toast.error(error.message); else await refresh();
  };

  const remove = async (u: UnitRow) => {
    const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("default_unit", u.id);
    if (count) { toast.error(t("units.inUse", { n: count })); return; }
    const { error } = await db.from("units").delete().eq("id", u.id);
    if (error) toast.error(error.message); else { toast.success(t("units.deleted")); await refresh(); }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("units.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("units.hint")}</p>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3">
        <Input className="min-w-0 flex-1" placeholder={t("units.label")} value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input className="w-28" placeholder={t("units.short")} value={short} onChange={(e) => setShort(e.target.value)} />
        <Button onClick={add} disabled={busy || !label.trim() || !short.trim()}>{busy ? t("units.translating") : t("units.add")}</Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={list.map((u) => u.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y rounded-xl border bg-card">
            {list.map((u) => (
              <UnitItem key={u.id} u={u} locale={locale} onToggle={toggle} onEdit={setEditing} onRemove={remove} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {editing && <UnitEditDialog u={editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await refresh(); }} />}
    </div>
  );
}

function UnitItem({ u, locale, onToggle, onEdit, onRemove }: {
  u: UnitRow; locale: string;
  onToggle: (u: UnitRow) => void; onEdit: (u: UnitRow) => void; onRemove: (u: UnitRow) => void;
}) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: u.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 px-2 py-2 ${isDragging ? "bg-muted" : ""} ${u.enabled ? "" : "opacity-50"}`}>
      <button className="cursor-grab touch-none p-1 text-muted-foreground" {...attributes} {...listeners} aria-label="drag">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="min-w-0 flex-1 truncate">{unitLabel(u.id, locale)}</span>
      <span className="w-16 text-sm text-muted-foreground">{unitShort(u.id, locale)}</span>
      <Button size="icon" variant="ghost" aria-label={u.enabled ? t("units.visible") : t("units.hidden")} title={u.enabled ? t("units.visible") : t("units.hidden")} onClick={() => onToggle(u)}>
        {u.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </Button>
      <Button size="icon" variant="ghost" aria-label={t("units.edit")} title={t("units.edit")} onClick={() => onEdit(u)}><Pencil className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" aria-label={t("units.delete")} title={t("units.delete")} onClick={() => onRemove(u)}><Trash2 className="h-4 w-4" /></Button>
    </li>
  );
}

type Draft = Record<string, { label: string; short: string }>;

function UnitEditDialog({ u, onClose, onSaved }: { u: UnitRow; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const locale = useLocale();
  const locales = useAllLocales();
  const translateFn = useServerFn(translateUnitLabels);
  const def = (loc: string, kind: "label" | "short") =>
    u.builtin ? translate(loc, `${kind === "label" ? "unit" : "unitS"}.${u.id}` as MessageKey) : "";
  const [draft, setDraft] = useState<Draft>(() => Object.fromEntries(locales.map((l) => [l.id, {
    label: u.labels?.[l.id]?.label ?? def(l.id, "label"),
    short: u.labels?.[l.id]?.short ?? def(l.id, "short"),
  }])));
  const [busy, setBusy] = useState(false);
  const set = (loc: string, kind: "label" | "short", v: string) => setDraft((d) => ({ ...d, [loc]: { ...d[loc]!, [kind]: v } }));

  const fillAi = async () => {
    const de = draft["de-DE"];
    if (!de?.label.trim() || !de.short.trim()) return;
    setBusy(true);
    try {
      const out = await translateFn({ data: { label: de.label.trim(), short: de.short.trim() } });
      setDraft((d) => {
        const n = { ...d };
        for (const [loc, v] of Object.entries(out)) {
          const cur = n[loc] ?? { label: "", short: "" };
          n[loc] = { label: cur.label.trim() || v.label, short: cur.short.trim() || v.short };
        }
        return n;
      });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true);
    const labels: UnitLabels = {};
    for (const [loc, v] of Object.entries(draft)) {
      const entry: { label?: string; short?: string } = {};
      if (v.label.trim() && v.label.trim() !== def(loc, "label")) entry.label = v.label.trim();
      if (v.short.trim() && v.short.trim() !== def(loc, "short")) entry.short = v.short.trim();
      if (entry.label || entry.short) labels[loc] = entry;
    }
    const { error } = await db.from("units").update({ labels }).eq("id", u.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("units.saved"));
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle>{t("units.editTitle", { name: unitLabel(u.id, locale) })}</DialogTitle></DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,0.8fr)] gap-2 px-1 pb-1 text-xs font-medium text-muted-foreground">
            <span>{t("units.language")}</span><span>{t("units.label")}</span><span>{t("units.short")}</span>
          </div>
          {locales.map((l) => (
            <div key={l.id} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,0.8fr)] items-center gap-2 px-1 py-1">
              <span className="truncate text-sm">{l.flag} {l.label}</span>
              <Input className="h-8" value={draft[l.id]?.label ?? ""} placeholder={def(l.id, "label")} onChange={(e) => set(l.id, "label", e.target.value)} />
              <Input className="h-8" value={draft[l.id]?.short ?? ""} placeholder={def(l.id, "short")} onChange={(e) => set(l.id, "short", e.target.value)} />
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={fillAi} disabled={busy}><Sparkles className="mr-1 h-4 w-4" />{busy ? t("units.translating") : t("units.aiFill")}</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>{t("units.cancel")}</Button>
            <Button onClick={save} disabled={busy}>{t("units.save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
