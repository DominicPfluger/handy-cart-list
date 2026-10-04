import { useMemo, useState } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCatalog } from "../lib/catalog-query";
import { useGroupOrder, applyGroupOrder, filterHidden } from "../hooks/use-group-order";
import { storeLabel, useStores } from "../hooks/use-stores";
import { useT } from "../i18n";
import { DepartmentIcon } from "./catalog-icon";

const STORE_EMOJIS = ["🏪", "🛒", "🧺", "🏬", "🥖", "🐄", "🌱"];

/** Icon- und Namensfeld mit Emoji-Vorschlägen (Anlegen/Bearbeiten eines eigenen Ladens). */
function StoreFields({ name, onName, emoji, onEmoji }: { name: string; onName: (v: string) => void; emoji: string; onEmoji: (v: string) => void }) {
  const { t } = useT();
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          value={emoji}
          onChange={(e) => onEmoji(e.target.value)}
          maxLength={4}
          aria-label={t("store.icon")}
          placeholder="🏪"
          className="w-11 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-primary"
        />
        <input
          value={name}
          onChange={(e) => onName(e.target.value)}
          aria-label={t("store.nameLabel")}
          placeholder={t("store.newName")}
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex gap-1">
        {STORE_EMOJIS.map((e) => (
          <button key={e} type="button" onClick={() => onEmoji(e)} className={`grid h-7 w-7 place-items-center rounded-lg border text-sm ${emoji === e ? "border-primary bg-primary-soft/60" : "border-border"}`} aria-label={`${t("store.icon")} ${e}`}>{e}</button>
        ))}
      </div>
    </div>
  );
}

function Row({ id, label, emoji, imageUrl, imagePath, onHide }: { id: string; label: string; emoji: string | null; imageUrl?: string | null | undefined; imagePath?: string | null | undefined; onHide: () => void }) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-2 bg-card px-3 py-2.5 ${isDragging ? "relative z-10 shadow-lg" : ""}`}>
      <button type="button" aria-label={t("list.moveGroup")} className="touch-none cursor-grab px-1 text-muted-foreground" {...attributes} {...listeners}>⋮⋮</button>
      <span className="inline-grid h-6 w-6 shrink-0 place-items-center">
        <DepartmentIcon emoji={emoji} imageUrl={imageUrl} imagePath={imagePath} className="h-6 w-6 object-contain" symbolClassName="text-lg" />
      </span>
      <span className="flex-1 text-sm text-foreground">{label}</span>
      <button type="button" aria-label={t("store.hide")} title={t("store.hide")} onClick={onHide} className="px-1 text-muted-foreground transition hover:text-destructive">🗑</button>
    </li>
  );
}

/** Einstellungen: Abteilungs-Reihenfolge je Laden (geräte-lokal). */
export function StoreOrderSettings() {
  const { t } = useT();
  const catalog = useCatalog();
  const stores = useStores();
  const { all, store, setStore, saveFor, resetFor, addCustomStore, updateCustomStore, removeCustomStore, hiddenAll, hideFor, unhideFor } = useGroupOrder();
  const [edit, setEdit] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [editStore, setEditStore] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmoji, setEditEmoji] = useState("");
  const sel = edit ?? store;
  const selected = stores.find((s) => s.id === sel) ?? stores[0]!;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const hiddenSel = hiddenAll[selected.id] ?? [];
  const { roots, hiddenRoots } = useMemo(() => {
    const r = catalog.departments.filter((d) => !d.parentId).map((d) => ({ key: d.id, order: d.sortOrder, name: d.name, emoji: d.emoji, imageUrl: d.iconUrl ?? d.imageUrl, imagePath: d.iconPath ?? d.imagePath }));
    const ordered = applyGroupOrder(r.sort((a, b) => a.order - b.order), all[selected.id] ?? []);
    return { roots: filterHidden(ordered, hiddenSel), hiddenRoots: ordered.filter((x) => hiddenSel.includes(x.key)) };
  }, [catalog.departments, all, selected.id, hiddenSel]);

  const choose = (v: string) => {
    if (v === "__new") {
      setCreating(true);
      setNewName("");
      setNewEmoji("");
      return;
    }
    setCreating(false);
    setEditStore(false);
    setEdit(v);
    setStore(v);
  };

  const submitNew = () => {
    const n = newName.trim();
    if (!n) return;
    const id = addCustomStore(n, newEmoji.trim() || undefined);
    setCreating(false);
    setNewName("");
    setNewEmoji("");
    setEdit(id);
    setStore(id);
  };

  const submitEdit = () => {
    if (!selected.custom) return;
    updateCustomStore(selected.id, { name: editName, emoji: editEmoji.trim() || null });
    setEditStore(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-xl" aria-hidden="true">↕️</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("store.orderTitle")}</p>
          <p className="whitespace-normal text-xs text-muted-foreground">{t("store.orderHint")}</p>
        </div>
        <span className="shrink-0 text-muted-foreground" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3.5">
          <div className="flex gap-2">
            <select value={creating ? "__new" : selected.id} onChange={(e) => choose(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary">
              {stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
              <option value="__new">{t("store.addCustom")}</option>
            </select>
            {selected.custom && (
              <>
                <button type="button" aria-label={t("store.edit")} title={t("store.edit")} onClick={() => { setEditStore(true); setEditName(selected.name); setEditEmoji(selected.emoji ?? ""); setCreating(false); }} className="rounded-lg border border-border px-2 text-xs">✎</button>
                <button type="button" onClick={() => { removeCustomStore(selected.id); setEditStore(false); setEdit("default"); }} className="rounded-lg border border-border px-2 text-xs text-destructive">{t("store.remove")}</button>
              </>
            )}
          </div>
          {creating && (
            <div className="flex items-start gap-2">
              <StoreFields name={newName} onName={setNewName} emoji={newEmoji} onEmoji={setNewEmoji} />
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" onClick={submitNew} disabled={!newName.trim()} className="rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{t("store.add")}</button>
                <button type="button" onClick={() => { setCreating(false); setNewName(""); setNewEmoji(""); }} className="rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground">{t("common.cancel")}</button>
              </div>
            </div>
          )}
          {editStore && selected.custom && (
            <div className="flex items-start gap-2">
              <StoreFields name={editName} onName={setEditName} emoji={editEmoji} onEmoji={setEditEmoji} />
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" onClick={submitEdit} className="rounded-lg bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground">{t("common.save")}</button>
                <button type="button" onClick={() => setEditStore(false)} className="rounded-lg border border-border px-2 py-1.5 text-xs text-muted-foreground">{t("common.cancel")}</button>
              </div>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => {
            const { active, over } = e;
            if (!over || active.id === over.id) return;
            const keys = roots.map((r) => r.key);
            const from = keys.indexOf(String(active.id));
            const to = keys.indexOf(String(over.id));
            if (from < 0 || to < 0) return;
            keys.splice(to, 0, ...keys.splice(from, 1));
            saveFor(selected.id, keys);
          }}>
            <SortableContext items={roots.map((r) => r.key)} strategy={verticalListSortingStrategy}>
              <ul className="max-h-96 divide-y divide-border overflow-y-auto rounded-xl border border-border">
                {roots.map((r) => <Row key={r.key} id={r.key} label={r.name} emoji={r.emoji} imageUrl={r.imageUrl} imagePath={r.imagePath} onHide={() => hideFor(selected.id, r.key)} />)}
              </ul>
            </SortableContext>
          </DndContext>
          {hiddenRoots.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("store.hiddenTitle")} · {selected.name}</p>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {hiddenRoots.map((r) => (
                  <li key={r.key} className="flex items-center gap-2 bg-card px-3 py-2">
                    <span className="inline-grid h-6 w-6 shrink-0 place-items-center">
                      <DepartmentIcon emoji={r.emoji} imageUrl={r.imageUrl} imagePath={r.imagePath} className="h-6 w-6 object-contain" symbolClassName="text-lg" />
                    </span>
                    <span className="flex-1 text-sm text-muted-foreground">{r.name}</span>
                    <button type="button" onClick={() => unhideFor(selected.id, r.key)} className="text-xs font-semibold text-primary">{t("store.unhide")}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button type="button" onClick={() => resetFor(selected.id)} className="text-xs font-semibold text-primary">{t("store.reset")}</button>
        </div>
      )}
    </div>
  );
}
