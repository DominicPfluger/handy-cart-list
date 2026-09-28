import { useEffect, useState } from "react";

type Overrides = Record<string, number>;
const KEY = "shoppi:item-order";
const EVENT = "shoppi:item-order-changed";

function read(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

/** Persönliche Reihenfolge der Listeneinträge (pro Eintrags-ID, nur lokal). */
export function useItemOrder(): Overrides {
  const [o, setO] = useState<Overrides>({});
  useEffect(() => {
    setO(read());
    const sync = () => setO(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return o;
}

export function saveItemOrder(ids: string[]) {
  const next = { ...read() };
  ids.forEach((id, i) => (next[id] = (i + 1) * 10));
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}
