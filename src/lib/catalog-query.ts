import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getLocale, pickName, useLocale } from "../i18n";
import { getCatalog, type Catalog, type CatalogDepartment, type CatalogProduct } from "./catalog.functions";
import { useCustomNames } from "../hooks/use-custom-names";
import { useCustomCatalog } from "../hooks/use-custom-catalog";

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 30 * 1000,
  refetchInterval: 45 * 60 * 1000, // renew signed image URLs before they expire
});

/** Übersetzter Katalogname ohne persönliche Umbenennung. */
export function originalName(e: { names: Record<string, string>; baseName: string }) {
  return pickName(e.names, getLocale(), e.baseName);
}

/** Katalog mit Namen in der aktuell gewählten Sprache (persönliche Namen haben Vorrang). */
export function useCatalog(): Catalog {
  const { data } = useSuspenseQuery(catalogQueryOptions);
  const locale = useLocale();
  const custom = useCustomNames();
  const own = useCustomCatalog();
  const order = useProductOrder();
  return useMemo(() => {
    const ownDepts: CatalogDepartment[] = own.departments.map((d, i) => ({
      id: d.id, parentId: d.parentId, name: d.name, emoji: d.emoji, color: null, imageUrl: null,
      sortOrder: 10000 + i, baseName: d.name, names: {},
    }));
    const ownProducts: CatalogProduct[] = own.products.map((p, i) => ({
      id: p.id, departmentId: p.departmentId, name: p.name, emoji: p.emoji, imageUrl: null,
      defaultQuantity: p.defaultQuantity, defaultUnit: p.defaultUnit, organicAvailable: true, variants: [],
      sortOrder: 10000 + i, baseName: p.name, names: {},
    }));
    return {
      departments: [...data.departments, ...ownDepts].map((d) => ({ ...d, name: custom[d.id] ?? pickName(d.names, locale, d.baseName) })),
      products: [...data.products, ...ownProducts].map((p) => ({
        ...p,
        name: custom[p.id] ?? pickName(p.names, locale, p.baseName),
        sortOrder: order[p.id] ?? p.sortOrder,
      })),
    };
  }, [data, locale, custom, own, order]);
}

export type { Catalog, CatalogDepartment, CatalogProduct };

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
