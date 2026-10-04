import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type OverviewRowData = { id: string; name: string; sub: string; emoji: string };

type Actions = {
  onOpen: (id: string) => void;
  onSaveTemplate?: ((id: string) => void) | undefined;
  onDelete: (id: string) => void;
  t: (k: "lm.move" | "lm.saveAsTemplate" | "lm.delete") => string;
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

function OverviewRow({ row, onOpen, onSaveTemplate, onDelete, t }: Actions & { row: OverviewRowData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
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
      <button onClick={() => onOpen(row.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-lg">{row.emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{row.name}</span>
          <span className="block text-xs text-muted-foreground">{row.sub}</span>
        </span>
      </button>
      {onSaveTemplate && (
        <button onClick={() => onSaveTemplate(row.id)} aria-label={t("lm.saveAsTemplate")} title={t("lm.saveAsTemplate")} className={iconBtn}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
          </svg>
        </button>
      )}
      <button onClick={() => onDelete(row.id)} aria-label={t("lm.delete")} title={t("lm.delete")} className={iconBtn}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        </svg>
      </button>
    </div>
  );
}
