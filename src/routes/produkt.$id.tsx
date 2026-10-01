import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "../hooks/use-is-admin";
import { translateVariants } from "../lib/admin.functions";
import { Button } from "../components/ui/button";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { ProductEmoji } from "../components/product-emoji";
import { HeartIcon, PlusIcon } from "../components/icons";
import { catalogQueryOptions, brandsFor } from "../lib/catalog-query";
import { formatQuantity, getUnits } from "../lib/units";
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
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const trVariants = useServerFn(translateVariants);
  const [newVariant, setNewVariant] = useState("");
  const [saving, setSaving] = useState(false);

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
  const DB_UNITS = new Set(["stueck","gramm","kilogramm","milligramm","pfund","unzen","milliliter","deziliter","liter","gallone","tasse","glas","flasche","dose","beutel","packung","schachtel","box","karton","kiste","kanister","buendel"]);
  const units = getUnits(locale).filter((u) => DB_UNITS.has(u.id));

  const save = async (patch: { default_unit?: string; variants?: string[] }, translate = false) => {
    setSaving(true);
    const { error } = await supabase.from("products").update(patch as never).eq("id", product.id);
    if (error) { setSaving(false); toast.error(t("cloud.error")); return; }
    if (translate) { try { await trVariants({ data: { productId: product.id } }); } catch { /* optional */ } }
    await qc.invalidateQueries({ queryKey: catalogQueryOptions(locale).queryKey });
    setSaving(false);
    toast.success(t("pd.saved"));
  };
  const addVariant = async () => {
    const v = newVariant.trim();
    if (!v || product.variants.includes(v)) return;
    setNewVariant("");
    await save({ variants: [...product.variants, v] }, true);
  };

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
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">{t("pd.unit")}</dt>
          <dd>
            <select
              value={product.defaultUnit}
              disabled={!isAdmin || saving}
              aria-label={t("pd.unit")}
              onChange={(e) => void save({ default_unit: e.target.value })}
              className="rounded-lg border border-border bg-card px-2 py-1 text-sm font-semibold text-foreground disabled:opacity-80"
            >
              {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </dd>
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
        {(product.variants.length > 0 || isAdmin) && (
          <div className="text-sm">
            <dt className="text-muted-foreground">{t("pd.variants")}</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {product.variants.map((v) => (
                <span key={v} className="rounded-full bg-primary-soft/25 px-2.5 py-1 text-xs font-medium text-foreground">
                  {variantLabel(v)}
                  {isAdmin && (
                    <button type="button" aria-label={t("pd.removeVariant", { name: variantLabel(v) })} disabled={saving}
                      onClick={() => void save({ variants: product.variants.filter((x) => x !== v) })}
                      className="ml-1.5 text-muted-foreground">×</button>
                  )}
                </span>
              ))}
            </dd>
            {isAdmin && (
              <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); void addVariant(); }}>
                <input value={newVariant} onChange={(e) => setNewVariant(e.target.value)} placeholder={t("pd.variantPh")} aria-label={t("pd.variantPh")}
                  className="min-w-0 flex-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary" />
                <button type="submit" disabled={!newVariant.trim() || saving} className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                  {t("pd.addVariant")}
                </button>
              </form>
            )}
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
