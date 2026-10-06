import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchStandardVariants, STANDARD_VARIANTS_KEY, type StandardVariant } from "@/hooks/use-standard-variants";

const db = supabase as any;

export function StandardVariantsPanel() {
  const { t } = useT();
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({ queryKey: STANDARD_VARIANTS_KEY, queryFn: fetchStandardVariants });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const refresh = () => qc.invalidateQueries({ queryKey: STANDARD_VARIANTS_KEY });
  const dup = (n: string, except?: string) => list.some((v) => v.id !== except && v.name.toLowerCase() === n.toLowerCase());

  const add = async () => {
    const n = name.trim();
    if (!n) return;
    if (dup(n)) { toast.error(t("stdv.exists", { name: n })); return; }
    setBusy(true);
    const { error } = await db.from("standard_variants").insert({ name: n, sort_order: (list.at(-1)?.sort_order ?? -1) + 1 });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setName(""); await refresh();
  };
  const rename = async (v: StandardVariant, n: string) => {
    if (dup(n, v.id)) { toast.error(t("stdv.exists", { name: n })); return false; }
    const { error } = await db.from("standard_variants").update({ name: n }).eq("id", v.id);
    if (error) { toast.error(error.message); return false; }
    await refresh(); return true;
  };
  const remove = async (v: StandardVariant) => {
    if (!confirm(t("stdv.confirmDelete", { name: v.name }))) return;
    const { error } = await db.from("standard_variants").delete().eq("id", v.id);
    if (error) toast.error(error.message); else await refresh();
  };
  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(list, list.findIndex((v) => v.id === e.active.id), list.findIndex((v) => v.id === e.over!.id));
    qc.setQueryData(STANDARD_VARIANTS_KEY, next.map((v, i) => ({ ...v, sort_order: i })));
    const res = await Promise.all(next.map((v, i) => db.from("standard_variants").update({ sort_order: i }).eq("id", v.id)));
    const err = res.find((r: any) => r.error)?.error;
    if (err) toast.error(err.message);
    await refresh();
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <h2 className="font-semibold">{t("stdv.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("stdv.hint")}</p>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("stdv.placeholder")} maxLength={60} />
        <Button type="submit" variant="outline" disabled={busy || !name.trim()}>{t("stdv.add")}</Button>
      </form>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void onDragEnd(e)}>
        <SortableContext items={list.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {list.map((v) => <Row key={v.id} v={v} onRename={rename} onRemove={remove} />)}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function Row({ v, onRename, onRemove }: { v: StandardVariant; onRename: (v: StandardVariant, n: string) => Promise<boolean>; onRemove: (v: StandardVariant) => void }) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: v.id });
  const [edit, setEdit] = useState<string | null>(null);
  const commit = async () => {
    const n = (edit ?? "").trim();
    if (!n || n === v.name) { setEdit(null); return; }
    if (await onRename(v, n)) setEdit(null);
  };
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-2 px-2 py-1.5 text-sm ${isDragging ? "bg-primary/10" : "bg-card"}`}>
      <button type="button" {...attributes} {...listeners} aria-label={t("stdv.drag")} className="cursor-grab touch-none text-muted-foreground"><GripVertical className="h-4 w-4" /></button>
      {edit === null ? (
        <>
          <span className="min-w-0 flex-1 truncate">{v.name}</span>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" aria-label={t("stdv.rename")} onClick={() => setEdit(v.name)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7 text-destructive" aria-label={t("stdv.delete")} onClick={() => onRemove(v)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </>
      ) : (
        <>
          <Input autoFocus value={edit} className="h-7 flex-1" aria-label={t("stdv.rename")} onChange={(e) => setEdit(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void commit(); } if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setEdit(null); } }} />
          <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => void commit()}>✓</Button>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={() => setEdit(null)}>✕</Button>
        </>
      )}
    </li>
  );
}
