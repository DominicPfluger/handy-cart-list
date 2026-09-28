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
  unit?: string | undefined;
  organic?: boolean | undefined;
  emoji?: string | undefined;
  imageUrl?: string | null | undefined;
  groupLabel?: string | undefined;
  groupEmoji?: string | undefined;
  productId?: string | undefined;
  note?: string | undefined;
}

export interface FavoriteProduct {
  productId: string;
  name: string;
  emoji?: string | null | undefined;
  imageUrl?: string | null | undefined;
  defaultQuantity: number;
  defaultUnit: string;
  organicAvailable: boolean;
  groupLabel?: string | undefined;
  groupEmoji?: string | undefined;
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
  emoji?: string | null | undefined;
  imageUrl?: string | null | undefined;
  groupLabel?: string | undefined;
  groupEmoji?: string | undefined;
  note?: string | undefined;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ListItem[];
  createdAt: number;
}

const LISTS_KEY = "shoppi:lists";
const ACTIVE_KEY = "shoppi:active-list";

const DEFAULT_LISTS: ShoppingList[] = [
  { id: "l-default", name: "Unsere Einkaufsliste", items: SEED_ITEMS, createdAt: 0 },
];

export function useShoppingList() {
  const [lists, setLists] = useState<ShoppingList[]>(DEFAULT_LISTS);
  const [activeListId, setActiveListId] = useState<string>("l-default");
  const [activity, setActivity] = useState<ActivityEntry[]>(SEED_ACTIVITY);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    try {
      const savedLists = localStorage.getItem(LISTS_KEY);
      const savedActive = localStorage.getItem(ACTIVE_KEY);
      const savedList = localStorage.getItem(LIST_KEY);
      const savedAct = localStorage.getItem(ACT_KEY);
      const savedFav = localStorage.getItem(FAV_KEY);
      if (savedLists) {
        const parsed = JSON.parse(savedLists) as ShoppingList[];
        if (parsed.length) setLists(parsed);
      } else if (savedList) {
        setLists([{ ...DEFAULT_LISTS[0]!, items: JSON.parse(savedList) }]);
      }
      if (savedActive) setActiveListId(savedActive);
      if (savedAct) setActivity(JSON.parse(savedAct));
      if (savedFav) setFavorites(JSON.parse(savedFav));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0]!;
  const items = activeList.items;

  const setItems = useCallback(
    (fn: (prev: ListItem[]) => ListItem[]) => {
      setLists((prev) => {
        const target = prev.find((l) => l.id === activeListId) ?? prev[0];
        if (!target) return prev;
        return prev.map((l) => (l.id === target.id ? { ...l, items: fn(l.items) } : l));
      });
    },
    [activeListId]
  );

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
      localStorage.setItem(ACTIVE_KEY, activeListId);
    } catch {
      /* ignore */
    }
  }, [lists, activeListId, hydrated]);

  const createList = useCallback((name: string) => {
    const list: ShoppingList = {
      id: `l${Date.now()}`,
      name: name.trim() || "Neue Liste",
      items: [],
      createdAt: Date.now(),
    };
    setLists((prev) => [...prev, list]);
    setActiveListId(list.id);
    return list.id;
  }, []);

  const renameList = useCallback((id: string, name: string) => {
    const n = name.trim();
    if (!n) return;
    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: n } : l)));
  }, []);

  const deleteList = useCallback((id: string) => {
    setLists((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((l) => l.id !== id);
      setActiveListId((cur) => (cur === id ? next[0]!.id : cur));
      return next;
    });
  }, []);

  const reorderLists = useCallback((fromId: string, toId: string) => {
    setLists((prev) => {
      const from = prev.findIndex((l) => l.id === fromId);
      const to = prev.findIndex((l) => l.id === toId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
  }, []);

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
    [logActivity, setItems]
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
        note: input.note?.trim() ? input.note.trim() : undefined,
      };
      setItems((prev) => [...prev, item]);
      logActivity(user, "hat hinzugefügt", input.organic ? `${input.name} (Bio)` : input.name);
    },
    [logActivity, setItems]
  );

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        logActivity(it.addedBy, it.checked ? "hat wieder hinzugefügt" : "hat abgehakt", it.name);
        return { ...it, checked: !it.checked };
      })
    );
  }, [logActivity, setItems]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, [setItems]);

  const clearChecked = useCallback(() => {
    setItems((prev) => prev.filter((it) => !it.checked));
  }, [setItems]);

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
    lists,
    activeList,
    setActiveListId,
    createList,
    renameList,
    deleteList,
    reorderLists,
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
