import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { Button } from "../components/ui/button";
import { BoltIcon, HeartIcon, PlusIcon, SearchIcon } from "../components/icons";
import { useShoppingList, type FavoriteProduct } from "../hooks/use-shopping-list";
import {
  catalogQueryOptions,
  compareByName,
  matchesProductSearch,
  type CatalogDepartment,
  type CatalogProduct,
} from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";

export const Route = createFileRoute("/favoriten")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
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
    sortOrder: 0,
  };
}

function ProductThumb({ product }: { product: CatalogProduct }) {
  return <span className="text-3xl" aria-hidden="true">{product.emoji ?? "🛒"}</span>;
}

function FavoritesPage() {
  const { addCatalogItem, favorites, hydrated, toggleFavorite } = useShoppingList();
  const { data } = useSuspenseQuery(catalogQueryOptions);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FavRow | null>(null);

  const deptById = useMemo(
    () => new Map(data.departments.map((d) => [d.id, d])),
    [data.departments],
  );
  const productById = useMemo(
    () => new Map(data.products.map((p) => [p.id, p])),
    [data.products],
  );

  /** Hauptabteilungen (oberste Ebene), sortiert wie in der Abteilungsansicht. */
  const rootDepartments = useMemo(
    () =>
      data.departments
        .filter((d) => !d.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [data.departments],
  );

  /** Hauptabteilung eines Produkts über die Hierarchie auflösen. */
  const rootOf = (leaf: CatalogDepartment): CatalogDepartment | null => {
    let current: CatalogDepartment | undefined = leaf;
    while (current?.parentId) {
      current = deptById.get(current.parentId);
    }
    return current ?? null;
  };

  /** Gruppierte Favoriten je Hauptabteilung + Favoriten ohne Katalogprodukt. */
  const { entriesByRoot, looseFavorites } = useMemo(() => {
    const byRoot = new Map<string, FavEntry[]>();
    const loose: FavRow[] = [];
    for (const favorite of favorites) {
      const product = productById.get(favorite.productId);
      if (!product) {
        loose.push({ product: toCatalogProduct(favorite), favorite });
        continue;
      }
      const leaf = deptById.get(product.departmentId) ?? null;
      const root = leaf ? rootOf(leaf) : null;
      if (!root) {
        loose.push({ product, favorite });
        continue;
      }
      const list = byRoot.get(root.id) ?? [];
      list.push({ row: { product, favorite }, leaf, rootId: root.id });
      byRoot.set(root.id, list);
    }
    return { entriesByRoot: byRoot, looseFavorites: loose };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites, deptById, productById, data.departments]);

  /** Sortierung innerhalb einer Kategorie analog zur Abteilungsansicht:
   *  zuerst nach Kategorie (sortOrder), dann nach Produkt (sortOrder). */
  const sortEntries = (entries: FavEntry[]) =>
    [...entries].sort((a, b) => {
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
      return a.row.favorite.name.localeCompare(b.row.favorite.name, "de");
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
    [rootDepartments, entriesByRoot],
  );

  const normalizedQuery = query.trim().toLocaleLowerCase("de");
  const searchResults = useMemo<FavRow[]>(() => {
    if (!normalizedQuery) return [];
    const rows: FavRow[] = [];
    for (const fav of favorites) {
      if (!matchesProductSearch(fav.name, normalizedQuery)) continue;
      rows.push({ product: productById.get(fav.productId) ?? toCatalogProduct(fav), favorite: fav });
    }
    return rows.sort((a, b) => compareByName(a.favorite, b.favorite));
  }, [normalizedQuery, favorites, productById]);

  const categoryLabel = (product: CatalogProduct, fallback: string | undefined): string => {
    const leaf = product.departmentId ? deptById.get(product.departmentId) : undefined;
    return leaf?.name ?? fallback ?? "";
  };

  const quickAdd = (row: FavRow) => {
    const group = row.product.departmentId ? deptById.get(row.product.departmentId) : undefined;
    addCatalogItem({
      productId: row.favorite.productId,
      name: row.favorite.name,
      quantity: formatQuantity(row.favorite.defaultQuantity, row.favorite.defaultUnit),
      unit: row.favorite.defaultUnit,
      organic: false,
      emoji: row.favorite.emoji,
      imageUrl: row.product.imageUrl ?? row.favorite.imageUrl,
      groupLabel: group?.name ?? row.favorite.groupLabel,
      groupEmoji: (group?.emoji ?? row.favorite.groupEmoji) ?? undefined,
    });
    toast.success(`${row.favorite.name} zur Liste hinzugefügt`);
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

  const renderRow = (row: FavRow, { showCategory = false }: { showCategory?: boolean } = {}) => {
    const group = row.product.departmentId ? deptById.get(row.product.departmentId) : undefined;
    return (
      <div key={row.favorite.productId} className="flex min-h-20 items-center gap-3 px-3 py-2.5">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft/25">
          <ProductThumb product={row.product} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{row.favorite.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {showCategory && group ? `${group.name} · ` : ""}
            {formatQuantity(row.favorite.defaultQuantity, row.favorite.defaultUnit)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${row.favorite.name} aus Favoriten entfernen`}
          onClick={() => removeFavorite(row)}
          className="rounded-full bg-coral/15 text-coral"
        >
          <HeartIcon className="h-3.5 w-3.5 fill-current" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${row.favorite.name} schnell hinzufügen (Standardmenge)`}
          onClick={() => quickAdd(row)}
          className="rounded-full text-muted-foreground"
        >
          <BoltIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          aria-label={`${row.favorite.name} mit Menge hinzufügen`}
          onClick={() => setSelected(row)}
          className="rounded-full shadow-none"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  const renderSection = (rows: FavRow[]) => (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {rows.map((row) => renderRow(row))}
    </div>
  );

  const shownRows = normalizedQuery ? searchResults : null;
  const hasContent = sections.length > 0 || looseFavorites.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Favoriten</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deine Lieblingsprodukte auf einen Blick.</p>
      </div>

      <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-sm">
        <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Favoriten durchsuchen"
          aria-label="Favoriten durchsuchen"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {normalizedQuery ? (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Suchergebnisse</h2>
            <span className="shrink-0 text-xs text-muted-foreground">{shownRows!.length} Artikel</span>
          </div>
          {shownRows!.length > 0 && (
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {shownRows!.map((row) => renderRow(row, { showCategory: true }))}
            </div>
          )}
          {shownRows!.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-4xl" aria-hidden="true">🔎</div>
              <p className="mt-3 text-sm font-medium text-foreground">Kein Favorit gefunden</p>
              <p className="mt-1 text-xs text-muted-foreground">Versuche einen anderen Suchbegriff.</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {sections.map(({ department, entries }) => (
            <section key={department.id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">
                  <span className="mr-1.5" aria-hidden="true">{department.emoji ?? "🧺"}</span>
                  {department.name}
                </h2>
                <span className="shrink-0 text-xs text-muted-foreground">{entries.length} Artikel</span>
              </div>
              {renderSection(entries.map((entry) => entry.row))}
            </section>
          ))}

          {looseFavorites.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">Weitere Favoriten</h2>
                <span className="shrink-0 text-xs text-muted-foreground">{looseFavorites.length} Artikel</span>
              </div>
              {renderSection(looseFavorites)}
            </section>
          )}

          {hydrated && favorites.length > 0 && !hasContent && (
            <div className="py-12 text-center text-sm text-muted-foreground">Keine Favoriten gefunden.</div>
          )}
        </>
      )}

      {hydrated && favorites.length === 0 && (
        <div className="py-16 text-center">
          <HeartIcon className="mx-auto h-12 w-12 text-primary-soft" />
          <p className="mt-4 text-sm font-semibold text-foreground">Noch keine Favoriten</p>
          <p className="mt-1 text-xs text-muted-foreground">Tippe bei einem Produkt auf das Herz.</p>
        </div>
      )}

      <CatalogProductDialog
        product={selected ? selected.product : null}
        groupLabel={selected ? (selected.product.departmentId ? deptById.get(selected.product.departmentId)?.name : undefined) ?? selected.favorite.groupLabel : undefined}
        groupEmoji={selected ? ((selected.product.departmentId ? deptById.get(selected.product.departmentId)?.emoji : undefined) ?? selected.favorite.groupEmoji) ?? undefined : undefined}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
