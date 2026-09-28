import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogDepartment } from "../lib/catalog-query";

type Override = { parentId: string | null; sortOrder: number };
type Overrides = Record<string, Override>;

const KEY = "shoppi:department-order";
const EVENT = "shoppi:department-order-changed";

function read(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

/** Persönliche (nur lokal gespeicherte) Anordnung der Kategorien. */
export function useDepartmentOrder(source: CatalogDepartment[]) {
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

  const departments = useMemo(() => {
    const ids = new Set(source.map((d) => d.id));
    return source.map((d) => {
      const o = overrides[d.id];
      if (!o || (o.parentId !== null && !ids.has(o.parentId))) return d;
      return { ...d, parentId: o.parentId, sortOrder: o.sortOrder };
    });
  }, [source, overrides]);

  const isDescendant = useCallback(
    (candidateId: string | null, ancestorId: string) => {
      const byId = new Map(departments.map((d) => [d.id, d]));
      let cur = candidateId ? byId.get(candidateId) : undefined;
      while (cur) {
        if (cur.id === ancestorId) return true;
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      return false;
    },
    [departments],
  );

  /** Verschiebt `id` nach `parentId`, an Position `index` (Ende wenn undefined). */
  const move = useCallback(
    (id: string, parentId: string | null, index?: number) => {
      if (parentId !== null && isDescendant(parentId, id)) return false;
      const siblings = departments
        .filter((d) => d.parentId === parentId && d.id !== id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "de"))
        .map((d) => d.id);
      const at = index === undefined ? siblings.length : Math.max(0, Math.min(index, siblings.length));
      siblings.splice(at, 0, id);
      const next = { ...read() };
      siblings.forEach((sid, i) => {
        next[sid] = { parentId, sortOrder: (i + 1) * 10 };
      });
      localStorage.setItem(KEY, JSON.stringify(next));
      setOverrides(next);
      window.dispatchEvent(new Event(EVENT));
      return true;
    },
    [departments, isDescendant],
  );

  const reset = useCallback(() => {
    localStorage.removeItem(KEY);
    setOverrides({});
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { departments, move, reset, hasCustomOrder: Object.keys(overrides).length > 0 };
}
