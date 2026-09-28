import { useSyncExternalStore } from "react";

/** Persönliche, selbst angelegte Kategorien und Produkte (nur auf diesem Gerät). */
export type CustomDepartment = { id: string; parentId: string | null; name: string; emoji: string | null };
export type CustomProduct = { id: string; departmentId: string; name: string; emoji: string | null; defaultQuantity: number; defaultUnit: string };
export type CustomCatalog = { departments: CustomDepartment[]; products: CustomProduct[] };

const KEY = "shoppi:custom-catalog";
const EMPTY: CustomCatalog = { departments: [], products: [] };
let cache: CustomCatalog | null = null;
const listeners = new Set<() => void>();

function read(): CustomCatalog {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null");
    cache = { departments: parsed?.departments ?? [], products: parsed?.products ?? [] };
  } catch {
    cache = { ...EMPTY };
  }
  return cache!;
}

function write(next: CustomCatalog) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

const newId = () => `custom-${crypto.randomUUID()}`;

export function addCustomDepartment(d: Omit<CustomDepartment, "id">) {
  const c = read();
  write({ ...c, departments: [...c.departments, { ...d, id: newId() }] });
}

export function addCustomProduct(p: Omit<CustomProduct, "id">) {
  const c = read();
  write({ ...c, products: [...c.products, { ...p, id: newId() }] });
}

export function deleteCustomEntry(id: string) {
  const c = read();
  // Unterkategorien und Produkte einer gelöschten Kategorie mit entfernen
  const gone = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of c.departments) if (d.parentId && gone.has(d.parentId) && !gone.has(d.id)) { gone.add(d.id); grew = true; }
  }
  write({
    departments: c.departments.filter((d) => !gone.has(d.id)),
    products: c.products.filter((p) => !gone.has(p.id) && !gone.has(p.departmentId)),
  });
}

export const isCustomId = (id: string) => id.startsWith("custom-");

export function useCustomCatalog(): CustomCatalog {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
}
