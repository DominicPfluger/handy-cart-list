import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { Button } from "../components/ui/button";
import { HeartIcon, PlusIcon, SearchIcon } from "../components/icons";
import { useShoppingList } from "../hooks/use-shopping-list";
import {
  catalogQueryOptions,
  childrenOf,
  pathTo,
  productsOf,
  type CatalogDepartment,
  type CatalogProduct,
} from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";

export const Route = createFileRoute("/abteilungen")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  head: () => ({
    meta: [
      { title: "Shoppi — Abteilungen" },
      { name: "description", content: "Produkte nach Abteilungen und Kategorien entdecken und zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Abteilungen" },
      { property: "og:description", content: "Produkte nach Abteilungen und Kategorien entdecken." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DepartmentsPage,
});

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

function DepartmentsPage() {
  const { data } = useSuspenseQuery(catalogQueryOptions);
  const { isFavorite, toggleFavorite } = useShoppingList();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  const current = data.departments.find((department) => department.id === currentId) ?? null;
  const breadcrumbs = pathTo(data.departments, currentId);
  const childDepartments = childrenOf(data.departments, currentId);
  const directProducts = currentId ? productsOf(data.products, currentId) : [];
  const normalizedQuery = query.trim().toLocaleLowerCase("de");
  const searchResults = useMemo(
    () => normalizedQuery
      ? data.products.filter((product) => product.name.toLocaleLowerCase("de").includes(normalizedQuery))
      : [],
    [data.products, normalizedQuery],
  );

  const groupFor = (product: CatalogProduct) =>
    data.departments.find((department) => department.id === product.departmentId) ?? current;

  const openDepartment = (id: string | null) => {
    setCurrentId(id);
    setQuery("");
  };

  const shownProducts = normalizedQuery ? searchResults : directProducts;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Abteilungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">Was möchtest du einkaufen?</p>
      </div>

      <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-sm">
        <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Produkte durchsuchen"
          aria-label="Produkte durchsuchen"
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

      {!normalizedQuery && childDepartments.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-base font-semibold text-foreground">{current ? "Kategorien" : "Alle Abteilungen"}</h2>
            <span className="text-xs text-muted-foreground">{childDepartments.length} Bereiche</span>
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

      {(normalizedQuery || shownProducts.length > 0) && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">{normalizedQuery ? "Suchergebnisse" : "Produkte"}</h2>
            <span className="shrink-0 text-xs text-muted-foreground">{shownProducts.length} Artikel</span>
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {shownProducts.map((product) => {
              const group = groupFor(product);
              const favorite = isFavorite(product.id);
              return (
                <div key={product.id} className="flex min-h-20 items-center gap-3 px-3 py-2.5">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft/25">
                    <ProductThumb product={product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {normalizedQuery && group ? `${group.name} · ` : ""}{formatQuantity(product.defaultQuantity, product.defaultUnit)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={favorite ? `${product.name} aus Favoriten entfernen` : `${product.name} favorisieren`}
                    onClick={() => toggleFavorite({
                      productId: product.id,
                      name: product.name,
                      emoji: product.emoji,
                      imageUrl: product.imageUrl,
                      defaultQuantity: product.defaultQuantity,
                      defaultUnit: product.defaultUnit,
                      organicAvailable: product.organicAvailable,
                      groupLabel: group?.name,
                      groupEmoji: group?.emoji ?? undefined,
                    })}
                    className={favorite ? "rounded-full bg-coral/15 text-coral" : "rounded-full text-muted-foreground"}
                  >
                    <HeartIcon className={favorite ? "fill-current" : ""} />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    aria-label={`${product.name} hinzufügen`}
                    onClick={() => setSelectedProduct(product)}
                    className="rounded-full shadow-none"
                  >
                    <PlusIcon />
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {normalizedQuery && shownProducts.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl" aria-hidden="true">🔎</div>
          <p className="mt-3 text-sm font-medium text-foreground">Kein Produkt gefunden</p>
          <p className="mt-1 text-xs text-muted-foreground">Versuche einen anderen Suchbegriff.</p>
        </div>
      )}

      {!normalizedQuery && childDepartments.length === 0 && directProducts.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">In dieser Kategorie gibt es noch keine Produkte.</div>
      )}

      <CatalogProductDialog
        product={selectedProduct}
        groupLabel={selectedProduct ? groupFor(selectedProduct)?.name : undefined}
        groupEmoji={selectedProduct ? groupFor(selectedProduct)?.emoji : undefined}
        onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
      />
    </div>
  );
}