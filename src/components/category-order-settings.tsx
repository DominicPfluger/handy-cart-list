import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCatalog, originalName, type CatalogDepartment } from "../lib/catalog-query";
import { useDepartmentOrder } from "../hooks/use-department-order";
import { useGroupOrder, applyGroupOrder } from "../hooks/use-group-order";
import { storeLabel, useStores } from "../hooks/use-stores";
import { hideDepartment, restoreDepartment, useHiddenDepartments } from "../hooks/use-hidden-departments";
import { deleteCustomEntry, isCustomId } from "../hooks/use-custom-catalog";
import { useCustomNames } from "../hooks/use-custom-names";
import { RenameDialog, type RenameTarget } from "./rename-dialog";
import { PencilIcon, TrashIcon } from "./icons";
import { DepartmentIcon } from "./catalog-icon";
import { useT } from "../i18n";

const STORE_EMOJIS = ["🏪", "🛒", "🧺", "🏬", "🥖", "🐄", "🌱"];

function StoreFields({ name, onName, emoji, onEmoji }: { name: string; onName: (v: string) => void; emoji: string; onEmoji: (v: string) => void }) {
  const { t } = useT();
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="flex items-center gap-2">
        <input value={emoji} onChange={(e) => onEmoji(e.target.value)} maxLength={4} aria-label={t("store.icon")} placeholder="🏪" className="w-11 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-primary" />
        <input value={name} onChange={(e) => onName(e.target.value)} aria-label={t("store.nameLabel")} placeholder={t("store.newName")} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary" />
      </div>
      <div className="flex gap-1">
        {STORE_EMOJIS.map((e) => (
          <button key={e} type="button" onClick={() => onEmoji(e)} className={`grid h-7 w-7 place-items-center rounded-lg border text-sm ${emoji === e ? "border-primary bg-primary-soft/60" : "border-border"}`} aria-label={`${t("store.icon")} ${e}`}>{e}</button>
        ))}
      </div>
    </div>
  );
}

type RowProps = {
  dept: CatalogDepartment;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onRemove: () => void;
};

function Row({ dept, depth, hasChildren, expanded, onToggle, onRename, onRemove }: RowProps) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dept.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, paddingLeft: `${0.75 + depth * 1.25}rem` }} className={`flex items-center gap-2 bg-card py-2 pr-2 ${isDragging ? "relative z-10 shadow-lg" : ""}`}>
      <button type="button" aria-label={t("list.moveGroup")} className="touch-none cursor-grab px-1 text-muted-foreground" {...attributes} {...listeners}>⋮⋮</button>
      <span className="inline-grid h-6 w-6 shrink-0 place-items-center">
        <DepartmentIcon emoji={dept.emoji} imageUrl={dept.iconUrl ?? dept.imageUrl} imagePath={dept.iconPath ?? dept.imagePath} className="h-6 w-6 object-contain" symbolClassName="text-lg" />
      </span>
      <button type="button" onClick={hasChildren ? onToggle : onRename} aria-expanded={hasChildren ? expanded : undefined} className="min-w-0 flex-1 text-left text-sm text-foreground">
        {dept.name}{hasChildren && <span className="ml-1 text-muted-foreground">{expanded ? "▴" : "▾"}</span>}
      </button>
      <button type="button" aria-label={t("rename.action", { name: dept.name })} title={t("rename.action", { name: dept.name })} onClick={onRename} className="p-1.5 text-muted-foreground hover:text-primary"><PencilIcon className="h-4 w-4" /></button>
      <button type="button" aria-label={t("dept.remove", { name: dept.name })} title={t("dept.remove", { name: dept.name })} onClick={onRemove} className="p-1.5 text-muted-foreground hover:text-destructive"><TrashIcon className="h-4 w-4" /></button>
    </div>
  );
}

/** Einstellungen: Kategorien aller Stufen ordnen/umbenennen/entfernen; Hauptkategorien-Reihenfolge pro Laden (geräte-lokal). */
export function CategoryOrderSettings() {
  const { t } = useT();
  const catalog = useCatalog();
  const stores = useStores();
  const { departments, move } = useDepartmentOrder(catalog.departments);
  const { all, store, setStore, saveFor, resetFor, addCustomStore, updateCustomStore, removeCustomStore } = useGroupOrder();
  const hidden = useHiddenDepartments();
  const customNames = useCustomNames();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [editStore, setEditStore] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const selected = stores.find((s) => s.id === store) ?? stores[0]!;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);
  const kids = (parentId: string | null) =>
    departments
      .filter((d) => d.parentId === parentId && !hiddenSet.has(d.id))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const rootList = kids(null);
  const rootById = new Map(rootList.map((d) => [d.id, d]));
  const roots = applyGroupOrder(rootList.map((d) => ({ key: d.id, order: d.sortOrder })), all[selected.id] ?? [])
    .map((x) => rootById.get(x.key)!)
    .filter(Boolean);
  const hiddenDepts = departments.filter((d) => hiddenSet.has(d.id));

  const reorder = (list: CatalogDepartment[], parentId: string | null) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const keys = list.map((d) => d.id);
    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    if (parentId === null) {
      keys.splice(to, 0, ...keys.splice(from, 1));
      saveFor(selected.id, keys);
    } else move(String(active.id), parentId, to);
  };
  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const openRename = (d: CatalogDepartment) =>
    setRenameTarget({ id: d.id, name: d.name, originalName: originalName(d), isCustom: d.id in customNames, kind: "department" });
  const remove = (d: CatalogDepartment) => {
    if (isCustomId(d.id)) deleteCustomEntry(d.id);
    else hideDepartment(d.id);
  };

  const renderLevel = (list: CatalogDepartment[], parentId: string | null, depth: number) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorder(list, parentId)}>
      <SortableContext items={list.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div className={`divide-y divide-border ${depth > 0 ? "border-t border-border bg-muted/30" : ""}`}>
          {list.map((d) => {
            const children = kids(d.id);
            const isOpen = expanded.has(d.id);
            return (
              <div key={d.id}>
                <Row dept={d} depth={depth} hasChildren={children.length > 0} expanded={isOpen} onToggle={() => toggle(d.id)} onRename={() => openRename(d)} onRemove={() => remove(d)} />
                {isOpen && children.length > 0 && renderLevel(children, d.id, depth + 1)}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );

  const choose = (v: string) => {
    if (v === "__new") { setCreating(true); setNewName(""); setNewEmoji(""); return; }
    setCreating(false);
    setEditStore(false);
    setStore(v);
  };
  const submitNew = () => {
    const n = newName.trim();
    if (!n) return;
    const id = addCustomStore(n, newEmoji.trim() || undefined);
    setCreating(false);
    setStore(id);
  };

  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-xl" aria-hidden="true">🗂️</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("catOrder.title")}</p>
          <p className="whitespace-normal text-xs text-muted-foreground">{t("catOrder.hint")}</p>
        </div>
        <span className="shrink-0 text-muted-foreground" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3.5">
          <div className="flex gap-2">
            <select value={creating ? "__new" : selected.id} onChange={(e) => choose(e.target.value)} aria-label={t("store.orderTitle")} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary">
              {stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
              <option value="__new">{t("store.addCustom")}</option>
            </select>
            {selected.custom && (
              <>
                <button type="button" aria-label={t("store.edit")} title={t("store.edit")} onClick={() => { setEditStore(true); setEditName(selected.name); setEditEmoji(selected.emoji ?? ""); setCreating(false); }} className="rounded-lg border border-border px-2 text-xs">✎</button>
                <button type="button" onClick={() => { removeCustomStore(selected.id); setEditStore(false); setStore("default"); }} className="rounded-lg border border-border px-2 text-xs text-destructive">{t("store.remove")}</button>
              </>
            )}
          </div>
          {creating && (
            <div className="flex items-start gap-2">
              <StoreFields name={newName} onName={setNewName} emoji={newEmoji} onEmoji={setNewEmoji} />
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" onClick={submitNew} disabled={!newName.trim()} className="rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{t("store.add")}</button>
                <button type="button" onClick={() => setCreating(false)} className="rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground">{t("common.cancel")}</button>
              </div>
            </div>
          )}
          {editStore && selected.custom && (
            <div className="flex items-start gap-2">
              <StoreFields name={editName} onName={setEditName} emoji={editEmoji} onEmoji={setEditEmoji} />
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" onClick={() => { updateCustomStore(selected.id, { name: editName, emoji: editEmoji.trim() || null }); setEditStore(false); }} className="rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground">{t("common.save")}</button>
                <button type="button" onClick={() => setEditStore(false)} className="rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground">{t("common.cancel")}</button>
              </div>
            </div>
          )}
          <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-border">
            {renderLevel(roots, null, 0)}
          </div>
          <button type="button" onClick={() => resetFor(selected.id)} className="text-xs font-semibold text-primary">{t("catOrder.reset")}</button>
        </div>
      )}
      {hiddenDepts.length > 0 && (
        <div className="border-t border-border px-4 py-3.5">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("store.hiddenTitle")}</p>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {hiddenDepts.map((d) => (
              <li key={d.id} className="flex items-center gap-2 bg-card px-3 py-2">
                <span className="flex-1 text-sm text-muted-foreground">{d.name}</span>
                <button type="button" onClick={() => restoreDepartment(d.id)} className="text-xs font-semibold text-primary">{t("store.unhide")}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <RenameDialog target={renameTarget} onClose={() => setRenameTarget(null)} />
    </div>
  );
}
