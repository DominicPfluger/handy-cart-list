import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogProduct } from "../lib/catalog-query";

type Override = { departmentId: string; sortOrder: number };
type Overrides = Record<string, Override>;

const KEY = "shoppi:product-order";
const EVENT = "shoppi:product-order-changed";

function read(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

/** Persönliche (nur lokal gespeicherte) Anordnung der Artikel. */
export function useProductOrder(source: CatalogProduct[]) {
  const [overrides, setOverrides] = useState<Overrides>({});

  useEffect(() => {
    setOverrides(read());
    const sync = () => setOverrides(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const products = useMemo(() => {
    const ids = new Set(source.map((p) => p.id));
    return source.map((p) => {
      const o = overrides[p.id];
      if (!o || !ids.has(p.id)) return p;
      return { ...p, departmentId: o.departmentId, sortOrder: o.sortOrder };
    });
  }, [source, overrides]);

  /** Verschiebt `id` in die Kategorie `departmentId`, an Position `index` (Ende wenn undefined). */
  const move = useCallback(
    (id: string, departmentId: string, index?: number) => {
      const siblings = products
        .filter((p) => p.departmentId === departmentId && p.id !== id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((p) => p.id);
      const at = index === undefined ? siblings.length : Math.max(0, Math.min(index, siblings.length));
      siblings.splice(at, 0, id);
      const next = { ...read() };
      siblings.forEach((sid, i) => {
        next[sid] = { departmentId, sortOrder: (i + 1) * 10 };
      });
      localStorage.setItem(KEY, JSON.stringify(next));
      setOverrides(next);
      window.dispatchEvent(new Event(EVENT));
      return true;
    },
    [products],
  );

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setOverrides({});
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { products, move, reset, hasCustomOrder: Object.keys(overrides).length > 0 };
}
