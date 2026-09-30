import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  useShoppingList,
  getCategory,
  type ListItem,
} from "../hooks/use-shopping-list";
import { useDepartmentOrder } from "../hooks/use-department-order";
import { useProductOrder } from "../hooks/use-product-order";
import {
  catalogQueryOptions,
  useCatalog,
  type CatalogDepartment,
} from "../lib/catalog-query";
import { getLocale } from "../i18n";
import {
  CheckIcon,
  TrashIcon,
  PlusIcon,
  ShareIcon,
} from "../components/icons";
import { ListManager, shareList } from "../components/list-manager";
import { relocalizeQuantity } from "../lib/units";
import { useT } from "../i18n";
import { ProductEmoji } from "../components/product-emoji";


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
  const [managerOpen, setManagerOpen] = useState(false);
  const data = useCatalog();
  const { t } = useT();
  /** "Beliebige/Beliebiger/Beliebiges …" (und Übersetzungen wie "Any …") nicht anzeigen. */
  const stripAnyPrefix = (name: string) =>
    name.replace(
      /^(beliebiges|beliebiger|beliebige|willekeurige|willekeurig|cualquier|qualquer|any)\s+/i,
      "",
    ).trim();
  /** Katalogartikel in der gewählten Sprache anzeigen (Sorte bleibt erhalten). */
  const displayName = (item: ListItem) => {
    const product = item.productId ? productById.get(item.productId) : undefined;
    if (!product) return stripAnyPrefix(item.name);
    const i = item.name.indexOf(" · ");
    const base = i >= 0 ? product.name + item.name.slice(i) : product.name;
    return stripAnyPrefix(base);
  };
  const { departments } = useDepartmentOrder(data.departments);

  const deptIds = useMemo(() => new Set(departments.map((d) => d.id)), [departments]);
  // Persönliche (nur lokal gespeicherte) Artikel-Anordnung übernehmen — analog Abteilungsansicht.
  const { products: orderedProducts } = useProductOrder(data.products, deptIds);

  const deptById = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments],
  );
  const productById = useMemo(
    () => new Map(orderedProducts.map((p) => [p.id, p])),
    [orderedProducts],
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

  /** Sortierung analog zur Abteilungsansicht: Einträge in Baumreihenfolge
   *  der Unterkategorien, innerhalb einer Unterkategorie in Katalog-Reihenfolge. */
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
        const ta = segOf(a).tree;
        const tb = segOf(b).tree;
        if (ta !== tb) return ta - tb;
        const pa = a.productId ? productById.get(a.productId) : undefined;
        const pb = b.productId ? productById.get(b.productId) : undefined;
        const oa = pa?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const ob = pb?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (oa !== ob) return oa - ob;
        // Gleichstand: alphabetisch wie in der Abteilungsansicht
        if (pa && pb) return pa.name.localeCompare(pb.name, getLocale());
        return a.addedAt - b.addedAt;
      });
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, productById, deptById]);

  /** Baum-Sortierschlüssel entlang des Kategoriebaums (analog Abteilungsansicht). */
  function segOf(it: ListItem) {
    const p = it.productId ? productById.get(it.productId) : undefined;
    const leaf = p?.departmentId ? deptById.get(p.departmentId) : undefined;
    return { tree: leaf ? treeOrder(leaf) : Number.MAX_SAFE_INTEGER };
  }


  const headingOf = useMemo(() => headingByProduct(data.products, data.headings), [data.products, data.headings]);
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
          <PlusIcon className="h-3.5 w-3.5" /> {t("list.lists")}
        </button>
      </div>

      {/* Title + progress */}
      <div>
        <div className="flex items-center gap-2">
          <button onClick={() => setManagerOpen(true)} className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{activeList.name}</h1>
          </button>
          <button
            onClick={() => shareList({ ...activeList, items: activeList.items.map((i) => ({ ...i, name: displayName(i), quantity: i.quantity ? relocalizeQuantity(i.quantity, i.unit) : i.quantity })) })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary active:bg-muted"
            aria-label={t("list.share")}
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
            {t("list.empty1")}<br />{t("list.empty2")}
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
                {group.items.map((item, index) => {
                  const h = group.items.length > 5 && !item.checked && item.productId ? headingOf.get(item.productId) : undefined;
                  const prev = group.items[index - 1];
                  const showH = h && (prev?.productId ? headingOf.get(prev.productId) : undefined) !== h;
                  return (
                  <Fragment key={item.id}>
                  {showH && <div className="bg-muted/50 px-4 pb-1.5 pt-3 text-sm font-bold text-foreground">{h.name}</div>}
                  <div
                    className="relative flex items-center gap-3 py-3 pl-4 pr-4"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${
                        item.checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                      aria-label={item.checked ? t("list.uncheck") : t("list.check")}
                    >
                      {item.checked && <CheckIcon className="h-4 w-4" />}
                    </button>
                    <div className="grid h-10 w-10 shrink-0 select-none place-items-center overflow-hidden rounded-lg bg-primary-soft/25 text-xl">
                      <ProductEmoji emoji={item.emoji} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`break-words text-sm font-medium ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {displayName(item)}{item.organic ? ` (${t("common.organic")})` : ""}
                      </p>
                      <p className="break-words text-xs text-muted-foreground">
                        {item.quantity ? relocalizeQuantity(item.quantity, item.unit) : "—"} · {t("list.by", { name: item.addedBy })}
                      </p>
                      {item.note && (
                        <p className="break-words text-xs italic text-muted-foreground/80">
                          📝 {item.note}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-coral transition active:scale-90"
                      aria-label={t("list.remove")}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  </Fragment>
                  );
                })}
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
          {t("list.clearChecked", { n: doneCount })}
        </button>
      )}
    </div>
  );
}
