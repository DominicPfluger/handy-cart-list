import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getLocale, pickName, useLocale } from "../i18n";
import { getCatalogCore, getCatalogDetails, getCatalogImageUrls, type Catalog, type CatalogDepartment, type CatalogHeading, type CatalogProduct, type CatalogCuisine, type CatalogCore, type CatalogDetails } from "./catalog.functions";
import { useCustomNames } from "../hooks/use-custom-names";
import { useCustomCatalog } from "../hooks/use-custom-catalog";
import { usePersonalVariants } from "../hooks/use-personal-variants";
import { useAllMarkets } from "../hooks/use-all-markets";
import { useMarket } from "../hooks/use-market";

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

// ---- Geräte-Cache für den Basis-Katalog: App erscheint sofort, Auffrischung im Hintergrund ----

const coreCacheKey = (locale: string) => `shoppi:catalog-core-${locale}`;

function readCoreCache(locale: string): { t: number; data: CatalogCore } | null {
  try {
    const raw = localStorage.getItem(coreCacheKey(locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t: number; data: CatalogCore };
    if (!parsed?.data?.products?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCoreCache(locale: string, data: CatalogCore) {
  try {
    localStorage.setItem(coreCacheKey(locale), JSON.stringify({ t: Date.now(), data }));
  } catch {
    /* Speicher voll: Cache einfach weglassen */
  }
}

/** Basis-Katalog für eine Sprachvariante; mit Geräte-Cache als sofortiger Startwert. */
export const catalogQueryOptions = (locale: string) => {
  const cached = typeof localStorage !== "undefined" ? readCoreCache(locale) : null;
  return queryOptions({
    queryKey: ["catalog", "core", locale],
    queryFn: async () => {
      const fresh = await getCatalogCore({ data: { locale } });
      writeCoreCache(locale, fresh);
      return fresh;
    },
    // Gespeicherter Stand erscheint sofort und wird im Hintergrund aufgefrischt.
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.t ?? 0,
    // Neue Kategorien und Produkte sollen nach kurzer Zeit auch in bereits geöffneten Apps erscheinen.
    staleTime: 60 * 1000,
    // Loader uses ensureQueryData (fetchQuery = no retry by default). Retry so a
    // single interrupted request (reload/HMR during the large download) doesn't blank the page.
    retry: 3,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
  });
};

/** Details (Länderküchen, Marken, Synonyme, Varianten, Rezepte) – im Hintergrund nachgeladen. */
export const catalogDetailsQueryOptions = (locale: string) =>
  queryOptions({
    queryKey: ["catalog", "details", locale],
    queryFn: () => getCatalogDetails({ data: { locale } }),
    staleTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
  });

/** Signierte Bild-Adressen erneuern, bevor sie ablaufen; gespeicherte Dateien bleiben im Geräte-Cache. */
export const catalogImagesQueryOptions = queryOptions({
  queryKey: ["catalog-images"],
  queryFn: () => getCatalogImageUrls(),
  staleTime: 45 * 60 * 1000,
  refetchInterval: 45 * 60 * 1000,
  retry: 2,
});

/** Übersetzter Katalogname ohne persönliche Umbenennung. */
export function originalName(e: { names: Record<string, string>; baseName: string }) {
  return pickName(e.names, getLocale(), e.baseName);
}

/** Katalog mit Namen in der aktuell gewählten Sprache (persönliche Namen haben Vorrang). */
export function useCatalog(): Catalog {
  const locale = useLocale();
  const market = useMarket();
  const { data } = useSuspenseQuery(catalogQueryOptions(locale));
  const { data: images } = useQuery(catalogImagesQueryOptions);
  const custom = useCustomNames();
  const own = useCustomCatalog();
  const personalVariants = usePersonalVariants();
  const allMarkets = useAllMarkets();
  return useMemo(() => {
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
      departments: [...data.departments, ...ownDepts].map((d) => ({ ...d, imageUrl: img(d.imagePath), iconUrl: img(d.iconPath), name: custom[d.id] ?? pickName(d.names, locale, d.baseName) })),
      products: [...data.products.filter((p) => allMarkets || inMarket(p, market)), ...ownProducts].map((p) => {
        const name = custom[p.id] ?? pickName(p.names, locale, p.baseName);
        const foreign = p.markets?.length && !p.markets.includes(market);
        return {
          ...p,
          variants: [...p.variants, ...(personalVariants[p.id] ?? []).filter((v) => !p.variants.some((catalogVariant) => catalogVariant.toLocaleLowerCase() === v.toLocaleLowerCase()))],
          imageUrl: img(p.imagePath),
          iconUrl: img(p.iconPath),
          variantImages: p.variantImages
            ? Object.fromEntries(Object.entries(p.variantImages).map(([v, x]) => [v, { ...x, imageUrl: img(x.imagePath), iconUrl: img(x.iconPath) }]))
            : {},
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
      recipeTemplates: (data.recipeTemplates ?? []).map((r) => ({ ...r, name: pickName(r.names, locale, r.baseName) })),
      recipeSteps: (data.recipeSteps ?? []).map((r) => ({ ...r, name: pickName(r.names, locale, r.baseName) })),
      recipePopular: data.recipePopular ?? [],
    };
  }, [data, images, locale, market, custom, own, allMarkets, personalVariants]);
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
export function normalizeSearch(s: string): string {
  return s.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").trim();
}

/** Wortanfang ab 1 Zeichen, beliebiger Teil ab 3 Zeichen; Akzente und ß/ss egal. */
export function matchesProductSearch(name: string, query: string): boolean {
  const n = normalizeSearch(name);
  const q = normalizeSearch(query);
  if (!q) return false;
  if (q.length >= 3) return n.includes(q);
  return n.split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(q));
}

/** Alphabetische Sortierung der Suchtreffer (deutsche Regeln). */
export function compareByName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, getLocale());
}

/** Marken eines Produkts, die im ausgewählten Markt verbreitet sind. */
export function brandsFor(product: Pick<CatalogProduct, "brands">, market: string): string[] {
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
