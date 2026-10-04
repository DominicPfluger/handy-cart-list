import { useMemo, useState } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCatalog } from "../lib/catalog-query";
import { useGroupOrder, applyGroupOrder, filterHidden } from "../hooks/use-group-order";
import { useStores } from "../hooks/use-stores";
import { useT } from "../i18n";

function Row({ id, label, emoji, onHide }: { id: string; label: string; emoji: string | null; onHide: () => void }) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-2 bg-card px-3 py-2.5 ${isDragging ? "relative z-10 shadow-lg" : ""}`}>
      <button type="button" aria-label={t("list.moveGroup")} className="touch-none cursor-grab px-1 text-muted-foreground" {...attributes} {...listeners}>⋮⋮</button>
      <span aria-hidden="true">{emoji ?? "🛒"}</span>
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
  const { all, store, setStore, saveFor, resetFor, addCustomStore, removeCustomStore, hiddenAll, hideFor, unhideFor } = useGroupOrder();
  const [edit, setEdit] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const sel = edit ?? store;
  const selected = stores.find((s) => s.id === sel) ?? stores[0]!;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const hiddenSel = hiddenAll[selected.id] ?? [];
  const { roots, hiddenRoots } = useMemo(() => {
    const r = catalog.departments.filter((d) => !d.parentId).map((d) => ({ key: d.id, order: d.sortOrder, name: d.name, emoji: d.emoji }));
    const ordered = applyGroupOrder(r.sort((a, b) => a.order - b.order), all[selected.id] ?? []);
    return { roots: filterHidden(ordered, hiddenSel), hiddenRoots: ordered.filter((x) => hiddenSel.includes(x.key)) };
  }, [catalog.departments, all, selected.id, hiddenSel]);

  const choose = (v: string) => {
    if (v === "__new") {
      const name = window.prompt(t("store.newName"))?.trim();
      if (!name) return;
      const id = addCustomStore(name);
      setEdit(id);
      setStore(id);
      return;
    }
    setEdit(v);
    setStore(v);
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
            <select value={selected.id} onChange={(e) => choose(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary">
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value="__new">{t("store.addCustom")}</option>
            </select>
            {selected.custom && (
              <button type="button" onClick={() => { removeCustomStore(selected.id); setEdit("default"); }} className="rounded-lg border border-border px-2 text-xs text-destructive">{t("store.remove")}</button>
            )}
          </div>
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
                {roots.map((r) => <Row key={r.key} id={r.key} label={r.name} emoji={r.emoji} onHide={() => hideFor(selected.id, r.key)} />)}
              </ul>
            </SortableContext>
          </DndContext>
          {hiddenRoots.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{t("store.hiddenTitle")}</p>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {hiddenRoots.map((r) => (
                  <li key={r.key} className="flex items-center gap-2 bg-card px-3 py-2">
                    <span aria-hidden="true">{r.emoji ?? "🛒"}</span>
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

/** Kleiner Laden-Umschalter für die Listenansicht. */
export function StoreSwitcher() {
  const { t } = useT();
  const stores = useStores();
  const { store, setStore } = useGroupOrder();
  if (stores.length <= 1) return null;
  return (
    <label className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
      <span>{t("store.label")}</span>
      <select value={stores.some((s) => s.id === store) ? store : "default"} onChange={(e) => setStore(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary">
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </label>
  );
}
