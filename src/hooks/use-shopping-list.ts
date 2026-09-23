import { useState, useEffect, useCallback } from "react";

export type CategoryId =
  | "obst-gemuese"
  | "milchprodukte"
  | "backwaren"
  | "fleisch-fisch"
  | "getraenke"
  | "tierbedarf"
  | "sonstiges";

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  /** soft background for cards */
  bg: string;
}

export const CATEGORIES: Category[] = [
  { id: "obst-gemuese", label: "Obst & Gemüse", emoji: "🍎", bg: "oklch(0.92 0.06 144)" },
  { id: "milchprodukte", label: "Milchprodukte", emoji: "🥛", bg: "oklch(0.95 0.04 250)" },
  { id: "backwaren", label: "Backwaren", emoji: "🥐", bg: "oklch(0.94 0.05 75)" },
  { id: "fleisch-fisch", label: "Fleisch & Fisch", emoji: "🍖", bg: "oklch(0.93 0.04 20)" },
  { id: "getraenke", label: "Getränke", emoji: "🥤", bg: "oklch(0.94 0.05 230)" },
  { id: "tierbedarf", label: "Tierbedarf", emoji: "🐾", bg: "oklch(0.94 0.04 300)" },
  { id: "sonstiges", label: "Sonstiges", emoji: "📦", bg: "oklch(0.94 0.01 90)" },
];

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

export interface ListItem {
  id: string;
  name: string;
  quantity: string;
  category: CategoryId;
  checked: boolean;
  addedBy: string;
  addedAt: number;
  /** catalog extras */
  unit?: string;
  organic?: boolean;
  emoji?: string;
  imageUrl?: string | null;
  groupLabel?: string;
  groupEmoji?: string;
  productId?: string;
}

export interface FavoriteProduct {
  productId: string;
  name: string;
  emoji?: string | null;
  imageUrl?: string | null;
  defaultQuantity: number;
  defaultUnit: string;
  organicAvailable: boolean;
  groupLabel?: string;
  groupEmoji?: string;
  addedAt: number;
}

export interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  item: string;
  at: number;
}

const MEMBERS = ["Du", "Jonas", "Mia", "Papa"];

const SEED_ITEMS: ListItem[] = [
  { id: "s1", name: "Tomaten", quantity: "6 Stück", category: "obst-gemuese", checked: false, addedBy: "Mia", addedAt: Date.now() - 1000 * 60 * 5 },
  { id: "s2", name: "Bananen", quantity: "1 Bund", category: "obst-gemuese", checked: true, addedBy: "Jonas", addedAt: Date.now() - 1000 * 60 * 60 },
  { id: "s3", name: "Vollmilch", quantity: "1 L", category: "milchprodukte", checked: false, addedBy: "Papa", addedAt: Date.now() - 1000 * 60 * 30 },
  { id: "s4", name: "Joghurt natur", quantity: "4 Stück", category: "milchprodukte", checked: false, addedBy: "Du", addedAt: Date.now() - 1000 * 60 * 10 },
  { id: "s5", name: "Croissants", quantity: "4 Stück", category: "backwaren", checked: false, addedBy: "Mia", addedAt: Date.now() - 1000 * 60 * 90 },
  { id: "s6", name: "Mineralwasser", quantity: "6 x 1,5 L", category: "getraenke", checked: true, addedBy: "Papa", addedAt: Date.now() - 1000 * 60 * 120 },
];

const SEED_ACTIVITY: ActivityEntry[] = [
  { id: "a1", user: "Mia", action: "hat hinzugefügt", item: "Tomaten", at: Date.now() - 1000 * 60 * 5 },
  { id: "a2", user: "Du", action: "hat hinzugefügt", item: "Joghurt natur", at: Date.now() - 1000 * 60 * 10 },
  { id: "a3", user: "Papa", action: "hat hinzugefügt", item: "Vollmilch", at: Date.now() - 1000 * 60 * 30 },
  { id: "a4", user: "Jonas", action: "hat abgehakt", item: "Bananen", at: Date.now() - 1000 * 60 * 60 },
];

const LIST_KEY = "shoppi:list";
const ACT_KEY = "shoppi:activity";
const FAV_KEY = "shoppi:favorites";

export interface AddCatalogItemInput {
  productId: string;
  name: string;
  quantity: string;
  unit: string;
  organic: boolean;
  emoji?: string | null;
  imageUrl?: string | null;
  groupLabel?: string;
  groupEmoji?: string;
}

export function useShoppingList() {
  const [items, setItems] = useState<ListItem[]>(SEED_ITEMS);
  const [activity, setActivity] = useState<ActivityEntry[]>(SEED_ACTIVITY);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    try {
      const savedList = localStorage.getItem(LIST_KEY);
      const savedAct = localStorage.getItem(ACT_KEY);
      const savedFav = localStorage.getItem(FAV_KEY);
      if (savedList) setItems(JSON.parse(savedList));
      if (savedAct) setActivity(JSON.parse(savedAct));
      if (savedFav) setFavorites(JSON.parse(savedFav));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LIST_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(ACT_KEY, JSON.stringify(activity));
    } catch {
      /* ignore */
    }
  }, [activity, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites, hydrated]);

  const logActivity = useCallback((user: string, action: string, item: string) => {
    setActivity((prev) => [
      { id: `a${Date.now()}`, user, action, item, at: Date.now() },
      ...prev,
    ].slice(0, 50));
  }, []);

  const addItem = useCallback(
    (name: string, quantity: string, category: CategoryId, user = "Du") => {
      const item: ListItem = {
        id: `i${Date.now()}`,
        name: name.trim(),
        quantity: quantity.trim(),
        category,
        checked: false,
        addedBy: user,
        addedAt: Date.now(),
      };
      setItems((prev) => [...prev, item]);
      logActivity(user, "hat hinzugefügt", item.name);
    },
    [logActivity]
  );

  const addCatalogItem = useCallback(
    (input: AddCatalogItemInput, user = "Du") => {
      const item: ListItem = {
        id: `i${Date.now()}${Math.round(Math.random() * 1000)}`,
        name: input.name,
        quantity: input.quantity,
        category: "sonstiges",
        checked: false,
        addedBy: user,
        addedAt: Date.now(),
        unit: input.unit,
        organic: input.organic,
        emoji: input.emoji ?? undefined,
        imageUrl: input.imageUrl ?? null,
        groupLabel: input.groupLabel ?? "Sonstiges",
        groupEmoji: input.groupEmoji ?? "📦",
        productId: input.productId,
      };
      setItems((prev) => [...prev, item]);
      logActivity(user, "hat hinzugefügt", input.organic ? `${input.name} (Bio)` : input.name);
    },
    [logActivity]
  );

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        logActivity(it.addedBy, it.checked ? "hat wieder hinzugefügt" : "hat abgehakt", it.name);
        return { ...it, checked: !it.checked };
      })
    );
  }, [logActivity]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearChecked = useCallback(() => {
    setItems((prev) => prev.filter((it) => !it.checked));
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favorites.some((f) => f.productId === productId),
    [favorites]
  );

  const toggleFavorite = useCallback((fav: Omit<FavoriteProduct, "addedAt">) => {
    setFavorites((prev) =>
      prev.some((f) => f.productId === fav.productId)
        ? prev.filter((f) => f.productId !== fav.productId)
        : [...prev, { ...fav, addedAt: Date.now() }]
    );
  }, []);

  return {
    items,
    activity,
    favorites,
    members: MEMBERS,
    hydrated,
    addItem,
    addCatalogItem,
    toggleItem,
    removeItem,
    clearChecked,
    isFavorite,
    toggleFavorite,
  };
}
