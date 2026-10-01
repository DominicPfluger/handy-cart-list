import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { ProductEmoji } from "../components/product-emoji";
import { HeartIcon, PlusIcon } from "../components/icons";
import { catalogQueryOptions, brandsFor } from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";
import { getLocale, useT } from "../i18n";
import { useShoppingList } from "../hooks/use-shopping-list";

export const Route = createFileRoute("/produkt/$id")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions(getLocale())),
  head: () => ({
    meta: [
      { title: "Shoppi — Produkt" },
      { name: "description", content: "Produktdetails, Marken und Varianten in Shoppi." },
      { property: "og:title", content: "Shoppi — Produkt" },
      { property: "og:description", content: "Produktdetails, Marken und Varianten in Shoppi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { t } = useT();
  const navigate = useNavigate();
  const locale = getLocale();
  const { data } = useSuspenseQuery(catalogQueryOptions(locale));
  const { isFavorite, toggleFavorite } = useShoppingList();
  const [adding, setAdding] = useState(false);

  const product = data.products.find((p) => p.id === id);
  if (!product) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="text-4xl" aria-hidden="true">🔎</div>
        <p className="mt-3 text-sm font-medium text-foreground">{t("pd.notFound")}</p>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/abteilungen" })} className="mt-4 rounded-xl">
          {t("pd.back")}
        </Button>
      </div>
    );
  }

  const department = data.departments.find((d) => d.id === product.departmentId);
  const favorite = isFavorite(product.id);
  const brands = brandsFor(product);
  const variantLabel = (v: string) => product.variantNames?.[v]?.[locale] ?? v;

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-4">
      <button type="button" onClick={() => history.back()} className="text-sm font-semibold text-primary">
        ← {t("pd.back")}
      </button>

      <div className="mt-4 flex flex-col items-center text-center">
        <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-3xl bg-primary-soft/25">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <ProductEmoji emoji={product.emoji} className="text-6xl" />
          )}
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">{product.name}</h1>
        {department && (
          <Link to="/abteilungen" className="mt-1 text-sm text-muted-foreground">
            {department.emoji} {department.name}
          </Link>
        )}
      </div>

      <dl className="mt-6 space-y-3 rounded-2xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <dt className="text-muted-foreground">{t("pd.quantity")}</dt>
          <dd className="font-semibold text-foreground">{formatQuantity(product.defaultQuantity, product.defaultUnit)}</dd>
        </div>
        {product.organicAvailable && (
          <div className="flex items-center justify-between text-sm">
            <dt className="text-muted-foreground">{t("common.organic")}</dt>
            <dd className="font-semibold text-foreground">🌿</dd>
          </div>
        )}
        {brands.length > 0 && (
          <div className="flex items-start justify-between gap-4 text-sm">
            <dt className="shrink-0 text-muted-foreground">{t("pd.brands")}</dt>
            <dd className="text-right font-semibold text-foreground">{brands.join(", ")}</dd>
          </div>
        )}
        {product.variants.length > 0 && (
          <div className="text-sm">
            <dt className="text-muted-foreground">{t("pd.variants")}</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {product.variants.map((v) => (
                <span key={v} className="rounded-full bg-primary-soft/25 px-2.5 py-1 text-xs font-medium text-foreground">
                  {variantLabel(v)}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={favorite ? t("common.removeFavorite", { name: product.name }) : t("common.addFavorite", { name: product.name })}
          onClick={() =>
            toggleFavorite({
              productId: product.id,
              name: product.name,
              emoji: product.emoji,
              imageUrl: product.imageUrl,
              defaultQuantity: product.defaultQuantity,
              defaultUnit: product.defaultUnit,
              organicAvailable: product.organicAvailable,
              groupLabel: department?.name,
              groupEmoji: department?.emoji ?? undefined,
            })
          }
          className={`h-12 w-12 rounded-xl ${favorite ? "bg-coral/15 text-coral" : "text-muted-foreground"}`}
        >
          <HeartIcon className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} />
        </Button>
        <Button type="button" onClick={() => setAdding(true)} className="h-12 flex-1 rounded-xl">
          <PlusIcon className="h-5 w-5" /> {t("pd.addToList")}
        </Button>
      </div>

      <CatalogProductDialog
        product={adding ? product : null}
        groupLabel={department?.name}
        groupEmoji={department?.emoji ?? undefined}
        initialDepartmentId={department?.id}
        onOpenChange={(open) => { if (!open) setAdding(false); }}
      />
    </div>
  );
}
