import { useState } from "react";
import { openShareSheet } from "./share-sheet";
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
import { PlusIcon, TrashIcon, CheckIcon } from "./icons";
import { getLocale, translate, useT } from "../i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  lists: ShoppingList[];
  activeId: string;
  templates: ShoppingList[];
  signedIn: boolean;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onSaveAsTemplate: (id: string) => void;
  onCreateFromTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  inviteLinkFor: (listId: string) => string | null;
}

export async function shareList(list: ShoppingList) {
  const lines = list.items.map(
    (i) => `${i.checked ? "✓" : "•"} ${i.name}${i.organic ? ` (${translate(getLocale(), "common.organic")})` : ""}${i.quantity ? ` – ${i.quantity}` : ""}${i.note ? ` (${i.note})` : ""}`
  );
  const text = `🛒 ${list.name}\n\n${lines.join("\n") || translate(getLocale(), "lm.shareEmpty")}\n\n${translate(getLocale(), "lm.sharedWith")}`;
  openShareSheet({ title: list.name, text });
}


function Row({
  list,
  active,
  canDelete,
  onSelect,
  onRename,
  onDelete,
  onSaveAsTemplate,
}: {
  list: ShoppingList;
  active: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onSaveAsTemplate: () => void;
  onShareInvite: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: list.id });
  const { t } = useT();
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
        aria-label={t("lm.move")}
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
            {t("lm.open", { open })}
          </p>
        </button>
      )}

      <button
        onClick={() => (editing ? save() : setEditing(true))}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
        aria-label={t("lm.rename")}
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h4L19 9l-4-4L4 16v4z" />
          <path d="M13.5 6.5l4 4" />
        </svg>
      </button>
      <button
        onClick={onSaveAsTemplate}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground active:bg-muted"
        aria-label={t("lm.saveAsTemplate")}
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 7h6M9 11h6M9 15h3" />
        </svg>
      </button>
      <button
        onClick={() => {
          if (!canDelete) {
            toast.error(t("lm.lastList"));
            return;
          }
          if (confirm(t("lm.confirmDelete", { name: list.name }))) onDelete();
        }}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-coral active:bg-muted"
        aria-label={t("lm.delete")}
      >
        <TrashIcon className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

export function ListManager(props: Props) {
  const { open, onClose, lists, activeId, templates, signedIn } = props;
  const { t } = useT();
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/30" onClick={onClose}>
      <div
        className="max-h-[85dvh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-background p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{t("lm.title")}</h2>
          <button onClick={onClose} className="text-sm font-semibold text-primary">
            {t("common.done")}
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
                  onSaveAsTemplate={() => props.onSaveAsTemplate(l.id)}
                  onShareInvite={() => copyInvite(l.id)}
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
            placeholder={t("lm.newPlaceholder")}
            className="min-w-0 flex-1 rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={create}
            disabled={!newName.trim()}
            className="flex items-center gap-1 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" /> {t("lm.create")}
          </button>
        </div>

        {templates.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-1 text-sm font-semibold text-muted-foreground">{t("lm.templates")}</h3>
            <p className="mb-2 text-xs text-muted-foreground">{t("lm.templatesHint")}</p>
            <div className="space-y-2">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">{t("rk.ingredientsN", { n: tpl.items.length })}</p>
                  </div>
                  <button
                    onClick={() => {
                      props.onCreateFromTemplate(tpl.id);
                      onClose();
                    }}
                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    <PlusIcon className="h-3.5 w-3.5" /> {t("lm.create")}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t("lm.deleteTemplateConfirm", { name: tpl.name }))) props.onDeleteTemplate(tpl.id);
                    }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-coral active:bg-muted"
                    aria-label={t("lm.deleteTemplate")}
                  >
                    <TrashIcon className="h-[18px] w-[18px]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
