import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { PencilIcon, TrashIcon } from "./icons";

export type OverviewRowData = { id: string; name: string; sub: string; emoji: string };

type Actions = {
  onOpen: (id: string) => void;
  onSaveTemplate?: ((id: string) => void) | undefined;
  onDelete: (id: string) => void;
  onRename?: ((id: string, name: string) => void) | undefined;
  t: (k: "lm.move" | "lm.rename" | "lm.saveAsTemplate" | "lm.delete") => string;
};

/** Sortierbare Zeilen der Listen-Übersicht (Listen bzw. Vorlagen). */
export function OverviewSortable({ rows, onReorder, ...a }: Actions & { rows: OverviewRowData[]; onReorder: (fromId: string, toId: string) => void }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) onReorder(String(e.active.id), String(e.over.id));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {rows.map((r) => <OverviewRow key={r.id} row={r} {...a} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function OverviewRow({ row, onOpen, onSaveTemplate, onDelete, onRename, t }: Actions & { row: OverviewRowData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(row.name);
  const save = () => {
    const n = name.trim();
    if (n && n !== row.name) onRename?.(row.id, n); else setName(row.name);
    setEditing(false);
  };
  const iconBtn = "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground active:bg-muted";
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 bg-card px-2 py-2.5 ${isDragging ? "relative z-10 opacity-80 shadow-lg" : ""}`}
    >
      <button {...attributes} {...listeners} aria-label={t("lm.move")} title={t("lm.move")}
        className="grid h-9 w-6 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      {editing ? (
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setName(row.name); setEditing(false); } }}
          aria-label={t("lm.rename")}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary" />
      ) : (
      <button onClick={() => onOpen(row.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg">{row.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{row.name}</span>
          <span className="block text-xs text-muted-foreground">{row.sub}</span>
        </span>
      </button>
      )}
      {onRename && !editing && (
        <button onClick={() => { setName(row.name); setEditing(true); }} aria-label={t("lm.rename")} title={t("lm.rename")} className={iconBtn}>
          <PencilIcon className="h-4 w-4" />
        </button>
      )}
      {onSaveTemplate && (
        <button onClick={() => onSaveTemplate(row.id)} aria-label={t("lm.saveAsTemplate")} title={t("lm.saveAsTemplate")} className={iconBtn}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h3" />
          </svg>
        </button>
      )}
      <button onClick={() => onDelete(row.id)} aria-label={t("lm.delete")} title={t("lm.delete")} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-coral active:bg-muted">
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
