import { useMemo, useState } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCatalog, originalName, type CatalogDepartment } from "../lib/catalog-query";
import { useDepartmentOrder } from "../hooks/use-department-order";
import { hideDepartment, restoreDepartment, useHiddenDepartments } from "../hooks/use-hidden-departments";
import { deleteCustomEntry, isCustomId } from "../hooks/use-custom-catalog";
import { useCustomNames } from "../hooks/use-custom-names";
import { RenameDialog, type RenameTarget } from "./rename-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { PencilIcon, TrashIcon } from "./icons";
import { DepartmentIcon } from "./catalog-icon";
import { useT } from "../i18n";

type RowProps = {
  dept: CatalogDepartment;
  hasChildren: boolean;
  expanded: boolean;
  onToggle: () => void;
  onRename: () => void;
  onRemove: () => void;
  sub?: boolean;
};

function Row({ dept, hasChildren, expanded, onToggle, onRename, onRemove, sub }: RowProps) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dept.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-2 bg-card py-2 pr-2 ${sub ? "pl-8" : "pl-3"} ${isDragging ? "relative z-10 shadow-lg" : ""}`}>
      <button type="button" aria-label={t("list.moveGroup")} className="touch-none cursor-grab px-1 text-muted-foreground" {...attributes} {...listeners}>⋮⋮</button>
      <span className="inline-grid h-6 w-6 shrink-0 place-items-center">
        <DepartmentIcon emoji={dept.emoji} imageUrl={dept.iconUrl ?? dept.imageUrl} imagePath={dept.iconPath ?? dept.imagePath} className="h-6 w-6 object-contain" symbolClassName="text-lg" />
      </span>
      <button type="button" onClick={hasChildren ? onToggle : onRename} className="min-w-0 flex-1 text-left text-sm text-foreground">
        {dept.name}{hasChildren && <span className="ml-1 text-muted-foreground">{expanded ? "▴" : "▾"}</span>}
      </button>
      <button type="button" aria-label={t("rename.action", { name: dept.name })} title={t("rename.action", { name: dept.name })} onClick={onRename} className="p-1.5 text-muted-foreground hover:text-primary"><PencilIcon className="h-4 w-4" /></button>
      <button type="button" aria-label={t("dept.remove", { name: dept.name })} title={t("dept.remove", { name: dept.name })} onClick={onRemove} className="p-1.5 text-muted-foreground hover:text-destructive"><TrashIcon className="h-4 w-4" /></button>
    </div>
  );
}

/** Einstellungen: Kategorien & Unterkategorien ordnen, umbenennen, entfernen (geräte-lokal). */
export function CategoryOrderSettings() {
  const { t } = useT();
  const catalog = useCatalog();
  const { departments, move, reset } = useDepartmentOrder(catalog.departments);
  const hidden = useHiddenDepartments();
  const customNames = useCustomNames();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CatalogDepartment | null>(null);
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
  const roots = kids(null);
  const hiddenDepts = departments.filter((d) => hiddenSet.has(d.id));

  const onDragEnd = (list: CatalogDepartment[], parentId: string | null) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const to = list.findIndex((d) => d.id === over.id);
    if (to < 0) return;
    move(String(active.id), parentId, to);
  };
  const openRename = (d: CatalogDepartment) =>
    setRenameTarget({ id: d.id, name: d.name, originalName: originalName(d), isCustom: d.id in customNames, kind: "department" });
  const confirmRemove = () => {
    if (!removeTarget) return;
    if (isCustomId(removeTarget.id)) deleteCustomEntry(removeTarget.id);
    else hideDepartment(removeTarget.id);
    setRemoveTarget(null);
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(roots, null)}>
            <SortableContext items={roots.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto rounded-xl border border-border">
                {roots.map((r) => {
                  const children = kids(r.id);
                  const isOpen = expanded === r.id;
                  return (
                    <li key={r.id}>
                      <Row dept={r} hasChildren={children.length > 0} expanded={isOpen} onToggle={() => setExpanded(isOpen ? null : r.id)} onRename={() => openRename(r)} onRemove={() => setRemoveTarget(r)} />
                      {isOpen && (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(children, r.id)}>
                          <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                            <div className="divide-y divide-border border-t border-border bg-muted/30">
                              {children.map((c) => (
                                <Row key={c.id} sub dept={c} hasChildren={false} expanded={false} onToggle={() => {}} onRename={() => openRename(c)} onRemove={() => setRemoveTarget(c)} />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </li>
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
          {hiddenDepts.length > 0 && (
            <div>
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
          <button type="button" onClick={reset} className="text-xs font-semibold text-primary">{t("catOrder.reset")}</button>
        </div>
      )}
      <RenameDialog target={renameTarget} onClose={() => setRenameTarget(null)} />
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dept.removeTitle", { name: removeTarget?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t(isCustomId(removeTarget?.id ?? "") ? "dept.deleteDescription" : "dept.hideDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("dept.removeConfirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
