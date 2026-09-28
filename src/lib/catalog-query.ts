import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getLocale, pickName, useLocale } from "../i18n";
import { getCatalog, type Catalog, type CatalogDepartment, type CatalogProduct } from "./catalog.functions";
import { useCustomNames } from "../hooks/use-custom-names";

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
  return useMemo(
    () => ({
      departments: data.departments.map((d) => ({ ...d, name: custom[d.id] ?? pickName(d.names, locale, d.baseName) })),
      products: data.products.map((p) => ({ ...p, name: custom[p.id] ?? pickName(p.names, locale, p.baseName) })),
    }),
    [data, locale, custom],
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
