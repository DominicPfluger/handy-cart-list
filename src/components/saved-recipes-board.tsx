import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners,
  useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useT } from "../i18n";
import { useRecipeTemplates } from "../lib/use-recipe-templates";
import { publishRecipe, shareLink, unpublishRecipe, fetchRecipe, updateRecipeItems, type RecipeItem } from "../lib/recipes-api";
import { QuantityInput, isValidQty } from "./quantity-input";
import { formatQuantity } from "../lib/units";
import {
  applyLayout, refreshCollections, createCollection, deleteCollection, moveCollection, flattenTree, folderPath, deleteSavedWithUndo, renameCollection, renameSaved,
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
  const templates = useRecipeTemplates();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id, disabled: !draggable });
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(r.title);
  const rt = templates.find((x) => x.id === r.templateId);

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
      {r.isOwn && (
        <button
          onClick={() => void (async () => {
            try {
              if (r.isPublic) { await unpublishRecipe(r.recipeId); toast(t("cm.unpublished")); }
              else { await publishRecipe(r.recipeId); toast.success(t("cm.published")); }
              await refreshCollections();
            } catch { toast.error(t("cloud.error")); }
          })()}
          aria-label={r.isPublic ? t("cm.unpublish") : t("cm.publish")}
          title={r.isPublic ? t("cm.unpublish") : t("cm.publish")}
          className="px-1 text-sm"
        >{r.isPublic ? "🌍" : "🔒"}</button>
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

const COLLAPSE_KEY = "shoppi:recipe-folders-collapsed";

function Folder({ c, depth, count, hasChildren, collapsed, onToggle, all, userId, children }: {
  c: RecipeCollection; depth: number; count: number; hasChildren: boolean; collapsed: boolean; onToggle: () => void;
  all: RecipeCollection[]; userId: string; children: React.ReactNode;
}) {
  const { t } = useT();
  const { setNodeRef, isOver } = useDroppable({ id: `folder:${c.id}` });
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(c.name);
  const [sub, setSub] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  const commit = () => {
    setEditing(false);
    if (val.trim() && val.trim() !== c.name) void renameCollection(c.id, val.trim());
    else setVal(c.name);
  };
  // Ziele: alle Ordner ausser sich selbst und eigenen Unterordnern
  const descendants = new Set<string>([c.id]);
  let grew = true;
  while (grew) { grew = false; for (const x of all) if (x.parentId && descendants.has(x.parentId) && !descendants.has(x.id)) { descendants.add(x.id); grew = true; } }
  const targets = flattenTree(all).filter(({ c: x }) => !descendants.has(x.id));

  return (
    <div ref={setNodeRef} style={{ marginLeft: Math.min(depth, 4) * 14 }} className={`space-y-2 rounded-2xl border bg-card p-3 ${isOver ? "border-primary" : "border-border"}`}>
      <div className="flex items-center justify-between gap-1">
        <button onClick={onToggle} aria-label={collapsed ? t("rs.expand") : t("rs.collapse")} aria-expanded={!collapsed} className="w-5 shrink-0 text-muted-foreground">
          {collapsed ? "▸" : "▾"}
        </button>
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
            {hasChildren ? "🗂️" : "📁"} {c.name} <span className="font-normal text-muted-foreground">({count})</span>
          </button>
        )}
        <button onClick={() => setSub(sub === null ? "" : null)} aria-label={t("rk.addSubfolder")} title={t("rk.addSubfolder")} className="shrink-0 px-1 text-sm font-bold text-primary">＋</button>
        <button onClick={() => setMoving((v) => !v)} aria-label={t("rk.moveFolder")} title={t("rk.moveFolder")} className="shrink-0 px-1 text-sm text-muted-foreground">↪</button>
        <button
          onClick={() => { if (window.confirm(t("rk.deleteFolderConfirm"))) void deleteCollection(c.id); }}
          aria-label={t("rk.deleteList")}
          className="shrink-0 px-1 text-muted-foreground transition active:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>
      {moving && (
        <select
          autoFocus
          aria-label={t("rk.moveFolder")}
          defaultValue={c.parentId ?? ""}
          onChange={(e) => { setMoving(false); void moveCollection(c.id, e.target.value || null).catch(() => toast.error(t("cloud.error"))); }}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        >
          <option value="">{t("rk.topLevel")}</option>
          {targets.map(({ c: x }) => <option key={x.id} value={x.id}>{folderPath(all, x.id)}</option>)}
        </select>
      )}
      {sub !== null && (
        <form className="flex gap-2" onSubmit={async (e) => {
          e.preventDefault(); if (!sub.trim()) return;
          try { await createCollection(userId, sub, c.id); setSub(null); if (collapsed) onToggle(); } catch { toast.error(t("cloud.error")); }
        }}>
          <input autoFocus value={sub} onChange={(e) => setSub(e.target.value)} placeholder={t("rk.addSubfolder")} aria-label={t("rk.addSubfolder")}
            className="min-w-0 flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary" />
          <button type="submit" disabled={!sub.trim()} className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">OK</button>
        </form>
      )}
      {!collapsed && children}
    </div>
  );
}

export function SavedRecipesBoard({ collections, userId, filterTemplate, onOpen }: Props) {
  const { t } = useT();
  const draggable = !filterTemplate;
  const [layout, setLayout] = useState<RecipeCollection[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  useEffect(() => { try { setCollapsed(new Set(JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? "[]"))); } catch { /* ignore */ } }, []);
  const toggle = (id: string) => setCollapsed((prev) => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id);
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...n])); } catch { /* ignore */ }
    return n;
  });
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
        {(() => {
          const tree = flattenTree(shown);
          const hidden = new Set<string>();
          return tree.map(({ c, depth }) => {
            if (c.parentId && (hidden.has(c.parentId) || collapsed.has(c.parentId))) { hidden.add(c.id); return null; }
            const desc = new Set<string>([c.id]);
            for (const { c: x } of tree) if (x.parentId && desc.has(x.parentId)) desc.add(x.id);
            const count = shown.filter((x) => desc.has(x.id)).reduce((n, x) => n + x.recipes.length, 0);
            return (
          <Folder key={c.id} c={c} depth={depth} count={count} hasChildren={desc.size > 1} collapsed={collapsed.has(c.id)} onToggle={() => toggle(c.id)} all={base} userId={userId}>
            <SortableContext items={c.recipes.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              {c.recipes.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">{t("rk.emptyCollection")}</p>
              ) : c.recipes.map((r) => <Row key={r.id} r={r} userId={userId} draggable={draggable} onOpen={onOpen} />)}
            </SortableContext>
          </Folder>
            );
          });
        })()}
        <DragOverlay>{active ? <div className="rounded-xl border border-primary bg-background p-2 text-sm text-foreground shadow-lg">{active.title}</div> : null}</DragOverlay>
      </DndContext>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!folderName.trim() || creating) return;
          setCreating(true);
          try { await createCollection(userId, folderName); setFolderName(""); }
          catch { toast.error(t("cloud.error")); }
          finally { setCreating(false); }
        }}
      >
        <input
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder={t("rk.collectionPh")}
          aria-label={t("rk.collectionPh")}
          className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <button type="submit" disabled={!folderName.trim() || creating} className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {t("rs.newFolder")}
        </button>
      </form>
    </section>
  );
}
