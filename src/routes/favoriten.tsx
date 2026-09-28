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
  childrenOf,
  pathTo,
  productsOf,
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
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />;
  }
  return <span className="text-3xl" aria-hidden="true">{product.emoji ?? "🛒"}</span>;
}

function DepartmentThumb({ department }: { department: CatalogDepartment }) {
  if (department.imageUrl) {
    return <img src={department.imageUrl} alt="" className="h-full w-full object-cover" />;
  }
  return <span className="text-5xl" aria-hidden="true">{department.emoji ?? "🧺"}</span>;
}

function FavoritesPage() {
  const { addCatalogItem, favorites, hydrated, toggleFavorite } = useShoppingList();
  const { data } = useSuspenseQuery(catalogQueryOptions);
  const [currentId, setCurrentId] = useState<string | null>(null);
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
  const favIds = useMemo(() => new Set(favorites.map((f) => f.productId)), [favorites]);

  /** Abteilungen, die (direkt oder über Unterkategorien) Favoriten enthalten. */
  const deptsWithFavorites = useMemo(() => {
    const has = new Set<string>();
    for (const fav of favorites) {
      const product = productById.get(fav.productId);
      if (!product) continue;
      let current = deptById.get(product.departmentId);
      while (current) {
        has.add(current.id);
        current = current.parentId ? deptById.get(current.parentId) : undefined;
      }
    }
    return has;
  }, [favorites, deptById, productById]);

  /** Favoriten ohne passendes Katalogprodukt (z. B. entfernte Produkte). */
  const looseFavorites = useMemo(
    () => favorites.filter((fav) => !productById.has(fav.productId)),
    [favorites, productById],
  );

  const current = data.departments.find((department) => department.id === currentId) ?? null;
  const breadcrumbs = pathTo(data.departments, currentId);
  const childDepartments = childrenOf(data.departments, currentId).filter((department) =>
    deptsWithFavorites.has(department.id),
  );
  const directFavorites = currentId
    ? productsOf(data.products, currentId)
        .filter((product) => favIds.has(product.id))
        .map((product) => ({ product, favorite: favorites.find((f) => f.productId === product.id)! }))
    : [];

  const normalizedQuery = query.trim().toLocaleLowerCase("de");
  const searchResults = useMemo<FavRow[]>(() => {
    if (!normalizedQuery) return [];
    const rows: FavRow[] = [];
    for (const fav of favorites) {
      if (!fav.name.toLocaleLowerCase("de").includes(normalizedQuery)) continue;
      rows.push({ product: productById.get(fav.productId) ?? toCatalogProduct(fav), favorite: fav });
    }
    return rows;
  }, [normalizedQuery, favorites, productById]);

  const groupFor = (product: CatalogProduct): CatalogDepartment | null =>
    deptById.get(product.departmentId) ?? null;

  const openDepartment = (id: string | null) => {
    setCurrentId(id);
    setQuery("");
  };

  const quickAdd = (row: FavRow) => {
    const group = groupFor(row.product);
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

  const shownRows: FavRow[] | null = normalizedQuery ? searchResults : null;

  const renderRow = (row: FavRow, { showGroup = false }: { showGroup?: boolean } = {}) => {
    const group = groupFor(row.product);
    return (
      <div key={row.favorite.productId} className="flex min-h-20 items-center gap-3 px-3 py-2.5">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft/25">
          <ProductThumb product={row.product} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{row.favorite.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {showGroup && group ? `${group.name} · ` : ""}
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

  const renderSection = (rows: FavRow[], { showGroup = false }: { showGroup?: boolean } = {}) => (
    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {rows.map((row) => renderRow(row, { showGroup }))}
    </div>
  );

  const showCategoryGrid = !normalizedQuery && childDepartments.length > 0;
  const shownDirect = normalizedQuery ? [] : directFavorites;
  const showLoose = !normalizedQuery && looseFavorites.length > 0;

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

      {!normalizedQuery && breadcrumbs.length > 0 && (
        <nav aria-label="Brotkrumen" className="no-scrollbar flex items-center gap-1 overflow-x-auto text-xs">
          <Button type="button" variant="ghost" size="sm" onClick={() => openDepartment(null)} className="shrink-0 px-2 text-muted-foreground">
            Alle
          </Button>
          {breadcrumbs.map((department, index) => (
            <div key={department.id} className="flex shrink-0 items-center gap-1">
              <span className="text-muted-foreground" aria-hidden="true">›</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openDepartment(department.id)}
                className={index === breadcrumbs.length - 1 ? "px-2 font-semibold text-primary" : "px-2 text-muted-foreground"}
              >
                {department.name}
              </Button>
            </div>
          ))}
        </nav>
      )}

      {showCategoryGrid && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-base font-semibold text-foreground">{current ? "Kategorien" : "Kategorien mit Favoriten"}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {childDepartments.map((department) => (
              <Button
                key={department.id}
                type="button"
                variant="ghost"
                onClick={() => openDepartment(department.id)}
                className="h-auto min-w-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 text-left shadow-sm active:scale-[0.98]"
              >
                <span className="grid aspect-[4/3] w-full place-items-center overflow-hidden bg-primary-soft/25">
                  <DepartmentThumb department={department} />
                </span>
                <span className="flex min-h-14 w-full items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 whitespace-normal text-sm font-semibold leading-5 text-foreground">{department.name}</span>
                  <span className="shrink-0 text-lg text-primary" aria-hidden="true">›</span>
                </span>
              </Button>
            ))}
          </div>
        </section>
      )}

      {(normalizedQuery || shownDirect.length > 0) && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">{normalizedQuery ? "Suchergebnisse" : "Favoriten"}</h2>
            <span className="shrink-0 text-xs text-muted-foreground">
              {normalizedQuery ? shownRows!.length : shownDirect.length} Artikel
            </span>
          </div>
          {renderSection(normalizedQuery ? shownRows! : shownDirect, { showGroup: !!normalizedQuery })}
        </section>
      )}

      {showLoose && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-base font-semibold text-foreground">Weitere Favoriten</h2>
          </div>
          {renderSection(looseFavorites.map((favorite) => ({ product: toCatalogProduct(favorite), favorite })))}
        </section>
      )}

      {normalizedQuery && searchResults.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl" aria-hidden="true">🔎</div>
          <p className="mt-3 text-sm font-medium text-foreground">Kein Favorit gefunden</p>
          <p className="mt-1 text-xs text-muted-foreground">Versuche einen anderen Suchbegriff.</p>
        </div>
      )}

      {!normalizedQuery && hydrated && favorites.length > 0 && childDepartments.length === 0 && shownDirect.length === 0 && looseFavorites.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">In dieser Kategorie gibt es keine Favoriten.</div>
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
        groupLabel={selected ? (groupFor(selected.product)?.name ?? selected.favorite.groupLabel) : undefined}
        groupEmoji={selected ? ((groupFor(selected.product)?.emoji ?? selected.favorite.groupEmoji) ?? undefined) : undefined}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
