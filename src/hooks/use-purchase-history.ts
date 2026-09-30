// ============= Einkaufsverlauf: geräte-lokal gespeicherte abgeschlossene Einkäufe =============
import { useCallback, useEffect, useMemo, useState } from "react";

export interface PurchaseItem {
  name: string;
  productId?: string | undefined;
  emoji?: string | undefined;
  quantity?: string | undefined;
}

export interface PurchaseRecord {
  id: string;
  listName: string;
  at: number;
  items: PurchaseItem[];
}

export interface ProductFrequency {
  name: string;
  productId?: string | undefined;
  emoji?: string | undefined;
  count: number;
}

const KEY = "shoppi:purchase-history";
const MAX_RECORDS = 200;

function load(): PurchaseRecord[] {
  try {
    const saved = localStorage.getItem(KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as PurchaseRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function usePurchaseHistory() {
  const [history, setHistory] = useState<PurchaseRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHistory(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(history));
    } catch {
      /* ignore */
    }
  }, [history, hydrated]);

  const addPurchase = useCallback((listName: string, items: PurchaseItem[]) => {
    if (items.length === 0) return;
    setHistory((prev) =>
      [{ id: `p${Date.now()}`, listName, at: Date.now(), items }, ...prev].slice(0, MAX_RECORDS)
    );
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const stats = useMemo(() => {
    let itemCount = 0;
    const freq = new Map<string, ProductFrequency>();
    for (const rec of history) {
      itemCount += rec.items.length;
      for (const it of rec.items) {
        const key = it.productId ?? it.name.toLowerCase();
        const entry = freq.get(key) ?? { name: it.name, productId: it.productId, emoji: it.emoji, count: 0 };
        entry.count += 1;
        if (it.productId && !entry.productId) entry.productId = it.productId;
        if (it.emoji && !entry.emoji) entry.emoji = it.emoji;
        freq.set(key, entry);
      }
    }
    // Katalog-Einträge (productId) und manuell getippte gleiche Namen zusammenführen
    const byName = new Map<string, ProductFrequency>();
    for (const entry of freq.values()) {
      if (entry.productId) byName.set(entry.name.toLowerCase(), entry);
    }
    for (const [key, entry] of [...freq.entries()]) {
      if (entry.productId) continue;
      const match = byName.get(entry.name.toLowerCase());
      if (match && match !== entry) {
        match.count += entry.count;
        if (!match.emoji) match.emoji = entry.emoji;
        freq.delete(key);
      }
    }
    const top = [...freq.values()].sort((a, b) => b.count - a.count);
    return { purchases: history.length, itemCount, top };
  }, [history]);

  return { history, hydrated, addPurchase, clearHistory, stats };
}
