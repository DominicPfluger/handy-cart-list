import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "../hooks/use-is-admin";
import { Button } from "../components/ui/button";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { ProductEmoji } from "../components/product-emoji";
import { HeartIcon, PlusIcon } from "../components/icons";
import { RenameDialog, type RenameTarget } from "../components/rename-dialog";
import { ensureCatalog, catalogQueryOptions, brandsFor, originalName, useCatalog } from "../lib/catalog-query";
import { CachedImage } from "../components/catalog-icon";
import { useCustomNames } from "../hooks/use-custom-names";
import { getUnits } from "../lib/units";
import { getLocale, useT } from "../i18n";
import { useShoppingList } from "../hooks/use-shopping-list";
import { useFavoriteQuantity } from "../hooks/use-favorite-quantity";
import { useReferencePrices, formatRefPrice } from "../hooks/use-reference-prices";
import { useMarket } from "../hooks/use-market";
import { addPersonalVariant, removePersonalVariant, usePersonalVariants } from "../hooks/use-personal-variants";

export const Route = createFileRoute("/produkt/$id")({
  ssr: false,
  loader: ({ context }) => ensureCatalog(context.queryClient, getLocale()),
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
  const data = useCatalog();
  const market = useMarket();
  const { isFavorite, toggleFavorite } = useShoppingList();
  const [adding, setAdding] = useState(false);
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [personalVariantName, setPersonalVariantName] = useState("");
  const personalVariants = usePersonalVariants();
  const customNames = useCustomNames();
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const fav = useFavoriteQuantity(id);
  const [favQty, setFavQty] = useState("1");
  const [favUnit, setFavUnit] = useState("stueck");

  const product = data.products.find((p) => p.id === id);
  const refPrices = useReferencePrices();
  const refPrice = refPrices.data?.get(id);
  useEffect(() => {
    setFavQty(String(fav.value?.quantity ?? product?.defaultQuantity ?? 1));
    setFavUnit(fav.value?.unit ?? product?.defaultUnit ?? "stueck");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fav.value, product?.id]);
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
  const brands = brandsFor(product, market);
  const variantLabel = (v: string) => product.variantNames?.[v]?.[locale] ?? v;
  const ownVariants = personalVariants[product.id] ?? [];
  const catalogProduct = qc.getQueryData<ReturnType<typeof useCatalog>>(catalogQueryOptions(locale).queryKey)?.products.find((p) => p.id === product.id);
  const sharedVariants = catalogProduct?.variants ?? product.variants.filter((v) => !ownVariants.includes(v));
  const units = getUnits(locale);

  const save = async (patch: { default_unit?: string; variants?: string[] }) => {
    setSaving(true);
    const { error } = await supabase.from("products").update(patch as never).eq("id", product.id);
    if (error) { setSaving(false); toast.error(t("cloud.error")); return; }
    await qc.invalidateQueries({ queryKey: catalogQueryOptions(locale).queryKey });
    setSaving(false);
    toast.success(t("pd.saved"));
  };
  const addOwnVariant = () => {
    if (addPersonalVariant(product.id, personalVariantName, product.variants)) {
      setPersonalVariantName("");
    } else {
      toast.error(t("dept.variantDuplicate"));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-4">
      <button type="button" onClick={() => history.back()} className="text-sm font-semibold text-primary">
        ← {t("pd.back")}
      </button>

      <div className="mt-4 flex flex-col items-center text-center">
        <div className="grid aspect-square w-full max-w-xs place-items-center overflow-hidden rounded-3xl bg-primary-soft/25">
          {product.imagePath ? (
            <CachedImage key={product.imagePath} path={product.imagePath} signedUrl={product.imageUrl} className="h-full w-full object-cover" fallback={<ProductEmoji emoji={product.emoji} className="text-8xl" />} />
          ) : (
            <ProductEmoji emoji={product.emoji} className="text-8xl" />
          )}
        </div>
        <div className="mt-4 flex max-w-full items-center justify-center gap-2">
          <button type="button" className="min-w-0 cursor-pointer rounded-lg px-1 transition hover:bg-muted" aria-label={t("rename.action", { name: product.name })} title={t("rename.title")}
            onClick={() => setRenameTarget({ id: product.id, name: product.name, originalName: originalName(product), isCustom: !!customNames[product.id], kind: "product" })}>
            <h1 className="break-words text-2xl font-bold text-foreground">{product.name}</h1>
          </button>
        </div>
        {refPrice && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("price.reference")}: {formatRefPrice(refPrice)} · {new Date(refPrice.observed_at).toLocaleDateString(locale)}
          </p>
        )}
        {department && (
          <Link to="/abteilungen" className="mt-1 text-sm text-muted-foreground">
            {department.emoji} {department.name}
          </Link>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">{t("pd.favQuantity")}</p>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={favQty}
            onChange={(e) => setFavQty(e.target.value)}
            aria-label={t("pd.favQuantity")}
            className="w-24 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary"
          />
          <select
            value={favUnit}
            onChange={(e) => setFavUnit(e.target.value)}
            aria-label={t("pd.unit")}
            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-2 py-2 text-sm font-semibold text-foreground"
          >
            {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={!Number(favQty.replace(",", ".")) || Number(favQty.replace(",", ".")) <= 0}
            onClick={() => {
              const n = Number(favQty.replace(",", "."));
              if (!n || n <= 0) return;
              fav.save({ quantity: n, unit: favUnit });
              toast.success(t("pd.favQuantitySaved"));
            }}
            className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-50"
          >
            {t("pd.saveFavQuantity")}
          </button>
          {fav.value && (
            <button
              type="button"
              onClick={fav.clear}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              {t("pd.resetFavQuantity")}
            </button>
          )}
        </div>
      </div>

      <dl className="mt-4 space-y-3 rounded-2xl bg-card p-4 shadow-sm">
        {product.variants.some((v) => v.trim().toLowerCase() === "bio") && (
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
      </dl>

      <div className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
        <div className="text-sm">
            <p className="text-muted-foreground">{t("pd.variants")}</p>
            {ownVariants.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ownVariants.map((v) => (
                <span key={v} className="rounded-full bg-primary-soft/25 px-2.5 py-1 text-xs font-medium text-foreground">
                  {variantLabel(v)}
                  {ownVariants.includes(v) && !sharedVariants.includes(v) ? (
                    <Button type="button" variant="ghost" size="sm" aria-label={t("dept.removeVariant", { name: variantLabel(v) })} title={t("dept.removeVariant", { name: variantLabel(v) })} onClick={() => removePersonalVariant(product.id, v)} className="ml-1 h-5 min-w-5 p-0 text-muted-foreground">×</Button>
                  ) : isAdmin ? (
                    <Button type="button" variant="ghost" size="sm" aria-label={t("pd.removeVariant", { name: variantLabel(v) })} disabled={saving}
                      onClick={() => void save({ variants: sharedVariants.filter((x) => x !== v) })}
                      className="ml-1 h-5 min-w-5 p-0 text-muted-foreground">×</Button>
                  ) : null}
                </span>
              ))}
            </div>}
            <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); addOwnVariant(); }}>
              <input value={personalVariantName} onChange={(e) => setPersonalVariantName(e.target.value)} maxLength={40} placeholder={t("dept.variantPlaceholder")} aria-label={t("dept.variantPlaceholder")}
                className="min-w-32 flex-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary" />
              <Button type="submit" size="sm" disabled={!personalVariantName.trim()} className="shrink-0 rounded-full">
                {t("dept.addVariant")}
              </Button>
            </form>
          </div>
      </div>

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
      <RenameDialog target={renameTarget} onClose={() => setRenameTarget(null)} />
    </div>
  );
}
