import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDepartmentOrder } from "../hooks/use-department-order";
import { useFavoriteOrder, saveFavoriteOrder } from "../hooks/use-item-order";
import { toast } from "sonner";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { Button } from "../components/ui/button";
import { BoltIcon, HeartIcon, PlusIcon, SearchIcon } from "../components/icons";
import { catalogListName, useShoppingList, type FavoriteProduct, type ListItem } from "../hooks/use-shopping-list";
import {
  ensureCatalog, catalogQueryOptions,
  useCatalog,
  compareByName,
  matchesProductSearch,
  type CatalogDepartment,
  type CatalogProduct,
  departmentIdsOf,
} from "../lib/catalog-query";
import { usePreferredDept } from "../hooks/use-preferred-dept";
import { storeLabel, useStores } from "../hooks/use-stores";
import { useGroupOrder } from "../hooks/use-group-order";
import { formatQuantity } from "../lib/units";
import { getLocale, pickName, useT } from "../i18n";
import { ProductIcon, DepartmentIcon } from "../components/catalog-icon";


export const Route = createFileRoute("/favoriten")({
  ssr: false,
  loader: ({ context }) => ensureCatalog(context.queryClient, getLocale()),
  head: () => ({
    meta: [
      { title: "Shoppi — Favoriten" },
      { name: "description", content: "Deine Lieblingsprodukte schnell zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Favoriten" },
      { property: "og:description", content: "Deine Lieblingsprodukte schnell zur Einkaufsliste hinzufügen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavoritesPage,
});

interface FavRow {
  product: CatalogProduct;
  favorite: FavoriteProduct;
  variant?: string;
}

interface FavEntry {
  row: FavRow;
  leaf: CatalogDepartment | null;
  rootId: string;
}

function toCatalogProduct(favorite: FavoriteProduct): CatalogProduct {
  return {
    id: favorite.productId,
    departmentId: "",
    name: favorite.name,
    emoji: favorite.emoji ?? null,
    imageUrl: favorite.imageUrl ?? null,
    defaultQuantity: favorite.defaultQuantity,
    defaultUnit: favorite.defaultUnit,
    organicAvailable: favorite.organicAvailable,
    variants: [], variantNames: {}, excludedDiets: [], cuisineIds: [], brands: [],
    sortOrder: 0,
    baseName: favorite.name,
    names: {},
  };
}

function ProductThumb({ row }: { row: FavRow }) {
  const image = row.variant ? row.product.variantImages?.[row.variant] : undefined;
  return <ProductIcon emoji={row.product.emoji} iconUrl={image?.iconUrl ?? image?.imageUrl ?? row.product.iconUrl} iconPath={image?.iconPath ?? image?.imagePath ?? row.product.iconPath} symbolClassName="text-4xl" />;
}

function FavoritesPage() {
  const { addCatalogItem, createListFromItems, favorites, hydrated, selfName, toggleFavorite } = useShoppingList();
  const navigate = useNavigate();
  const favOrder = useFavoriteOrder();
  const data = useCatalog();
  const { preferred: preferredDept } = usePreferredDept();
  const { t, locale } = useT();
  const { departments } = useDepartmentOrder(data.departments);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FavRow | null>(null);
  const [listNameOpen, setListNameOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [newStore, setNewStore] = useState("default");
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreEmoji, setNewStoreEmoji] = useState("");
  const stores = useStores();
  const { setListStore, addCustomStore } = useGroupOrder();


  const deptById = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments],
  );
  const productById = useMemo(
    () => new Map(data.products.map((p) => [p.id, p])),
    [data.products],
  );

  const rowForFavorite = (favorite: FavoriteProduct): FavRow => {
    const product = productById.get(favorite.productId);
    if (product) return { product, favorite };
    const separator = favorite.productId.indexOf("::");
    if (separator > 0) {
      const base = productById.get(favorite.productId.slice(0, separator));
      if (base) return { product: base, favorite, variant: favorite.productId.slice(separator + 2) };
    }
    return { product: toCatalogProduct(favorite), favorite };
  };

  const displayName = (row: FavRow) => row.variant && row.product.variants.includes(row.variant)
    ? `${row.product.name} · ${pickName(row.product.variantNames?.[row.variant], locale, row.variant)}`
    : row.favorite.name;

  /** Hauptabteilungen (oberste Ebene), sortiert wie in der Abteilungsansicht. */
  const rootDepartments = useMemo(
    () =>
      departments
        .filter((d) => !d.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [departments],
  );

  /** Hauptabteilung eines Produkts über die Hierarchie auflösen. */
  const rootOf = (leaf: CatalogDepartment): CatalogDepartment | null => {
    let current: CatalogDepartment | undefined = leaf;
    while (current?.parentId) {
      current = deptById.get(current.parentId);
    }
    return current ?? null;
  };

  /** Gespeicherte Kategorie (auch Alias) vor der aktuellen Gerätepräferenz berücksichtigen. */
  const groupOfRow = (row: FavRow): CatalogDepartment | undefined => {
    const p = row.product;
    if (!p.departmentId) return undefined;
    const ids = departmentIdsOf(p, data.productAliases ?? []);
    const lbl = row.favorite.groupLabel;
    if (lbl) for (const id of ids) {
      const d = deptById.get(id);
      if (d && (d.name === lbl || d.baseName === lbl || Object.values(d.names).includes(lbl))) return d;
    }
    const pref = preferredDept[p.id];
    if (pref && ids.includes(pref) && deptById.get(pref)) return deptById.get(pref);
    return deptById.get(p.departmentId);
  };

  /** Gruppierte Favoriten je Hauptabteilung + Favoriten ohne Katalogprodukt. */
  const { entriesByRoot, looseFavorites } = useMemo(() => {
    const byRoot = new Map<string, FavEntry[]>();
    const loose: FavRow[] = [];
    for (const favorite of favorites) {
      const row = rowForFavorite(favorite);
      const { product } = row;
      if (!product.departmentId) {
        loose.push(row);
        continue;
      }
      const leaf = groupOfRow(row) ?? null;
      const root = leaf ? rootOf(leaf) : null;
      if (!root) {
        loose.push(row);
        continue;
      }
      const list = byRoot.get(root.id) ?? [];
      list.push({ row, leaf, rootId: root.id });
      byRoot.set(root.id, list);
    }
    return { entriesByRoot: byRoot, looseFavorites: loose };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites, deptById, productById, departments, data.productAliases, preferredDept]);

  /** Sortierung innerhalb einer Kategorie analog zur Abteilungsansicht:
   *  zuerst nach Kategorie (sortOrder), dann nach Produkt (sortOrder). */
  const sortEntries = (entries: FavEntry[]) =>
    [...entries].sort((a, b) => {
      const oa = favOrder[a.row.favorite.productId];
      const ob = favOrder[b.row.favorite.productId];
      if (oa !== undefined && ob !== undefined && oa !== ob) return oa - ob;
      const leafOrder = (entry: FavEntry) => {
        if (!entry.leaf) return Number.MAX_SAFE_INTEGER;
        let order = entry.leaf.sortOrder;
        let parent = entry.leaf.parentId ? deptById.get(entry.leaf.parentId) : undefined;
        while (parent && parent.parentId) {
          order = parent.sortOrder * 1000 + order;
          parent = parent.parentId ? deptById.get(parent.parentId) : undefined;
        }
        return order;
      };
      const la = leafOrder(a);
      const lb = leafOrder(b);
      if (la !== lb) return la - lb;
      if (a.row.product.sortOrder !== b.row.product.sortOrder) {
        return a.row.product.sortOrder - b.row.product.sortOrder;
      }
      return a.row.favorite.name.localeCompare(b.row.favorite.name);
    });

  const sections = useMemo(
    () =>
      rootDepartments
        .filter((department) => entriesByRoot.has(department.id))
        .map((department) => ({
          department,
          entries: sortEntries(entriesByRoot.get(department.id)!),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootDepartments, entriesByRoot, favOrder],
  );

  const [drag, setDrag] = useState<{ id: string; sec: string; ids: string[]; target: string | null; after: boolean } | null>(null);
  const onDragDown = (e: React.PointerEvent, id: string, sec: string, ids: string[]) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id, sec, ids, target: null, after: false });
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-fav-id]");
    if (!el || el.dataset["sec"] !== drag.sec) {
      if (drag.target) setDrag({ ...drag, target: null });
      return;
    }
    const r = el.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    const target = el.dataset["favId"]!;
    if (target !== drag.target || after !== drag.after) setDrag({ ...drag, target, after });
  };
  const onDragUp = () => {
    if (drag?.target && drag.target !== drag.id) {
      const without = drag.ids.filter((id) => id !== drag.id);
      let idx = without.indexOf(drag.target);
      if (drag.after) idx += 1;
      without.splice(idx, 0, drag.id);
      saveFavoriteOrder(without);
    }
    setDrag(null);
  };

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searchResults = useMemo<FavRow[]>(() => {
    if (!normalizedQuery) return [];
    const rows: FavRow[] = [];
    for (const fav of favorites) {
      const row = rowForFavorite(fav);
      if (!matchesProductSearch(displayName(row), normalizedQuery)) continue;
      rows.push(row);
    }
    return rows.sort((a, b) => compareByName({ name: displayName(a) }, { name: displayName(b) }));
  }, [normalizedQuery, favorites, productById, locale]);

  const categoryLabel = (product: CatalogProduct, fallback: string | undefined): string => {
    const leaf = product.departmentId ? deptById.get(product.departmentId) : undefined;
    return leaf?.name ?? fallback ?? "";
  };

  const quickAdd = (row: FavRow) => {
    const group = groupOfRow(row);
    const name = displayName(row);
    addCatalogItem({
      productId: row.product.departmentId ? row.product.id : row.favorite.productId,
      departmentId: row.product.departmentId || undefined,
      name,
      quantity: formatQuantity(row.favorite.defaultQuantity, row.favorite.defaultUnit),
      unit: row.favorite.defaultUnit,
      organic: false,
      emoji: row.favorite.emoji,
      imageUrl: (row.variant ? row.product.variantImages?.[row.variant]?.imageUrl : undefined) ?? row.favorite.imageUrl ?? row.product.imageUrl,
      groupLabel: group?.name ?? row.favorite.groupLabel,
      groupEmoji: (group?.emoji ?? row.favorite.groupEmoji) ?? undefined,
    });
    toast.success(t("common.addedToList", { name }));
  };

  const removeFavorite = (row: FavRow) => {
    toggleFavorite({
      productId: row.favorite.productId,
      name: row.favorite.name,
      emoji: row.favorite.emoji,
      imageUrl: row.favorite.imageUrl,
      defaultQuantity: row.favorite.defaultQuantity,
      defaultUnit: row.favorite.defaultUnit,
      organicAvailable: row.favorite.organicAvailable,
      groupLabel: row.favorite.groupLabel,
      groupEmoji: row.favorite.groupEmoji,
    });
  };

  /** Öffnet den Dialog zur Namenseingabe für die neue Liste. */
  const openTransferDialog = () => {
    if (!favorites.length) return;
    setListName(t("fav.newListName"));
    setNewStore("default");
    setNewStoreName("");
    setNewStoreEmoji("");
    setListNameOpen(true);
  };

  const addStore = () => {
    const name = newStoreName.trim();
    if (!name) return;
    const id = addCustomStore(name, newStoreEmoji.trim() || undefined);
    setNewStore(id);
    setNewStoreName("");
    setNewStoreEmoji("");
  };

  /** Alle Favoriten (in angezeigter Reihenfolge) in eine neue Einkaufsliste übertragen. */
  const transferAllToNewList = (name: string) => {
    const rows: FavRow[] = [
      ...sections.flatMap((s) => s.entries.map((e) => e.row)),
      ...[...looseFavorites].sort((a, b) => (favOrder[a.favorite.productId] ?? 1e9) - (favOrder[b.favorite.productId] ?? 1e9)),
    ];
    if (!rows.length) return;
    const items: ListItem[] = rows.map((row, i) => {
      const group = groupOfRow(row);
      return {
        id: `i${Date.now()}-${i}`,
        name: catalogListName(displayName(row), row.product.departmentId || undefined),
        quantity: formatQuantity(row.favorite.defaultQuantity, row.favorite.defaultUnit),
        category: "sonstiges",
        checked: false,
        addedBy: selfName,
        addedAt: Date.now(),
        unit: row.favorite.defaultUnit,
        emoji: row.favorite.emoji ?? undefined,
        imageUrl: (row.variant ? row.product.variantImages?.[row.variant]?.imageUrl : undefined) ?? row.favorite.imageUrl ?? row.product.imageUrl,
        groupLabel: group?.name ?? row.favorite.groupLabel,
        groupEmoji: (group?.emoji ?? row.favorite.groupEmoji) ?? undefined,
        productId: row.product.departmentId ? row.product.id : row.favorite.productId,
      };
    });
    const createdId = createListFromItems(name, items);
    if (createdId && newStore !== "__new__") setListStore(createdId, newStore);
    setListNameOpen(false);
    setNewStore("default");
    setNewStoreName("");
    setNewStoreEmoji("");
    toast.success(t("fav.toListDone", { count: items.length }));
    navigate({ to: "/" });
  };

  const renderRow = (row: FavRow, { showCategory = false, sec, ids }: { showCategory?: boolean; sec?: string; ids?: string[] } = {}) => {
    const group = groupOfRow(row);
    const id = row.favorite.productId;
    const isTarget = drag?.target === id && drag.target !== drag.id;
    return (
      <div key={id} data-fav-id={sec ? id : undefined} data-sec={sec} className={`relative flex min-h-20 items-center gap-3 px-3 py-2.5 ${drag?.id === id ? "bg-muted/60" : ""}`}>
        {isTarget && <div className={`pointer-events-none absolute inset-x-2 h-0.5 rounded bg-primary ${drag!.after ? "bottom-0" : "top-0"}`} />}
        <div
          onPointerDown={sec && ids ? (e) => onDragDown(e, id, sec, ids) : undefined}
          onPointerMove={onDragMove}
          onPointerUp={onDragUp}
          onPointerCancel={() => setDrag(null)}
          className={`grid h-12 w-12 shrink-0 select-none place-items-center overflow-hidden rounded-lg bg-primary-soft/25 ${sec ? "touch-none cursor-grab" : ""}`}
        >
          <ProductThumb row={row} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{displayName(row)}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {showCategory && group ? `${group.name} · ` : ""}
            {formatQuantity(row.favorite.defaultQuantity, row.favorite.defaultUnit)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 -mr-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("common.removeFavorite", { name: displayName(row) })}
          onClick={() => removeFavorite(row)}
          className="h-8 w-8 rounded-full bg-coral/15 text-coral"
        >
          <HeartIcon className="h-3.5 w-3.5 fill-current" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("common.quickAdd", { name: displayName(row) })}
          onClick={() => quickAdd(row)}
          className="h-8 w-8 rounded-full text-muted-foreground"
        >
          <BoltIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          aria-label={t("common.addWithQty", { name: displayName(row) })}
          onClick={() => setSelected(row)}
          className="h-8 w-8 rounded-full shadow-none"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </Button>
        <span aria-hidden className="w-1.5 shrink-0" />
        </div>
      </div>
    );
  };

  const renderSection = (rows: FavRow[], sec: string) => {
    const ids = rows.map((r) => r.favorite.productId);
    return (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {rows.map((row) => renderRow(row, { sec, ids }))}
    </div>
    );
  };

  const shownRows = normalizedQuery ? searchResults : null;
  const hasContent = sections.length > 0 || looseFavorites.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("nav.favorites")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("fav.subtitle")}</p>
      </div>

      {hydrated && favorites.length > 0 && (
        <Button type="button" variant="outline" className="w-full" onClick={openTransferDialog}>
          {t("fav.toList", { count: favorites.length })}
        </Button>
      )}

      <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-sm">
        <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("fav.search")}
          aria-label={t("fav.search")}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {normalizedQuery ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">{t("common.searchResults")}</h2>
          </div>
          {shownRows!.length > 0 && (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {shownRows!.map((row) => renderRow(row, { showCategory: true }))}
            </div>
          )}
          {shownRows!.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-4xl" aria-hidden="true">🔎</div>
              <p className="mt-3 text-sm font-medium text-foreground">{t("fav.noResult")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("common.tryOther")}</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {sections.map(({ department, entries }) => (
            <section key={department.id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  <span className="mr-1.5 inline-grid h-5 w-5 align-middle place-items-center"><DepartmentIcon emoji={department.emoji} imageUrl={department.iconUrl ?? department.imageUrl} imagePath={department.iconPath ?? department.imagePath} className="h-5 w-5 object-contain" symbolClassName="text-base" /></span>
                  {department.name}
                </h2>
              </div>
              {renderSection(entries.map((entry) => entry.row), department.id)}
            </section>
          ))}

          {looseFavorites.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">{t("fav.more")}</h2>
              </div>
              {renderSection([...looseFavorites].sort((a, b) => (favOrder[a.favorite.productId] ?? 1e9) - (favOrder[b.favorite.productId] ?? 1e9)), "loose")}
            </section>
          )}

          {hydrated && favorites.length > 0 && !hasContent && (
            <div className="py-12 text-center text-sm text-muted-foreground">{t("fav.none")}</div>
          )}
        </>
      )}

      {hydrated && favorites.length === 0 && (
        <div className="py-16 text-center">
          <HeartIcon className="mx-auto h-12 w-12 text-primary-soft" />
          <p className="mt-4 text-sm font-semibold text-foreground">{t("fav.emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("fav.emptyHint")}</p>
        </div>
      )}

      {listNameOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/30" onClick={() => setListNameOpen(false)}>
          <div
            className="w-full max-w-[440px] rounded-t-3xl bg-background p-5 pb-[calc(2rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />
            <h2 className="mb-4 text-lg font-bold text-foreground">{t("fav.listNameTitle")}</h2>
            <input
              autoFocus
              value={listName}
              onChange={(e) => setListName(e.target.value.slice(0, 60))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && listName.trim() && newStore !== "__new__") transferAllToNewList(listName.trim());
              }}
              onFocus={(e) => e.target.select()}
              placeholder={t("fav.listNamePlaceholder")}
              aria-label={t("fav.listNamePlaceholder")}
              maxLength={60}
              className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="shrink-0">{t("store.label")}</span>
              <select value={newStore} onChange={(e) => setNewStore(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary">
                {stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
                <option value="__new__">{t("store.new")}</option>
              </select>
            </label>
            {newStore === "__new__" && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    value={newStoreEmoji}
                    onChange={(e) => setNewStoreEmoji(e.target.value)}
                    maxLength={4}
                    aria-label={t("store.icon")}
                    placeholder="🏪"
                    className="w-11 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addStore()}
                    placeholder={t("store.newPlaceholder")}
                    className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                  />
                  <button
                    onClick={addStore}
                    disabled={!newStoreName.trim()}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {t("store.add")}
                  </button>
                </div>
                <div className="flex gap-1">
                  {["🏪", "🛒", "🧺", "🏬", "🥖", "🐄", "🌱"].map((e) => (
                    <button key={e} type="button" onClick={() => setNewStoreEmoji(e)} className={`grid h-7 w-7 place-items-center rounded-lg border text-sm ${newStoreEmoji === e ? "border-primary bg-primary-soft/60" : "border-border"}`} aria-label={`${t("store.icon")} ${e}`}>{e}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setListNameOpen(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => listName.trim() && newStore !== "__new__" && transferAllToNewList(listName.trim())}
                disabled={!listName.trim() || newStore === "__new__"}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t("lm.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      <CatalogProductDialog
        product={selected ? selected.product : null}
        groupLabel={selected ? groupOfRow(selected)?.name ?? selected.favorite.groupLabel : undefined}
        initialDepartmentId={selected ? groupOfRow(selected)?.id : undefined}
        initialVariant={selected?.variant}
        groupEmoji={selected ? ((selected.product.departmentId ? deptById.get(selected.product.departmentId)?.emoji : undefined) ?? selected.favorite.groupEmoji) ?? undefined : undefined}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
