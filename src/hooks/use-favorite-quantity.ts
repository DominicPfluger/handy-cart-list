import { useCallback, useState } from "react";

const KEY = "shoppi:product-quantities";

export interface FavoriteQuantity {
  quantity: number;
  unit: string;
}

function readAll(): Record<string, FavoriteQuantity> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, FavoriteQuantity>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getFavoriteQuantity(productId: string): FavoriteQuantity | undefined {
  return readAll()[productId];
}

export function useFavoriteQuantity(productId: string) {
  const [value, setValue] = useState<FavoriteQuantity | undefined>(() => getFavoriteQuantity(productId));

  const save = useCallback(
    (q: FavoriteQuantity) => {
      const all = readAll();
      all[productId] = q;
      try {
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch {
        /* storage voll */
      }
      setValue(q);
    },
    [productId],
  );

  const clear = useCallback(() => {
    const all = readAll();
    delete all[productId];
    try {
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch {
      /* storage voll */
    }
    setValue(undefined);
  }, [productId]);

  return { value, save, clear };
}
