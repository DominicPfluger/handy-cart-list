import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getLocale, pickName, useLocale } from "../i18n";
import { getCatalog, getCatalogImageUrls, type Catalog, type CatalogDepartment, type CatalogHeading, type CatalogProduct, type CatalogCuisine } from "./catalog.functions";
import { useCustomNames } from "../hooks/use-custom-names";
import { useCustomCatalog } from "../hooks/use-custom-catalog";
import { useAllMarkets } from "../hooks/use-all-markets";

/** Ländercode des Marktes aus der Sprachvariante (de-CH → CH). */
export function marketOf(locale: string): string {
  return locale.split("-")[1] ?? "";
}

export function flagOf(market: string): string {
  return market.length === 2 ? String.fromCodePoint(...[...market.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "";
}

/** Ist das Produkt im Markt sichtbar? */
export function inMarket(p: Pick<CatalogProduct, "markets" | "excludedMarkets">, market: string): boolean {
  if (p.markets?.length && !p.markets.includes(market)) return false;
  return !(p.excludedMarkets ?? []).includes(market);
}

/** Katalog für eine Sprachvariante (nur deren Übersetzungen werden geladen). */
export const catalogQueryOptions = (locale: string) =>
  queryOptions({
    queryKey: ["catalog", locale],
    queryFn: () => getCatalog({ data: { locale } }),
    // Neue Kategorien und Produkte sollen nach kurzer Zeit auch in bereits geöffneten Apps erscheinen.
    staleTime: 60 * 1000,
    // Loader uses ensureQueryData (fetchQuery = no retry by default). Retry so a
    // single interrupted request (reload/HMR during the large download) doesn't blank the page.
    retry: 3,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
  });

/** Signierte Bild-Adressen – leichtgewichtig, wird vor Ablauf (60 Min) erneuert. */
export const catalogImagesQueryOptions = queryOptions({
  queryKey: ["catalog-images"],
  queryFn: () => getCatalogImageUrls(),
  staleTime: 25 * 60 * 1000,
  refetchInterval: 30 * 60 * 1000,
  retry: 2,
});

/** Übersetzter Katalogname ohne persönliche Umbenennung. */
export function originalName(e: { names: Record<string, string>; baseName: string }) {
  return pickName(e.names, getLocale(), e.baseName);
}

/** Katalog mit Namen in der aktuell gewählten Sprache (persönliche Namen haben Vorrang). */
export function useCatalog(): Catalog {
  const locale = useLocale();
  const { data } = useSuspenseQuery(catalogQueryOptions(locale));
  const { data: images } = useQuery(catalogImagesQueryOptions);
  const custom = useCustomNames();
  const own = useCustomCatalog();
  const allMarkets = useAllMarkets();
  return useMemo(() => {
    const market = marketOf(locale);
    const img = (path: string | null | undefined) => (path ? (images?.[path] ?? null) : null);
    const ownDepts: CatalogDepartment[] = own.departments.map((d, i) => ({
      id: d.id, parentId: d.parentId, name: d.name, emoji: d.emoji, color: null, imageUrl: null,
      sortOrder: 10000 + i, baseName: d.name, names: {},
    }));
    const ownProducts: CatalogProduct[] = own.products.map((p, i) => ({
      id: p.id, departmentId: p.departmentId, name: p.name, emoji: p.emoji, imageUrl: null,
      defaultQuantity: p.defaultQuantity, defaultUnit: p.defaultUnit, organicAvailable: true, variants: [], variantNames: {}, excludedDiets: [], cuisineIds: [], brands: [],
      sortOrder: 10000 + i, baseName: p.name, names: {},
    }));
    return {
      departments: [...data.departments, ...ownDepts].map((d) => ({ ...d, imageUrl: img(d.imagePath), name: custom[d.id] ?? pickName(d.names, locale, d.baseName) })),
      products: [...data.products.filter((p) => allMarkets || inMarket(p, market)), ...ownProducts].map((p) => {
        const name = custom[p.id] ?? pickName(p.names, locale, p.baseName);
        const foreign = p.markets?.length && !p.markets.includes(market);
        return {
          ...p,
          imageUrl: img(p.imagePath),
          iconUrl: img(p.iconPath) ?? img(p.imagePath),
          sortOrder: p.marketOrder?.[market] ?? p.sortOrder,
          name: foreign ? `${name} ${p.markets!.map(flagOf).join("")}` : name,
        };
      }),
      headings: (data.headings ?? []).map((h) => ({ ...h, name: pickName(h.names, locale, h.baseName) })),
      cuisines: (data.cuisines ?? []).map((c) => ({ ...c, name: pickName(c.names, locale, c.baseName) })),
      recipeIngredients: data.recipeIngredients ?? [],
      departmentAliases: data.departmentAliases ?? [],
      productAliases: data.productAliases ?? [],
      recipeGroups: (data.recipeGroups ?? []).map((g) => ({ ...g, name: pickName(g.names, locale, g.baseName) })),
    };
  }, [data, images, locale, custom, own, allMarkets]);
}

export type { Catalog, CatalogCuisine, CatalogDepartment, CatalogHeading, CatalogProduct };

/** Überschrift, unter der ein Produkt steht (letzte Überschrift davor in der Katalogreihenfolge seiner Kategorie). */
export function headingByProduct(products: CatalogProduct[], headings: CatalogHeading[]): Map<string, CatalogHeading> {
  const out = new Map<string, CatalogHeading>();
  if (!headings.length) return out;
  const before = new Map(headings.map((h) => [h.beforeProductId, h]));
  const byDept = new Map<string, CatalogProduct[]>();
  for (const p of products) byDept.set(p.departmentId, [...(byDept.get(p.departmentId) ?? []), p]);
  for (const [, list] of byDept) {
    let current: CatalogHeading | undefined;
    for (const p of list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, getLocale()))) {
      current = before.get(p.id) ?? current;
      if (current) out.set(p.id, current);
    }
  }
  return out;
}

export function childrenOf(departments: CatalogDepartment[], parentId: string | null) {
  return departments
    .filter((d) => d.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, getLocale()));
}

export function productsOf(products: CatalogProduct[], departmentId: string) {
  return products
    .filter((p) => p.departmentId === departmentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, getLocale()));
}

/** Breadcrumb path from root to the given department. */
export function pathTo(departments: CatalogDepartment[], id: string | null): CatalogDepartment[] {
  const byId = new Map(departments.map((d) => [d.id, d]));
  const out: CatalogDepartment[] = [];
  let current = id ? byId.get(id) : undefined;
  while (current) {
    out.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return out;
}

/**
 * Artikelsuche: bis 4 Buchstaben nur Treffer am Wortanfang,
 * ab 5 Buchstaben auch Treffer mitten im Namen.
 */
export function matchesProductSearch(name: string, normalizedQuery: string): boolean {
  const normalized = name.toLocaleLowerCase(getLocale());
  return normalizedQuery.length > 4
    ? normalized.includes(normalizedQuery)
    : normalized.startsWith(normalizedQuery);
}

/** Alphabetische Sortierung der Suchtreffer (deutsche Regeln). */
export function compareByName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, getLocale());
}

/** Marken eines Produkts, die im Markt der gewählten Sprachvariante verbreitet sind. */
export function brandsFor(product: Pick<CatalogProduct, "brands">, locale: string = getLocale()): string[] {
  const market = locale.split("-")[1] ?? "";
  const all = product.brands ?? [];
  const own = all.filter((b) => !b.markets.length || b.markets.includes(market)).map((b) => b.name);
  // Fallback: keine Marken für den eigenen Markt hinterlegt → alle Marken zeigen statt gar keiner.
  return own.length ? own : all.map((b) => b.name);
}

/** Produkte einer Kategorie inkl. Alias-Produkten (an ihrer Alias-Position). */
export function productsIn(products: CatalogProduct[], aliases: { productId: string; departmentId: string; sortOrder: number }[], departmentId: string): CatalogProduct[] {
  const own = productsOf(products, departmentId);
  const byId = new Map(products.map((p) => [p.id, p]));
  const extra: CatalogProduct[] = [];
  for (const a of aliases) {
    if (a.departmentId !== departmentId) continue;
    const p = byId.get(a.productId);
    if (p && p.departmentId !== departmentId) extra.push({ ...p, sortOrder: a.sortOrder });
  }
  if (!extra.length) return own;
  return [...own, ...extra].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Alle Kategorien, in denen ein Produkt vorkommt (Original zuerst, dann Aliase). */
export function departmentIdsOf(product: Pick<CatalogProduct, "id" | "departmentId">, aliases: { productId: string; departmentId: string }[]): string[] {
  return [product.departmentId, ...aliases.filter((a) => a.productId === product.id && a.departmentId !== product.departmentId).map((a) => a.departmentId)];
}
