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


const FAV_KEY = "shoppi:favorite-order";
const FAV_EVENT = "shoppi:favorite-order-changed";
function readFav(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

/** Persönliche Reihenfolge der Favoriten (pro Produkt-ID, nur lokal). */
export function useFavoriteOrder(): Overrides {
  const [o, setO] = useState<Overrides>({});
  useEffect(() => {
    setO(readFav());
    const sync = () => setO(readFav());
    window.addEventListener(FAV_EVENT, sync);
    return () => window.removeEventListener(FAV_EVENT, sync);
  }, []);
  return o;
}

export function saveFavoriteOrder(ids: string[]) {
  const next = { ...readFav() };
  ids.forEach((id, i) => (next[id] = (i + 1) * 10));
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(FAV_EVENT));
}
