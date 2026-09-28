import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getLocale, pickName, useLocale } from "../i18n";
import { getCatalog, type Catalog, type CatalogDepartment, type CatalogProduct } from "./catalog.functions";

export const catalogQueryOptions = queryOptions({
  queryKey: ["catalog"],
  queryFn: () => getCatalog(),
  staleTime: 30 * 1000,
  refetchInterval: 45 * 60 * 1000, // renew signed image URLs before they expire
});

/** Katalog mit Namen in der aktuell gewählten Sprache. */
export function useCatalog(): Catalog {
  const { data } = useSuspenseQuery(catalogQueryOptions);
  const locale = useLocale();
  return useMemo(
    () => ({
      departments: data.departments.map((d) => ({ ...d, name: pickName(d.names, locale, d.baseName) })),
      products: data.products.map((p) => ({ ...p, name: pickName(p.names, locale, p.baseName) })),
    }),
    [data, locale],
  );
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
