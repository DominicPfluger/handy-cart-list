import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { HeartIcon, PlusIcon } from "../components/icons";
import { Button } from "../components/ui/button";
import { useShoppingList, type FavoriteProduct } from "../hooks/use-shopping-list";
import type { CatalogProduct } from "../lib/catalog-query";
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

function FavoritesPage() {
  const { favorites, hydrated, toggleFavorite } = useShoppingList();
  const [selected, setSelected] = useState<FavoriteProduct | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Favoriten</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deine Lieblingsprodukte auf einen Blick.</p>
      </div>

      {favorites.length > 0 && (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {favorites.map((favorite) => (
            <div key={favorite.productId} className="flex min-h-20 items-center gap-3 px-3 py-2.5">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft/25 text-3xl">
                {favorite.imageUrl
                  ? <img src={favorite.imageUrl} alt="" className="h-full w-full object-cover" />
                  : favorite.emoji ?? "🛒"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{favorite.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {favorite.groupLabel ? `${favorite.groupLabel} · ` : ""}{formatQuantity(favorite.defaultQuantity, favorite.defaultUnit)}
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
      )}

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