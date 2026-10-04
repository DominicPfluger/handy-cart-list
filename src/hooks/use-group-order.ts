import { useCallback, useEffect, useState } from "react";

const KEY = "shoppi:list-group-order";
const EVENT = "shoppi:list-group-order-changed";

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Persönliche (nur lokal gespeicherte) Reihenfolge der Abteilungs-Gruppen in der Listenansicht. */
export function useGroupOrder() {
  const [order, setOrder] = useState<string[]>([]);

  useEffect(() => {
    setOrder(read());
    const sync = () => setOrder(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /** Speichert die komplette Reihenfolge der sichtbaren Gruppenschlüssel. */
  const save = useCallback((keys: string[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(keys));
    } catch {
      /* Speicher voll — Reihenfolge nur im State behalten */
    }
    setOrder(keys);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { order, save, hasCustomOrder: order.length > 0 };
}

/** Sortiert Gruppen: zuerst in gespeicherter Reihenfolge, der Rest in Katalog-Reihenfolge dahinter. */
export function applyGroupOrder<T extends { key: string; order: number }>(groups: T[], order: string[]): T[] {
  if (order.length === 0) return groups;
  const pos = new Map(order.map((k, i) => [k, i]));
  return [...groups].sort((a, b) => {
    const ia = pos.get(a.key);
    const ib = pos.get(b.key);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    return a.order - b.order;
  });
}
