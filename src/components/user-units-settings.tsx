import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ruler, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "../i18n";
import { setUserUnitPrefs, userUnitList, userUnitPrefs, useUnitsVersion } from "../lib/units";

type U = ReturnType<typeof userUnitList>[number];

export function UserUnitsSettings() {
  const { t, locale } = useT();
  useUnitsVersion();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [short, setShort] = useState("");
  const list = userUnitList(locale, true);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const p = userUnitPrefs();

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const ids = list.map((u) => u.id);
    const next = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
    setUserUnitPrefs({ ...p, order: next });
  };
  const add = () => {
    const l = label.trim(), s = short.trim() || l;
    if (!l) return;
    if (list.some((u) => u.label.toLowerCase() === l.toLowerCase())) { toast.error(t("uu.exists")); return; }
    const id = `custom_${Date.now().toString(36)}`;
    setUserUnitPrefs({ ...p, custom: [...p.custom, { id, label: l, short: s }], order: [id, ...list.map((u) => u.id)] });
    setLabel(""); setShort("");
  };
  const toggle = (u: U) => setUserUnitPrefs({ ...p, hidden: u.hidden ? p.hidden.filter((x) => x !== u.id) : [...p.hidden, u.id] });
  const remove = (u: U) => setUserUnitPrefs({ ...p, custom: p.custom.filter((c) => c.id !== u.id), order: p.order.filter((x) => x !== u.id), hidden: p.hidden.filter((x) => x !== u.id) });
  const reset = () => setUserUnitPrefs({ ...p, order: [], hidden: [] });

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary"><Ruler className="h-5 w-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("uu.title")}</p>
          <p className="truncate text-xs text-muted-foreground">{t("uu.hint")}</p>
        </div>
        <span className="text-muted-foreground" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("uu.label")} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:border-primary" />
            <input value={short} onChange={(e) => setShort(e.target.value)} placeholder={t("uu.short")} className="w-20 rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:border-primary" />
            <button type="button" onClick={add} disabled={!label.trim()} className="rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{t("uu.add")}</button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={list.map((u) => u.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {list.map((u) => <Row key={u.id} u={u} onToggle={toggle} onRemove={remove} />)}
              </ul>
            </SortableContext>
          </DndContext>
          <button type="button" onClick={reset} className="text-xs text-primary underline-offset-2 hover:underline">{t("uu.reset")}</button>
        </div>
      )}
    </div>
  );
}

function Row({ u, onToggle, onRemove }: { u: U; onToggle: (u: U) => void; onRemove: (u: U) => void }) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: u.id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-2 bg-card px-2 py-2 ${isDragging ? "relative z-10 shadow-lg" : ""} ${u.hidden || u.notOffered ? "opacity-50" : ""}`}>
      <button type="button" aria-label={t("uu.move")} className="touch-none cursor-grab px-1 text-muted-foreground" {...attributes} {...listeners}>⋮⋮</button>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{u.label} <span className="text-muted-foreground">({u.short})</span>{u.notOffered && <span className="ml-1 text-xs text-muted-foreground" title={t("uu.notOffered")}>🌐</span>}</span>
      {u.custom ? (
        <button type="button" aria-label={t("uu.delete")} onClick={() => onRemove(u)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
      ) : (
        <button type="button" aria-label={u.hidden ? t("uu.show") : t("uu.hide")} onClick={() => onToggle(u)} className="p-1.5 text-muted-foreground hover:text-primary">{u.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
      )}
    </li>
  );
}
