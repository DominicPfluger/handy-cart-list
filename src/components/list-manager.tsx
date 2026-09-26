import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import type { ShoppingList } from "../hooks/use-shopping-list";
import { PlusIcon, ShareIcon, TrashIcon, CheckIcon } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  lists: ShoppingList[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}

export async function shareList(list: ShoppingList) {
  const lines = list.items.map(
    (i) => `${i.checked ? "✓" : "•"} ${i.name}${i.organic ? " (Bio)" : ""}${i.quantity ? ` – ${i.quantity}` : ""}`
  );
  const text = `🛒 ${list.name}\n\n${lines.join("\n") || "(leer)"}\n\nGeteilt mit Shoppi`;
  try {
    if (navigator.share) {
      await navigator.share({ title: list.name, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Liste in die Zwischenablage kopiert");
  } catch (e) {
    if ((e as Error)?.name !== "AbortError") toast.error("Teilen nicht möglich");
  }
}

function Row({
  list,
  active,
  canDelete,
  onSelect,
  onRename,
  onDelete,
}: {
  list: ShoppingList;
  active: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const open = list.items.filter((i) => !i.checked).length;

  const save = () => {
    onRename(name);
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined }}
      className={`flex items-center gap-2 rounded-2xl border bg-card px-2 py-2 ${
        active ? "border-primary" : "border-border"
      } ${isDragging ? "shadow-lg" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="grid h-9 w-7 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground active:cursor-grabbing"
        aria-label="Verschieben"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          {[6, 12, 18].map((y) => (
            <g key={y}>
              <circle cx="9" cy={y} r="1.6" />
              <circle cx="15" cy={y} r="1.6" />
            </g>
          ))}
        </svg>
      </button>

      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setName(list.name);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
      ) : (
        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-foreground">
            {active && <CheckIcon className="h-4 w-4 shrink-0 text-primary" />}
            {list.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {open} offen · {list.items.length} Artikel
          </p>
        </button>
      )}

      <button
        onClick={() => (editing ? save() : setEditing(true))}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
        aria-label="Umbenennen"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          <path d="M13.5 6.5l4 4" />
        </svg>
      </button>
      <button
        onClick={() => shareList(list)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
        aria-label="Teilen"
      >
        <ShareIcon className="h-[18px] w-[18px]" />
      </button>
      <button
        onClick={() => {
          if (!canDelete) {
            toast.error("Die letzte Liste kann nicht gelöscht werden");
            return;
          }
          if (confirm(`Liste „${list.name}" wirklich löschen?`)) onDelete();
        }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-coral active:bg-muted"
        aria-label="Löschen"
      >
        <TrashIcon className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

export function ListManager(props: Props) {
  const { open, onClose, lists, activeId } = props;
  const [newName, setNewName] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!open) return null;

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) props.onReorder(String(e.active.id), String(e.over.id));
  };

  const create = () => {
    if (!newName.trim()) return;
    props.onCreate(newName);
    setNewName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-background p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Meine Listen</h2>
          <button onClick={onClose} className="text-sm font-semibold text-primary">
            Fertig
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={lists.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {lists.map((l) => (
                <Row
                  key={l.id}
                  list={l}
                  active={l.id === activeId}
                  canDelete={lists.length > 1}
                  onSelect={() => {
                    props.onSelect(l.id);
                    onClose();
                  }}
                  onRename={(n) => props.onRename(l.id, n)}
                  onDelete={() => props.onDelete(l.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-5 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Neue Liste, z. B. Wochenmarkt"
            className="min-w-0 flex-1 rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={create}
            disabled={!newName.trim()}
            className="flex items-center gap-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" /> Erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
