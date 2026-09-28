import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { BoltIcon, HeartIcon, PlusIcon } from "../components/icons";
import { Button } from "../components/ui/button";
import { useShoppingList, type FavoriteProduct } from "../hooks/use-shopping-list";
import { catalogQueryOptions, type CatalogProduct } from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";

export const Route = createFileRoute("/favoriten")({
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

/** Unterkategorien mit weniger Einträgen werden unter der Oberkategorie zusammengefasst. */
const MIN_GROUP_SIZE = 3;

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

interface FavoriteGroup {
  label: string;
  emoji: string | null;
  items: FavoriteProduct[];
}

function FavoritesPage() {
  const { addCatalogItem, favorites, hydrated, toggleFavorite } = useShoppingList();
  const [selected, setSelected] = useState<FavoriteProduct | null>(null);
  const { data: catalog } = useQuery(catalogQueryOptions);

  const quickAdd = (favorite: FavoriteProduct) => {
    addCatalogItem({
      productId: favorite.productId,
      name: favorite.name,
      quantity: formatQuantity(favorite.defaultQuantity, favorite.defaultUnit),
      unit: favorite.defaultUnit,
      organic: false,
      emoji: favorite.emoji,
      imageUrl: favorite.imageUrl,
      groupLabel: favorite.groupLabel,
      groupEmoji: favorite.groupEmoji,
    });
    toast.success(`${favorite.name} zur Liste hinzugefügt`);
  };

  const groups = useMemo<FavoriteGroup[]>(() => {
    const deptById = new Map(catalog?.departments.map((d) => [d.id, d]) ?? []);
    const productById = new Map(catalog?.products.map((p) => [p.id, p]) ?? []);

    // 1. Nach direkter (Unter-)Kategorie gruppieren
    const byLeaf = new Map<string, FavoriteGroup>();
    for (const fav of favorites) {
      const label = fav.groupLabel ?? "Sonstiges";
      const emoji = fav.groupEmoji ?? null;
      const group = byLeaf.get(label) ?? { label, emoji, items: [] };
      group.items.push(fav);
      byLeaf.set(label, group);
    }

    // 2. Kleine Unterkategorien auf die Oberkategorie hochziehen
    const merged = new Map<string, FavoriteGroup>();
    for (const group of byLeaf.values()) {
      let label = group.label;
      let emoji = group.emoji;
      if (group.items.length < MIN_GROUP_SIZE) {
        const product = productById.get(group.items[0]!.productId);
        const dept = product ? deptById.get(product.departmentId) : undefined;
        const parent = dept?.parentId ? deptById.get(dept.parentId) : undefined;
        if (parent) {
          label = parent.name;
          emoji = parent.emoji ?? null;
        }
      }
      const target = merged.get(label) ?? { label, emoji, items: [] };
      target.items.push(...group.items);
      merged.set(label, target);
    }

    return [...merged.values()].sort((a, b) => a.label.localeCompare(b.label, "de"));
  }, [favorites, catalog]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Favoriten</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deine Lieblingsprodukte auf einen Blick.</p>
      </div>

      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
            {group.emoji && <span className="text-base">{group.emoji}</span>}
            {group.label}
            <span className="text-xs font-normal text-muted-foreground">({group.items.length})</span>
          </h2>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {group.items.map((favorite) => (
              <div key={favorite.productId} className="flex min-h-20 items-center gap-3 px-3 py-2.5">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft/25 text-3xl">
                  {favorite.imageUrl
                    ? <img src={favorite.imageUrl} alt="" className="h-full w-full object-cover" />
                    : favorite.emoji ?? "🛒"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{favorite.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatQuantity(favorite.defaultQuantity, favorite.defaultUnit)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${favorite.name} aus Favoriten entfernen`}
                  onClick={() => toggleFavorite({
                    productId: favorite.productId,
                    name: favorite.name,
                    emoji: favorite.emoji,
                    imageUrl: favorite.imageUrl,
                    defaultQuantity: favorite.defaultQuantity,
                    defaultUnit: favorite.defaultUnit,
                    organicAvailable: favorite.organicAvailable,
                    groupLabel: favorite.groupLabel,
                    groupEmoji: favorite.groupEmoji,
                  })}
                  className="rounded-full bg-coral/15 text-coral"
                >
                  <HeartIcon className="fill-current" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  aria-label={`${favorite.name} hinzufügen`}
                  onClick={() => setSelected(favorite)}
                  className="rounded-full shadow-none"
                >
                  <PlusIcon />
                </Button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {hydrated && favorites.length === 0 && (
        <div className="py-16 text-center">
          <HeartIcon className="mx-auto h-12 w-12 text-primary-soft" />
          <p className="mt-4 text-sm font-semibold text-foreground">Noch keine Favoriten</p>
          <p className="mt-1 text-xs text-muted-foreground">Tippe bei einem Produkt auf das Herz.</p>
        </div>
      )}

      <CatalogProductDialog
        product={selected ? toCatalogProduct(selected) : null}
        groupLabel={selected?.groupLabel}
        groupEmoji={selected?.groupEmoji}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </div>
  );
}
