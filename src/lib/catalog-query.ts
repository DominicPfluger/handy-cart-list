import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getLocale, pickName, useLocale } from "../i18n";
import { getCatalogCore, getCatalogDetails, getCatalogImageUrls, type Catalog, type CatalogDepartment, type CatalogHeading, type CatalogProduct, type CatalogCuisine, type CatalogCore, type CatalogDetails } from "./catalog.functions";
import { useCustomNames } from "../hooks/use-custom-names";
import { useCustomCatalog } from "../hooks/use-custom-catalog";
import { usePersonalVariants } from "../hooks/use-personal-variants";
import { useAllMarkets } from "../hooks/use-all-markets";
import { useMarket } from "../hooks/use-market";
import { catalogCacheReady, idbGet, idbKeys, idbSet } from "./catalog-idb";
import type { QueryClient } from "@tanstack/react-query";
import { useGroupOrder } from "../hooks/use-group-order";
import { supabase } from "@/integrations/supabase/client";

type StoreOverrides = {
  d: Record<string, { name: string | null; sort_order: number | null; hidden: boolean }>;
  p: Record<string, { name: string | null; emoji: string | null; default_quantity: number | null; default_unit: string | null; sort_order: number | null; hidden: boolean }>;
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Laden-spezifische Katalog-Abweichungen (offline im Geräte-Cache). */
function useStoreOverrides(store: string): StoreOverrides | undefined {
  const enabled = UUID_RE.test(store);
  const key = `shoppi:store-ov-${store}`;
  const cached = enabled && typeof window !== "undefined" ? idbGet<{ t: number; data: StoreOverrides }>(key) : null;
  const { data } = useQuery({
    queryKey: ["store-overrides", store],
    enabled,
    queryFn: async () => {
      try {
        const [d, p] = await Promise.all([
          supabase.from("store_department_overrides").select("department_id, name, sort_order, hidden").eq("supermarket_id", store),
          supabase.from("store_product_overrides").select("product_id, name, emoji, default_quantity, default_unit, sort_order, hidden").eq("supermarket_id", store),
        ]);
        if (d.error || p.error) throw new Error((d.error ?? p.error)!.message);
        const out: StoreOverrides = {
          d: Object.fromEntries((d.data ?? []).map(({ department_id, ...r }) => [department_id, r])),
          p: Object.fromEntries((p.data ?? []).map(({ product_id, ...r }) => [product_id, r])),
        };
        idbSet(key, { t: Date.now(), data: out });
        return out;
      } catch (e) {
        const c = idbGet<{ t: number; data: StoreOverrides }>(key);
        if (c) return c.data;
        throw e;
      }
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.t ?? 0,
    staleTime: 5 * 60 * 1000,
  });
  return enabled ? data : undefined;
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
  const parsed = idbGet<{ t: number; data: CatalogCore }>(coreCacheKey(locale));
  const products = parsed?.data?.products;
  // Caches von vor Einführung der Produkt-Icons verwerfen (ohne iconPath-Feld),
  // sonst bleiben in dieser Sprache alle Icons unsichtbar, bis der Abruf klappt.
  if (!products?.length || !("iconPath" in (products[0] as object))) return null;
  return parsed ?? null;
}

function writeCoreCache(locale: string, data: CatalogCore) {
  idbSet(coreCacheKey(locale), { t: Date.now(), data });
}

/** Loader-Helfer: wartet auf den Offline-Katalog aus IndexedDB, damit er sofort erscheint. */
export async function ensureCatalog(queryClient: QueryClient, locale: string) {
  await catalogCacheReady;
  return queryClient.ensureQueryData(catalogQueryOptions(locale));
}

/** Basis-Katalog für eine Sprachvariante; mit Geräte-Cache als sofortiger Startwert. */
export const catalogQueryOptions = (locale: string) => {
  const cached = typeof window !== "undefined" ? readCoreCache(locale) : null;
  return queryOptions({
    queryKey: ["catalog", "core", locale],
    queryFn: async () => {
      try {
        const fresh = await getCatalogCore({ data: { locale } });
        writeCoreCache(locale, fresh);
        return fresh;
      } catch (e) {
        // Offline: letzten gespeicherten Katalog zeigen, statt auf den Ladebildschirm zu hängen
        const cached = readCoreCache(locale);
        if (cached) return cached.data;
        // Notfalls Katalog einer anderen Sprache — Namen enthalten alle Übersetzungen
        try {
          for (const k of idbKeys()) {
            if (k.startsWith("shoppi:catalog-core-")) {
              const other = readCoreCache(k.slice("shoppi:catalog-core-".length));
              if (other) return other.data;
            }
          }
        } catch { /* ignore */ }
        // Letzter Ausweg: leerer Katalog, damit gespeicherte Listen trotzdem erscheinen
        const empty: CatalogCore = { departments: [], products: [], headings: [], departmentAliases: [], productAliases: [] };
        if (typeof navigator !== "undefined" && !navigator.onLine) return empty;
        throw e;
      }
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

const detailsCacheKey = (locale: string) => `shoppi:catalog-details-${locale}`;
function readDetailsCache(locale: string): { t: number; data: CatalogDetails } | null {
  const parsed = idbGet<{ t: number; data: CatalogDetails }>(detailsCacheKey(locale));
  if (!parsed) return null;
  // Alte Caches ohne Varianten-Icon-Feld verwerfen.
  const firstVariant = Object.values(parsed.data?.variantImages ?? {})[0];
  if (firstVariant) {
    const entry = Object.values(firstVariant)[0];
    if (entry && !("iconPath" in (entry as object))) return null;
  }
  return parsed;
}

/** Details (Länderküchen, Marken, Synonyme, Varianten, Rezepte) – im Hintergrund nachgeladen, offline aus dem Geräte-Cache. */
export const catalogDetailsQueryOptions = (locale: string) => {
  const cached = typeof window !== "undefined" ? readDetailsCache(locale) : null;
  return queryOptions({
    queryKey: ["catalog", "details", locale],
    queryFn: async () => {
      try {
        const fresh = await getCatalogDetails({ data: { locale } });
        idbSet(detailsCacheKey(locale), { t: Date.now(), data: fresh });
        return fresh;
      } catch (e) {
        const c = readDetailsCache(locale);
        if (c) return c.data;
        throw e;
      }
    },
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.t ?? 0,
    staleTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000),
  });
};

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
  const { data: details } = useQuery(catalogDetailsQueryOptions(locale));
  const { data: images } = useQuery(catalogImagesQueryOptions);
  const custom = useCustomNames();
  const own = useCustomCatalog();
  const personalVariants = usePersonalVariants();
  const allMarkets = useAllMarkets();
  const { store } = useGroupOrder();
  const so = useStoreOverrides(store);
  return useMemo(() => {
    const raw: CatalogCore = data ?? { departments: [], products: [], headings: [], departmentAliases: [], productAliases: [] };
    let core = raw;
    if (so) {
      const hiddenD = new Set(Object.entries(so.d).filter(([, o]) => o.hidden).map(([id]) => id));
      // Unterkategorien ausgeblendeter Kategorien ebenfalls ausblenden
      let grew = hiddenD.size > 0;
      while (grew) { grew = false; for (const d of raw.departments) if (d.parentId && hiddenD.has(d.parentId) && !hiddenD.has(d.id)) { hiddenD.add(d.id); grew = true; } }
      core = {
        ...raw,
        departments: raw.departments.filter((d) => !hiddenD.has(d.id)).map((d) => {
          const o = so.d[d.id];
          if (!o) return d;
          return { ...d, sortOrder: o.sort_order ?? d.sortOrder, ...(o.name ? { baseName: o.name, names: {} } : {}) };
        }),
        products: raw.products.filter((p) => !hiddenD.has(p.departmentId) && !so.p[p.id]?.hidden).map((p) => {
          const o = so.p[p.id];
          if (!o) return p;
          return {
            ...p,
            ...(o.name ? { baseName: o.name, names: {} } : {}),
            ...(o.emoji ? { emoji: o.emoji } : {}),
            ...(o.default_quantity != null ? { defaultQuantity: o.default_quantity } : {}),
            ...(o.default_unit ? { defaultUnit: o.default_unit } : {}),
            ...(o.sort_order != null ? { sortOrder: o.sort_order, marketOrder: {} } : {}),
          };
        }),
      };
    }
    const img = (path: string | null | undefined) => (path ? (images?.[path] ?? null) : null);
    const d: CatalogDetails | undefined = details;
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
      departments: [...core.departments, ...ownDepts].map((d) => ({ ...d, imageUrl: img(d.imagePath), iconUrl: img(d.iconPath), name: custom[d.id] ?? pickName(d.names, locale, d.baseName) })),
      products: [...core.products.filter((p) => allMarkets || inMarket(p, market)), ...ownProducts].map((p) => {
        const name = custom[p.id] ?? pickName(p.names, locale, p.baseName);
        const foreign = p.markets?.length && !p.markets.includes(market);
        return {
          ...p,
          synonyms: d?.synonyms[p.id] ?? [],
          variantSynonyms: d?.variantSynonyms?.[p.id] ?? {},
          variantNames: d?.variantNames[p.id] ?? {},
          cuisineIds: d?.cuisineIds[p.id] ?? [],
          brands: d?.brands[p.id] ?? [],
          variants: [...p.variants, ...(personalVariants[p.id] ?? []).filter((v) => !p.variants.some((catalogVariant) => catalogVariant.toLocaleLowerCase() === v.toLocaleLowerCase()))],
          imageUrl: img(p.imagePath),
          iconUrl: img(p.iconPath),
          variantImages: Object.fromEntries(Object.entries(d?.variantImages[p.id] ?? {}).map(([v, x]) => [v, { ...x, imageUrl: img(x.imagePath), iconUrl: img(x.iconPath) }])),
          sortOrder: p.marketOrder?.[market] ?? p.sortOrder,
          name: foreign ? `${name} ${p.markets!.map(flagOf).join("")}` : name,
        };
      }),
      headings: (core.headings ?? []).map((h) => ({ ...h, name: pickName(h.names, locale, h.baseName) })),
      cuisines: (d?.cuisines ?? []).map((c) => ({ ...c, name: pickName(c.names, locale, c.baseName) })),
      recipeIngredients: d?.recipeIngredients ?? [],
      departmentAliases: core.departmentAliases ?? [],
      productAliases: core.productAliases ?? [],
      recipeGroups: (d?.recipeGroups ?? []).map((g) => ({ ...g, name: pickName(g.names, locale, g.baseName) })),
      recipeTemplates: (d?.recipeTemplates ?? []).map((r) => ({ ...r, name: pickName(r.names, locale, r.baseName) })),
      recipeSteps: (d?.recipeSteps ?? []).map((r) => ({ ...r, name: pickName(r.names, locale, r.baseName) })),
      recipePopular: d?.recipePopular ?? [],
    };
  }, [data, details, images, locale, market, custom, own, allMarkets, personalVariants, so]);
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
export function matchesProductSearch(name: string, query: string, fuzzy = true): boolean {
  const n = normalizeSearch(name);
  const q = normalizeSearch(query);
  if (!q) return false;
  if (q.length >= 3 && n.includes(q)) return true;
  const words = n.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (q.length < 3) return words.some((w) => w.startsWith(q));
  if (!fuzzy || q.length < 4) return false;
  // Fehlertoleranz: 1 Tippfehler ab 4, 2 erst ab 9 Zeichen; erster Buchstabe muss stimmen.
  const max = q.length >= 9 ? 2 : 1;
  for (const w of words) {
    if (w[0] !== q[0]) continue;
    if (Math.abs(w.length - q.length) <= max && editDistance(w, q, max) <= max) return true;
    if (w.length > q.length && editDistance(w.slice(0, q.length), q, max) <= max) return true;
  }
  // Auch zusammengesetzte Wörter: beliebige Teilstücke gleicher Länge prüfen.
  if (q.length >= 6) {
    for (let i = 1; i + q.length - 1 <= n.length; i++) {
      if (editDistance(n.slice(i, i + q.length), q, 1) <= 1) return true;
    }
  }
  return false;
}

/** Damerau-Levenshtein (mit Vertauschung), bricht ab, sobald > max. */
function editDistance(a: string, b: string, max: number): number {
  const m = a.length, k = b.length;
  if (Math.abs(m - k) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: k + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= k; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2]! + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[k]!;
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
