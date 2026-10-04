import { useCallback, useEffect, useState } from "react";

const KEY = "shoppi:list-group-order";
const STORE_KEY = "shoppi:active-store";
const CUSTOM_KEY = "shoppi:custom-stores";
const HIDDEN_KEY = "shoppi:hidden-groups";
const EVENT = "shoppi:list-group-order-changed";

export type CustomStore = { id: string; name: string };

function readAll(): Record<string, string[]> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (Array.isArray(v)) return { default: v.filter((x): x is string => typeof x === "string") };
    return v && typeof v === "object" ? (v as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}
function readStore(): string {
  try { return localStorage.getItem(STORE_KEY) || "default"; } catch { return "default"; }
}
function readCustom(): CustomStore[] {
  try {
    const v = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}
function readHidden(): Record<string, string[]> {
  try {
    const v = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}
function emit() { window.dispatchEvent(new Event(EVENT)); }

/** Persönliche (geräte-lokale) Reihenfolge der Abteilungen, pro Laden. */
export function useGroupOrder() {
  const [all, setAll] = useState<Record<string, string[]>>({});
  const [store, setStoreState] = useState("default");
  const [customStores, setCustom] = useState<CustomStore[]>([]);
  const [hiddenAll, setHiddenAll] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const sync = () => { setAll(readAll()); setStoreState(readStore()); setCustom(readCustom()); setHiddenAll(readHidden()); };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);

  /** Speichert Reihenfolge für einen Laden; nicht genannte Schlüssel behalten ihre Position dahinter. */
  const saveFor = useCallback((storeId: string, keys: string[]) => {
    const cur = readAll();
    const rest = (cur[storeId] ?? []).filter((k) => !keys.includes(k));
    cur[storeId] = [...keys, ...rest];
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch { /* ignore */ }
    emit();
  }, []);
  const save = useCallback((keys: string[]) => saveFor(readStore(), keys), [saveFor]);
  const resetFor = useCallback((storeId: string) => {
    const cur = readAll();
    delete cur[storeId];
    try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch { /* ignore */ }
    const hid = readHidden();
    delete hid[storeId];
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(hid)); } catch { /* ignore */ }
    emit();
  }, []);
  const hideFor = useCallback((storeId: string, key: string) => {
    const hid = readHidden();
    const list = hid[storeId] ?? [];
    if (!list.includes(key)) hid[storeId] = [...list, key];
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(hid)); } catch { /* ignore */ }
    emit();
  }, []);
  const unhideFor = useCallback((storeId: string, key: string) => {
    const hid = readHidden();
    hid[storeId] = (hid[storeId] ?? []).filter((k) => k !== key);
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify(hid)); } catch { /* ignore */ }
    emit();
  }, []);
  const setStore = useCallback((id: string) => {
    try { localStorage.setItem(STORE_KEY, id); } catch { /* ignore */ }
    emit();
  }, []);
  const addCustomStore = useCallback((name: string) => {
    const id = "custom:" + Date.now().toString(36);
    const next = [...readCustom(), { id, name }];
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    emit();
    return id;
  }, []);
  const removeCustomStore = useCallback((id: string) => {
    const next = readCustom().filter((s) => s.id !== id);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    resetFor(id);
    if (readStore() === id) setStore("default");
    emit();
  }, [resetFor, setStore]);

  const order = all[store] ?? all["default"] ?? [];
  const hidden = hiddenAll[store] ?? [];
  return { order, all, store, setStore, save, saveFor, resetFor, customStores, addCustomStore, removeCustomStore, hasCustomOrder: order.length > 0, hidden, hiddenAll, hideFor, unhideFor };
}

/** Entfernt Gruppen, die im aktiven Geschäft ausgeblendet sind. */
export function filterHidden<T extends { key: string }>(groups: T[], hidden: string[]): T[] {
  if (hidden.length === 0) return groups;
  const set = new Set(hidden);
  return groups.filter((g) => !set.has(g.key));
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
