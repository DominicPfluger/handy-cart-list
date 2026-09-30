// ============= Vorrat (Pantry): was zuhause da ist =============
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getPantry,
  setPantryItem,
  updatePantryItem,
  deletePantryItem,
} from "../lib/lists.functions";
import { useAuthUser } from "./use-auth-user";

const PANTRY_KEY = "shoppi:pantry";

export interface PantryItem {
  id: string;
  productId?: string | undefined;
  name: string;
  quantity: string;
  unit?: string | undefined;
  organic?: boolean | undefined;
  emoji?: string | null | undefined;
  imageUrl?: string | null | undefined;
  addedAt: number;
}

export interface AddPantryInput {
  productId?: string | undefined;
  name: string;
  quantity: string;
  unit?: string | undefined;
  organic?: boolean | undefined;
  emoji?: string | null | undefined;
  imageUrl?: string | null | undefined;
}

type CloudRow = any;

function rowToPantryItem(r: CloudRow): PantryItem {
  return {
    id: String(r.id),
    productId: r.product_id ?? undefined,
    name: r.name,
    quantity: r.quantity ?? "1",
    unit: r.unit ?? undefined,
    organic: !!r.organic,
    emoji: r.emoji ?? null,
    imageUrl: r.image_url ?? null,
    addedAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
  };
}

export function usePantry() {
  const user = useAuthUser();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // ---- Lokal ----
  useEffect(() => {
    if (user !== null) return; // nur im lokalen Modus laden
    try {
      const saved = localStorage.getItem(PANTRY_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [user === null]);

  useEffect(() => {
    if (user !== null || !hydrated) return;
    try {
      localStorage.setItem(PANTRY_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated, user === null]);

  // ---- Cloud ----
  const loadCloud = useCallback(async () => {
    try {
      const res = await getPantry();
      setItems((res.items as CloudRow[]).map(rowToPantryItem));
      setHydrated(true);
    } catch {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadCloud();
    const channel = supabase
      .channel("shoppi-pantry")
      .on("postgres_changes", { event: "*", schema: "public", table: "pantry_items" }, () => {
        loadCloud();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const add = useCallback(
    (input: AddPantryInput) => {
      if (!user) {
        // Lokal: gleiche productId → Menge aktualisieren
        setItems((prev) => {
          const existing = input.productId ? prev.find((i) => i.productId === input.productId) : undefined;
          if (existing) {
            return prev.map((i) => (i.id === existing.id ? { ...i, quantity: input.quantity } : i));
          }
          return [
            ...prev,
            {
              id: `p${Date.now()}${Math.round(Math.random() * 1000)}`,
              productId: input.productId,
              name: input.name,
              quantity: input.quantity,
              unit: input.unit,
              organic: input.organic,
              emoji: input.emoji ?? null,
              imageUrl: input.imageUrl ?? null,
              addedAt: Date.now(),
            },
          ];
        });
        return;
      }
      // Optimistisch
      const tmpId = `tmp-${Date.now()}`;
      setItems((prev) => {
        const existing = input.productId ? prev.find((i) => i.productId === input.productId) : undefined;
        if (existing) {
          return prev.map((i) => (i.id === existing.id ? { ...i, quantity: input.quantity } : i));
        }
        return [
          ...prev,
          {
            id: tmpId,
            productId: input.productId,
            name: input.name,
            quantity: input.quantity,
            unit: input.unit,
            organic: input.organic,
            emoji: input.emoji ?? null,
            imageUrl: input.imageUrl ?? null,
            addedAt: Date.now(),
          },
        ];
      });
      setPantryItem({
        data: {
          productId: input.productId ?? null,
          name: input.name,
          quantity: input.quantity,
          unit: input.unit ?? null,
          organic: input.organic,
          emoji: input.emoji ?? null,
          imageUrl: input.imageUrl ?? null,
        },
      })
        .then(() => loadCloud())
        .catch(() => loadCloud());
    },
    [user, loadCloud]
  );

  const updateQuantity = useCallback(
    (id: string, quantity: string) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
      if (user && !id.startsWith("tmp-")) {
        updatePantryItem({ data: { id, quantity } }).catch(() => loadCloud());
      }
    },
    [user, loadCloud]
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (user && !id.startsWith("tmp-")) {
        deletePantryItem({ data: { id } }).catch(() => loadCloud());
      }
    },
    [user, loadCloud]
  );

  const isInPantry = useCallback(
    (productId: string) => items.find((i) => i.productId === productId),
    [items]
  );

  return { items, hydrated, add, updateQuantity, remove, isInPantry };
}
