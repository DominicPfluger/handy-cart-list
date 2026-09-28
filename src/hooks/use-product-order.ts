import { useEffect, useState } from "react";

type Overrides = Record<string, number>;
const KEY = "shoppi:product-order";
const EVENT = "shoppi:product-order-changed";

function read(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

/** Persönliche (lokal gespeicherte) Reihenfolge der Produkte. */
export function useProductOrder(): Overrides {
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
  return overrides;
}

/** Speichert die Reihenfolge der übergebenen Produkt-IDs. */
export function saveProductOrder(ids: string[]) {
  const next = { ...read() };
  ids.forEach((id, i) => (next[id] = (i + 1) * 10));
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}
