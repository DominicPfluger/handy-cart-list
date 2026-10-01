import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners,
  useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useT } from "../i18n";
import { RECIPE_TEMPLATES } from "../lib/recipe-templates";
import { publishRecipe, shareLink } from "../lib/recipes-api";
import {
  applyLayout, deleteCollection, deleteSavedWithUndo, renameCollection, renameSaved,
  type RecipeCollection, type SavedRecipe,
} from "../hooks/use-saved-recipes";

type Props = {
  collections: RecipeCollection[];
  userId: string;
  filterTemplate: string | null;
  onOpen: (templateId: string, picks: Record<string, string[]>) => void;
};

function Row({ r, userId, draggable, onOpen }: { r: SavedRecipe; userId: string; draggable: boolean; onOpen: Props["onOpen"] }) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id, disabled: !draggable });
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(r.title);
  const rt = RECIPE_TEMPLATES.find((x) => x.id === r.templateId);

  const commit = () => { setEditing(false); if (val.trim() && val.trim() !== r.title) void renameSaved(r, val); else setVal(r.title); };
  const remove = async () => {
    try {
      const undo = await deleteSavedWithUndo(r, userId);
      toast(t("rs.removed"), { action: { label: t("common.undo"), onClick: () => void undo() } });
    } catch { toast.error(t("cloud.error")); }
  };
  const share = async () => {
    try {
      const slug = await publishRecipe(r.recipeId);
      if ((await shareLink(slug, r.title)) === "copied") toast.success(t("rs.linkCopied"));
    } catch { toast.error(t("cloud.error")); }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-1.5 rounded-xl bg-background p-2"
    >
      {draggable && (
        <button {...attributes} {...listeners} aria-label={t("rs.dragHandle")} className="touch-none cursor-grab px-1 text-muted-foreground">⋮⋮</button>
      )}
      <button onClick={() => onOpen(r.templateId, r.picks)} aria-label={t("rs.open")} className="text-xl">{rt?.emoji ?? "🍽️"}</button>
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(r.title); setEditing(false); } }}
          aria-label={t("rs.rename")}
          className="min-w-0 flex-1 rounded-md border border-primary bg-card px-2 py-1 text-sm text-foreground outline-none"
        />
      ) : (
        <button onClick={() => { setVal(r.title); setEditing(true); }} title={t("rs.tapToRename")} className="min-w-0 flex-1 truncate text-left text-sm text-foreground">
          {r.title}
        </button>
      )}
      {r.isOwn ? (
        <button onClick={() => void share()} aria-label={t("rs.share")} className="px-1 text-sm">🔗</button>
      ) : r.shareSlug ? (
        <Link to="/rezept/$slug" params={{ slug: r.shareSlug }} aria-label={t("rs.open")} className="px-1 text-sm">↗</Link>
      ) : null}
      <button onClick={() => void remove()} aria-label={t("rs.deleteRecipe")} className="px-2 text-muted-foreground transition active:text-destructive"><Trash2 size={16} /></button>
    </div>
  );
}

function Folder({ c, children }: { c: RecipeCollection; children: React.ReactNode }) {
  const { t } = useT();
  const { setNodeRef, isOver } = useDroppable({ id: `folder:${c.id}` });
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(c.name);

  const commit = () => {
    setEditing(false);
    if (val.trim() && val.trim() !== c.name) void renameCollection(c.id, val.trim());
    else setVal(c.name);
  };

  return (
    <div ref={setNodeRef} className={`space-y-2 rounded-2xl border bg-card p-3 ${isOver ? "border-primary" : "border-border"}`}>
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setVal(c.name); setEditing(false); } }}
            aria-label={t("rs.renameFolder")}
            className="min-w-0 flex-1 rounded-md border border-primary bg-background px-2 py-1 text-sm font-semibold text-foreground outline-none"
          />
        ) : (
          <button onClick={() => { setVal(c.name); setEditing(true); }} title={t("rs.tapToRename")} className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground">
            📁 {c.name}
          </button>
        )}
        <button
          onClick={() => { if (window.confirm(t("rs.confirmDeleteFolder"))) void deleteCollection(c.id); }}
          aria-label={t("rk.deleteList")}
          className="shrink-0 px-1 text-muted-foreground transition active:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {children}
    </div>
  );
}

export function SavedRecipesBoard({ collections, userId, filterTemplate, onOpen }: Props) {
  const { t } = useT();
  const draggable = !filterTemplate;
  const [layout, setLayout] = useState<RecipeCollection[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const base = layout ?? collections;
  const shown = base
    .map((c) => ({ ...c, recipes: filterTemplate ? c.recipes.filter((r) => r.templateId === filterTemplate) : c.recipes }))
    .filter((c) => !filterTemplate || c.recipes.length > 0);
  if (shown.length === 0) return null;

  const findFolder = (cols: RecipeCollection[], id: string) =>
    id.startsWith("folder:") ? cols.find((c) => c.id === id.slice(7)) : cols.find((c) => c.recipes.some((r) => r.id === id));

  const onStart = (e: DragStartEvent) => { setActiveId(String(e.active.id)); setLayout(collections.map((c) => ({ ...c, recipes: [...c.recipes] }))); };
  const onOver = (e: DragOverEvent) => {
    if (!e.over || !layout) return;
    const a = String(e.active.id), o = String(e.over.id);
    const from = findFolder(layout, a), to = findFolder(layout, o);
    if (!from || !to || from.id === to.id) return;
    const item = from.recipes.find((r) => r.id === a)!;
    const idx = o.startsWith("folder:") ? to.recipes.length : Math.max(0, to.recipes.findIndex((r) => r.id === o));
    setLayout(layout.map((c) =>
      c.id === from.id ? { ...c, recipes: c.recipes.filter((r) => r.id !== a) }
      : c.id === to.id ? { ...c, recipes: [...c.recipes.slice(0, idx), { ...item, folderId: to.id }, ...c.recipes.slice(idx)] }
      : c));
  };
  const onEnd = (e: DragEndEvent) => {
    setActiveId(null);
    let next = layout;
    if (next && e.over) {
      const a = String(e.active.id), o = String(e.over.id);
      const f = findFolder(next, a);
      if (f && !o.startsWith("folder:")) {
        const oi = f.recipes.findIndex((r) => r.id === o), ai = f.recipes.findIndex((r) => r.id === a);
        if (oi >= 0 && ai >= 0 && oi !== ai) next = next.map((c) => (c.id === f.id ? { ...c, recipes: arrayMove(c.recipes, ai, oi) } : c));
      }
    }
    if (next) void applyLayout(next).catch(() => toast.error(t("cloud.error")));
    setLayout(null);
  };

  const active = activeId ? base.flatMap((c) => c.recipes).find((r) => r.id === activeId) : null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">{t("rk.myRecipes")}</h2>
      {draggable && <p className="text-xs text-muted-foreground">{t("rs.boardHint")}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd} onDragCancel={() => { setActiveId(null); setLayout(null); }}>
        {shown.map((c) => (
          <Folder key={c.id} c={c}>
            <SortableContext items={c.recipes.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              {c.recipes.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">{t("rk.emptyCollection")}</p>
              ) : c.recipes.map((r) => <Row key={r.id} r={r} userId={userId} draggable={draggable} onOpen={onOpen} />)}
            </SortableContext>
          </Folder>
        ))}
        <DragOverlay>{active ? <div className="rounded-xl border border-primary bg-background p-2 text-sm text-foreground shadow-lg">{active.title}</div> : null}</DragOverlay>
      </DndContext>
    </section>
  );
}
