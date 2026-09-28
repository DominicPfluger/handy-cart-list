import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  useShoppingList,
  getCategory,
  type ListItem,
} from "../hooks/use-shopping-list";
import { useDepartmentOrder } from "../hooks/use-department-order";
import {
  catalogQueryOptions,
  useCatalog,
  type CatalogDepartment,
} from "../lib/catalog-query";
import {
  CheckIcon,
  DotsIcon,
  TrashIcon,
  PlusIcon,
  ShareIcon,
} from "../components/icons";
import { ListManager, shareList } from "../components/list-manager";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  head: () => ({
    meta: [
      { title: "Shoppi — Unsere Einkaufsliste" },
      { name: "description", content: "Die smarte Einkaufsliste für deinen Alltag. Gemeinsam. Einfach. Einkaufen." },
      { property: "og:title", content: "Shoppi — Unsere Einkaufsliste" },
      { property: "og:description", content: "Die smarte Einkaufsliste für deinen Alltag." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListPage,
});

function ListPage() {
  const {
    items, hydrated, toggleItem, removeItem, clearChecked,
    lists, activeList, setActiveListId, createList, renameList, deleteList, reorderLists,
  } = useShoppingList();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const data = useCatalog();
  const { departments } = useDepartmentOrder(data.departments);

  const deptById = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments],
  );
  const productById = useMemo(
    () => new Map(data.products.map((p) => [p.id, p])),
    [data.products],
  );

  /** Kategoriepfad (Wurzel → ... → Blatt) eines Produkts. */
  const chainOf = (leaf: CatalogDepartment): CatalogDepartment[] => {
    const chain: CatalogDepartment[] = [];
    let current: CatalogDepartment | undefined = leaf;
    while (current) {
      chain.unshift(current);
      current = current.parentId ? deptById.get(current.parentId) : undefined;
    }
    return chain;
  };

  /** Sortierschlüssel entlang des Kategoriebaums, analog zur Abteilungsansicht. */
  const treeOrder = (leaf: CatalogDepartment): number =>
    chainOf(leaf).reduce((acc, d) => acc * 1000 + d.sortOrder, 0);

  interface Group {
    key: string;
    label: string;
    emoji: string;
    order: number;
    items: ListItem[];
  }

  /** Gruppierung + Sortierung analog zur Abteilungsansicht:
   *  Hauptabteilungen als Überschriften in Baumreihenfolge,
   *  darin Unterkategorien und Produkte nach Katalog-Reihenfolge. */
  const grouped = useMemo(() => {
    const map = new Map<string, Group>();
    for (const it of items) {
      const product = it.productId ? productById.get(it.productId) : undefined;
      const leaf = product?.departmentId ? deptById.get(product.departmentId) : undefined;
      const root = leaf ? chainOf(leaf)[0] : undefined;
      const key = root ? root.id : `label:${it.groupLabel ?? it.category}`;
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          label: root?.name ?? it.groupLabel ?? getCategory(it.category).label,
          emoji: root?.emoji ?? it.groupEmoji ?? getCategory(it.category).emoji,
          order: root ? root.sortOrder : Number.MAX_SAFE_INTEGER,
          items: [],
        };
        map.set(key, group);
      }
      group.items.push(it);
    }
    const groups = [...map.values()].sort((a, b) => a.order - b.order);
    for (const group of groups) {
      group.items.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        const pa = a.productId ? productById.get(a.productId) : undefined;
        const pb = b.productId ? productById.get(b.productId) : undefined;
        const la = pa?.departmentId ? deptById.get(pa.departmentId) : undefined;
        const lb = pb?.departmentId ? deptById.get(pb.departmentId) : undefined;
        const ta = la ? treeOrder(la) : Number.MAX_SAFE_INTEGER;
        const tb = lb ? treeOrder(lb) : Number.MAX_SAFE_INTEGER;
        if (ta !== tb) return ta - tb;
        const oa = pa?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const ob = pb?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (oa !== ob) return oa - ob;
        return a.addedAt - b.addedAt;
      });
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, productById, deptById]);

  const doneCount = items.filter((i) => i.checked).length;
  const total = items.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <div className="space-y-5">
      <ListManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        lists={lists}
        activeId={activeList.id}
        onSelect={setActiveListId}
        onCreate={createList}
        onRename={renameList}
        onDelete={deleteList}
        onReorder={reorderLists}
      />

      {/* List switcher */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {lists.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveListId(l.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              l.id === activeList.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {l.name}
          </button>
        ))}
        <button
          onClick={() => setManagerOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Listen
        </button>
      </div>

      {/* Title + progress */}
      <div>
        <div className="flex items-center gap-2">
          <button onClick={() => setManagerOpen(true)} className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{activeList.name}</h1>
          </button>
          <button
            onClick={() => shareList(activeList)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary active:bg-muted"
            aria-label="Liste teilen"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {doneCount}/{total}
          </span>
        </div>
      </div>

      {/* List grouped by category */}
      {items.length === 0 && hydrated && (
        <div className="py-16 text-center">
          <div className="text-5xl">🧺</div>
          <p className="mt-4 text-sm text-muted-foreground">
            Deine Liste ist leer.<br />Füge Artikel über „Abteilungen" hinzu!
          </p>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map((group) => {
          return (
            <div key={group.key}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">{group.emoji}</span>
                <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
                <span className="text-xs text-muted-foreground">· {group.items.length}</span>
              </div>
              <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                {group.items.map((item) => (
                  <div key={item.id} className="relative flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${
                        item.checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                      aria-label={item.checked ? "Abwählen" : "Auswählen"}
                    >
                      {item.checked && <CheckIcon className="h-4 w-4" />}
                    </button>
                    {item.emoji && (
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary-soft/25 text-xl">
                        {item.emoji}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {item.name}{item.organic ? " (Bio)" : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.quantity || "—"} · von {item.addedBy}
                      </p>
                      {item.note && (
                        <p className="truncate text-xs italic text-muted-foreground/80">
                          📝 {item.note}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition active:scale-90"
                      aria-label="Optionen"
                    >
                      <DotsIcon className="h-5 w-5" />
                    </button>
                    {menuOpenId === item.id && (
                      <div className="absolute right-3 top-12 z-10 rounded-xl border border-border bg-popover py-1 shadow-lg">
                        <button
                          onClick={() => {
                            removeItem(item.id);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-coral hover:bg-muted"
                        >
                          <TrashIcon className="h-4 w-4" /> Entfernen
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear checked */}
      {doneCount > 0 && (
        <button
          onClick={clearChecked}
          className="w-full rounded-xl bg-muted py-3 text-sm font-semibold text-muted-foreground transition active:scale-[0.98]"
        >
          {doneCount} abgehakte Artikel entfernen
        </button>
      )}
    </div>
  );
}
