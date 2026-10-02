// ============= Einkaufslisten: lokal ohne Anmeldung, in der Cloud mit Live-Sync =============
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { translate, getLocale } from "../i18n";
import {
  getMyLists,
  createCloudList,
  updateCloudList,
  deleteCloudList,
  addCloudItems,
  updateCloudItem,
  deleteCloudItem,
  clearCloudChecked,
  joinCloudByCode,
  migrateCloudLists,
} from "../lib/lists.functions";
import { useAuthUser, type AuthUser } from "./use-auth-user";
import type { MessageKey } from "../i18n/de";

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

export interface ShoppingList {
  id: string;
  name: string;
  items: ListItem[];
  createdAt: number;
  /** Cloud-Liste: Vorlage? */
  isTemplate?: boolean | undefined;
  /** Cloud-Liste: Einladungscode für gemeinsames Bearbeiten */
  inviteCode?: string | null;
  /** Cloud-Liste: gehört diese Liste dem angemeldeten Nutzer? */
  isOwner?: boolean;
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
const LISTS_KEY = "shoppi:lists";
const ACTIVE_KEY = "shoppi:active-list";
const TPL_KEY = "shoppi:templates";
const MIGRATED_KEY = "shoppi:cloud-migrated";
const PENDING_JOIN_KEY = "shoppi:pending-join";

function isButterProduct(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("butter") || n === "margarine" || n === "butterschmalz" || n === "mehlbutter";
}

const DEFAULT_LISTS: ShoppingList[] = [
  { id: "l-default", name: "Unsere Einkaufsliste", items: SEED_ITEMS, createdAt: 0 },
];

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

const t = (key: MessageKey, vars?: Record<string, string | number>) =>
  translate(getLocale(), key, vars);

// ============================================================
// Lokaler Modus (ohne Anmeldung): unverändert wie bisher
// ============================================================

interface LocalListsApi {
  lists: ShoppingList[];
  activeList: ShoppingList;
  setActiveListId: (id: string) => void;
  createList: (name: string, isTemplate?: boolean) => string;
  createListFromItems: (name: string, items: ListItem[]) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  reorderLists: (fromId: string, toId: string) => void;
  setItems: (fn: (prev: ListItem[]) => ListItem[]) => void;
  hydrated: boolean;
  localListsRef: React.MutableRefObject<ShoppingList[]>;
}

function useLocalLists(): LocalListsApi {
  const [lists, setLists] = useState<ShoppingList[]>(DEFAULT_LISTS);
  const [activeListId, setActiveListId] = useState<string>("l-default");
  const [hydrated, setHydrated] = useState(false);
  const localListsRef = useRef<ShoppingList[]>(lists);
  localListsRef.current = lists;

  // Load from localStorage after hydration
  useEffect(() => {
    try {
      const savedLists = localStorage.getItem(LISTS_KEY);
      const savedActive = localStorage.getItem(ACTIVE_KEY);
      const savedList = localStorage.getItem(LIST_KEY);
      if (savedLists) {
        const parsed = JSON.parse(savedLists) as ShoppingList[];
        if (parsed.length) {
          setLists(
            parsed.map((l) => ({
              ...l,
              items: l.items.map((it) => {
                if (isButterProduct(it.name) && !it.emoji) return { ...it, emoji: "🧈" };
                // Altes Pilz-Emoji (Fliegenpilz) auf braunes Speisepilz-Emoji umstellen
                if (it.emoji === "🍄") return { ...it, emoji: "🍄‍🟫" };
                return it;
              }),
            }))
          );
        }
      } else if (savedList) {
        setLists([{ ...DEFAULT_LISTS[0]!, items: JSON.parse(savedList) }]);
      }
      if (savedActive) setActiveListId(savedActive);
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

  const createList = useCallback((name: string, isTemplate?: boolean) => {
    const list: ShoppingList = {
      id: `l${Date.now()}`,
      name: name.trim() || "Neue Liste",
      items: [],
      createdAt: Date.now(),
      isTemplate,
    };
    setLists((prev) => (isTemplate ? prev : [...prev, list]));
    if (!isTemplate) setActiveListId(list.id);
    return list.id;
  }, []);

  const createListFromItems = useCallback((name: string, items: ListItem[]) => {
    const list: ShoppingList = {
      id: `l${Date.now()}`,
      name: name.trim() || "Neue Liste",
      items,
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

  return {
    lists,
    activeList,
    setActiveListId,
    createList,
    createListFromItems,
    renameList,
    deleteList,
    reorderLists,
    setItems,
    hydrated,
    localListsRef,
  };
}

// ============================================================
// Cloud-Modus (angemeldet): Live-Sync über die Cloud
// ============================================================

interface CloudItemRow {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  checked: boolean | null;
  added_by_name: string | null;
  created_at: string | null;
  unit: string | null;
  organic: boolean | null;
  emoji: string | null;
  image_url: string | null;
  group_label: string | null;
  group_emoji: string | null;
  product_id: string | null;
  note: string | null;
}

interface CloudListRow {
  id: string;
  name: string;
  is_template: boolean | null;
  invite_code: string | null;
  owner_id: string;
  created_at: string | null;
}

type CloudRow = CloudItemRow & Partial<CloudListRow>;

// ============= Offline-Warteschlange für Cloud-Änderungen =============

const QUEUE_KEY = "shoppi:offline-queue";

type QueueEntry =
  | { fn: "addItems"; data: { listId: string; items: Array<Record<string, unknown>> } }
  | { fn: "updateItem"; data: { id: string; checked?: boolean; checkedByName?: string; groupLabel?: string; groupEmoji?: string; quantity?: string } }
  | { fn: "deleteItem"; data: { id: string } }
  | { fn: "clearChecked"; data: { listId: string } }
  | { fn: "updateList"; data: { id: string; name?: string; order?: string[] } }
  | { fn: "deleteList"; data: { id: string } };

function readQueue(): QueueEntry[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueueEntry[];
  } catch {
    return [];
  }
}

function enqueue(entry: QueueEntry) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([...readQueue(), entry]));
  } catch {
    /* ignore */
  }
}

async function runQueueEntry(entry: QueueEntry): Promise<void> {
  switch (entry.fn) {
    case "addItems":
      await addCloudItems({ data: entry.data });
      break;
    case "updateItem":
      await updateCloudItem({ data: entry.data });
      break;
    case "deleteItem":
      await deleteCloudItem({ data: entry.data });
      break;
    case "clearChecked":
      await clearCloudChecked({ data: entry.data });
      break;
    case "updateList":
      await updateCloudList({ data: entry.data });
      break;
    case "deleteList":
      await deleteCloudList({ data: entry.data });
      break;
  }
}

/** Führt einen Cloud-Aufruf aus; ohne Netz wird er sofort in die Warteschlange gelegt. */
function runCloud(entry: QueueEntry, callFactory: () => Promise<unknown>, onQueued?: () => void) {
  const queueIt = () => {
    enqueue(entry);
    onQueued?.();
    toast.info(t("cloud.queued"));
  };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueIt();
    return;
  }
  callFactory().catch(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) queueIt();
    else toast.error(t("cloud.error"));
  });
}

function rowToItem(r: CloudRow): ListItem {
  return {
    id: String(r.id),
    name: r.name,
    quantity: r.quantity ?? "",
    category: "sonstiges",
    checked: !!r.checked,
    addedBy: r.added_by_name ?? "?",
    addedAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
    unit: r.unit ?? undefined,
    organic: !!r.organic,
    emoji: r.emoji ?? undefined,
    imageUrl: r.image_url ?? null,
    groupLabel: r.group_label ?? undefined,
    groupEmoji: r.group_emoji ?? undefined,
    productId: r.product_id ?? undefined,
    note: r.note ?? undefined,
  };
}

function itemToCloudInput(it: ListItem, addedByName: string) {
  return {
    productId: it.productId ?? null,
    name: it.name,
    quantity: it.quantity ?? "",
    unit: it.unit ?? null,
    organic: !!it.organic,
    emoji: it.emoji ?? null,
    imageUrl: it.imageUrl ?? null,
    groupLabel: it.groupLabel ?? null,
    groupEmoji: it.groupEmoji ?? null,
    note: it.note ?? null,
    addedByName,
  };
}

/** Baut einen Listeneintrag aus einem Katalogartikel (lokal und Cloud identisch). */
function buildCatalogItem(id: string, input: AddCatalogItemInput, user: string): ListItem {
  return {
    id,
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
}

interface CloudListsApi {
  lists: ShoppingList[];
  templates: ShoppingList[];
  activeList: ShoppingList;
  members: string[];
  selfName: string;
  setActiveListId: (id: string) => void;
  createList: (name: string, isTemplate?: boolean) => string | undefined;
  createListFromItems: (name: string, items: ListItem[]) => void;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  reorderLists: (fromId: string, toId: string) => void;
  setItems: (fn: (prev: ListItem[]) => ListItem[]) => void;
  addItem: (name: string, quantity: string, category: ListItem["category"], user_?: string) => void;
  addCatalogItem: (input: AddCatalogItemInput, user_?: string) => void;
  toggleItem: (id: string) => void;
  setItemGroup: (id: string, label: string, emoji?: string) => void;
  setItemQuantity: (id: string, quantity: string) => void;
  removeItem: (id: string) => void;
  clearChecked: () => void;
  saveAsTemplate: (id: string) => void;
  createFromTemplate: (templateId: string) => void;
  joinByCode: (code: string) => Promise<boolean>;
  hydrated: boolean;
}

function useCloudLists(
  user: AuthUser | null,
  local: LocalListsApi,
  logActivity: (user: string, action: string, item: string) => void
): CloudListsApi {
  const [cloudLists, setCloudLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string>("");
  const [members, setMembers] = useState<string[]>([]);
  const [selfName, setSelfName] = useState<string>("Du");
  const [hydrated, setHydrated] = useState(false);
  const navigate = useNavigate();
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevItemsRef = useRef<Map<string, { checked: boolean; addedBy: string }>>(new Map());
  const localRef = useRef(local);
  localRef.current = local;

  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      reloadTimer.current = null;
      fetchCloud();
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCloud = useCallback(async () => {
    try {
      const res = await getMyLists();
      const itemsByList = new Map<string, CloudRow[]>();
      for (const it of res.items) {
        const arr = itemsByList.get(it.list_id) ?? [];
        arr.push(it);
        itemsByList.set(it.list_id, arr);
      }
      const mapped: ShoppingList[] = res.lists.map((r: CloudRow) => ({
        id: String(r.id),
        name: r.name,
        isTemplate: !!r.is_template,
        inviteCode: r.invite_code ?? null,
        isOwner: r.owner_id === res.selfId,
        createdAt: r.created_at ? Date.parse(r.created_at) : Date.now(),
        items: (itemsByList.get(r.id) ?? []).map(rowToItem),
      }));

      // Fern-Änderungen ins Aktivitätenprotokoll schreiben
      const nextItems = new Map<string, { checked: boolean; addedBy: string }>();
      for (const l of mapped) {
        for (const it of l.items) {
          nextItems.set(it.id, { checked: it.checked, addedBy: it.addedBy });
          const prev = prevItemsRef.current.get(it.id);
          if (!prev && it.addedBy !== res.displayName) {
            logActivity(it.addedBy, "hat hinzugefügt", it.name);
          } else if (prev && !prev.checked && it.checked && it.addedBy !== res.displayName) {
            logActivity(it.addedBy, "hat abgehakt", it.name);
          }
        }
      }
      prevItemsRef.current = nextItems;

      setCloudLists(mapped);
      setSelfName(res.displayName);
      const memberNames = new Set<string>();
      for (const m of res.members) {
        if (m.display_name && m.user_id !== res.selfId) memberNames.add(String(m.display_name));
      }
      setMembers([...memberNames]);

      setActiveListId((cur) => {
        if (cur && mapped.some((l) => l.id === cur && !l.isTemplate)) return cur;
        const first = mapped.find((l) => !l.isTemplate);
        return first ? first.id : "";
      });

      // Einmalige Migration der gerätelokalen Listen in die Cloud
      try {
        if (!localStorage.getItem(MIGRATED_KEY)) {
          localStorage.setItem(MIGRATED_KEY, "1");
          const importable = localRef.current.localListsRef.current;
          const listsToImport = importable.filter((l) => l.items.length > 0 && !l.isTemplate);
          let templatesToImport: ShoppingList[] = [];
          try {
            const savedTpl = localStorage.getItem(TPL_KEY);
            if (savedTpl) templatesToImport = (JSON.parse(savedTpl) as ShoppingList[]).filter((l) => l.items.length > 0);
          } catch {
            /* ignore */
          }
          if ((listsToImport.length > 0 || templatesToImport.length > 0) && mapped.length === 0) {
            await migrateCloudLists({
              data: {
                lists: [
                  ...listsToImport.map((l) => ({ name: l.name, isTemplate: false, items: l.items.map((i) => itemToCloudInput(i, res.displayName)) })),
                  ...templatesToImport.map((l) => ({ name: l.name, isTemplate: true, items: l.items.map((i) => itemToCloudInput(i, res.displayName)) })),
                ],
              },
            });
            await fetchCloud();
            toast.success(t("cloud.migrated", { n: listsToImport.length }));
            return;
          }
        }
      } catch {
        /* Migration ist optional */
      }

      // Ausstehender Beitritt über Einladungslink
      try {
        const pending = localStorage.getItem(PENDING_JOIN_KEY);
        if (pending) {
          localStorage.removeItem(PENDING_JOIN_KEY);
          const joined = await joinCloudByCode({ data: { code: pending } });
          if (joined.ok) {
            toast.success(t("join.okList", { name: joined.listName }));
            await fetchCloud();
            navigate({ to: "/" });
            return;
          }
        }
      } catch {
        /* Beitritt ist optional */
      }

      setHydrated(true);
    } catch {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logActivity, navigate]);

  // Live-Synchronisation: auf die eigenen Listen begrenzt (weniger Daten, weniger Nachladen)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const subscribedIdsRef = useRef<string>("");

  const subscribe = useCallback(
    (listIds: string[]) => {
      const key = [...listIds].sort().join(",");
      if (key === subscribedIdsRef.current) return;
      subscribedIdsRef.current = key;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      let channel = supabase.channel(`shoppi-lists-${crypto.randomUUID()}`);
      if (listIds.length) {
        const inFilter = `in.(${listIds.join(",")})`;
        channel = channel
          .on("postgres_changes", { event: "*", schema: "public", table: "list_items", filter: `list_id=${inFilter}` }, scheduleReload)
          .on("postgres_changes", { event: "*", schema: "public", table: "shopping_lists", filter: `id=${inFilter}` }, scheduleReload)
          .on("postgres_changes", { event: "*", schema: "public", table: "list_members", filter: `list_id=${inFilter}` }, scheduleReload);
      } else {
        channel = channel
          .on("postgres_changes", { event: "*", schema: "public", table: "shopping_lists" }, scheduleReload)
          .on("postgres_changes", { event: "*", schema: "public", table: "list_members" }, scheduleReload);
      }
      channel.subscribe();
      channelRef.current = channel;
    },
    [scheduleReload]
  );

  // Erstladen + Live-Synchronisation + Offline-Warteschlange abarbeiten
  useEffect(() => {
    if (!user) return;
    fetchCloud();
    const flushQueue = async () => {
      const queued = readQueue();
      if (!queued.length) return;
      try {
        localStorage.removeItem(QUEUE_KEY);
        for (const entry of queued) await runQueueEntry(entry);
        toast.success(t("cloud.queueFlushed", { n: queued.length }));
        fetchCloud();
      } catch {
        // Wieder einreihen, damit nichts verloren geht
        try {
          localStorage.setItem(QUEUE_KEY, JSON.stringify(queued));
        } catch {
          /* ignore */
        }
      }
    };
    flushQueue();
    window.addEventListener("online", flushQueue);
    return () => {
      window.removeEventListener("online", flushQueue);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      subscribedIdsRef.current = "";
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Realtime-Abo an die aktuellen Listen anpassen
  useEffect(() => {
    if (!user || !hydrated) return;
    subscribe(cloudLists.map((l) => l.id).filter((id) => !id.startsWith("tmp-")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hydrated, cloudLists]);

  // Aktive Liste merken
  useEffect(() => {
    if (activeListId) {
      try {
        localStorage.setItem(ACTIVE_KEY, activeListId);
      } catch {
        /* ignore */
      }
    }
  }, [activeListId]);

  const templates = useMemo(() => cloudLists.filter((l) => l.isTemplate), [cloudLists]);
  const lists = useMemo(() => cloudLists.filter((l) => !l.isTemplate), [cloudLists]);
  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? {
    id: "",
    name: t("list.defaultName"),
    items: [],
    createdAt: 0,
  };

  const replaceItemLocally = useCallback((tmpId: string, newItem: ListItem) => {
    setCloudLists((prev) =>
      prev.map((l) =>
        l.id === activeListId
          ? { ...l, items: l.items.map((it) => (it.id === tmpId ? newItem : it)) }
          : l
      )
    );
  }, [activeListId]);

  const setItems = useCallback(
    (fn: (prev: ListItem[]) => ListItem[]) => {
      setCloudLists((prev) =>
        prev.map((l) => (l.id === activeListId ? { ...l, items: fn(l.items) } : l))
      );
    },
    [activeListId]
  );

  const createList = useCallback(
    (name: string, isTemplate?: boolean) => {
      if (!user) return undefined;
      const id = `tmp-${Date.now()}`;
      const optimistic: ShoppingList = {
        id,
        name: name.trim() || t("list.defaultName"),
        items: [],
        createdAt: Date.now(),
        isTemplate,
      };
      if (isTemplate) {
        setCloudLists((prev) => [...prev, optimistic]);
      } else {
        setCloudLists((prev) => [...prev, optimistic]);
        setActiveListId(id);
      }
      createCloudList({ data: { name: name.trim() || t("list.defaultName"), isTemplate } })
        .then((res) => {
          setCloudLists((prev) =>
            prev.map((l) =>
              l.id === id
                ? {
                    ...l,
                    id: String((res.list as CloudRow).id),
                    inviteCode: (res.list as CloudRow).invite_code ?? null,
                  }
                : l
            )
          );
          if (!isTemplate) setActiveListId(String((res.list as CloudRow).id));
          scheduleReload();
        })
        .catch(() => {
          toast.error(t("cloud.error"));
          setCloudLists((prev) => prev.filter((l) => l.id !== id));
        });
      return id;
    },
    [user, scheduleReload]
  );

  const renameList = useCallback(
    (id: string, name: string) => {
      const n = name.trim();
      if (!n) return;
      setCloudLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: n } : l)));
      runCloud({ fn: "updateList", data: { id, name: n } }, () => updateCloudList({ data: { id, name: n } }));
    },
    [user]
  );

  const deleteList = useCallback(
    (id: string) => {
      setCloudLists((prev) => {
        const next = prev.filter((l) => l.id !== id);
        setActiveListId((cur) => {
          if (cur !== id) return cur;
          const first = next.find((l) => !l.isTemplate);
          return first ? first.id : "";
        });
        return next;
      });
      runCloud({ fn: "deleteList", data: { id } }, () => deleteCloudList({ data: { id } }).then(scheduleReload));
    },
    [user, scheduleReload]
  );

  const reorderLists = useCallback(
    (fromId: string, toId: string) => {
      setCloudLists((prev) => {
        const from = prev.findIndex((l) => l.id === fromId);
        const to = prev.findIndex((l) => l.id === toId);
        if (from < 0 || to < 0) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved!);
        const order = next.filter((l) => !l.isTemplate).map((l) => l.id);
        runCloud({ fn: "updateList", data: { id: moved!.id, order } }, () => updateCloudList({ data: { id: moved!.id, order } }));
        return next;
      });
    },
    [user]
  );

  const saveAsTemplate = useCallback(
    (id: string) => {
      const source = cloudLists.find((l) => l.id === id);
      if (!source) return;
      createCloudList({
        data: {
          name: source.name,
          isTemplate: true,
          items: source.items.map((i) => itemToCloudInput({ ...i, checked: false }, selfName)),
        },
      })
        .then(() => {
          scheduleReload();
          toast.success(t("lm.templateSaved"));
        })
        .catch(() => toast.error(t("cloud.error")));
    },
    [cloudLists, selfName, scheduleReload]
  );

  const createFromTemplate = useCallback(
    (templateId: string) => {
      const tpl = cloudLists.find((l) => l.id === templateId);
      if (!tpl) return;
      createCloudList({
        data: {
          name: tpl.name,
          items: tpl.items.map((i) => itemToCloudInput({ ...i, checked: false }, selfName)),
        },
      })
        .then((res) => {
          const newId = String((res.list as CloudRow).id);
          setActiveListId(newId);
          scheduleReload();
        })
        .catch(() => toast.error(t("cloud.error")));
    },
    [cloudLists, selfName, scheduleReload]
  );

  const joinByCode = useCallback(async (code: string) => {
    try {
      const res = await joinCloudByCode({ data: { code } });
      if (!res.ok) {
        toast.error(t("join.error"));
        return false;
      }
      toast.success(t("join.okList", { name: res.listName }));
      await fetchCloud();
      return true;
    } catch {
      toast.error(t("cloud.error"));
      return false;
    }
  }, [fetchCloud]);

  const addItem = useCallback(
    (name: string, quantity: string, category: CategoryId, _user = "Du") => {
      void category;
      const item: ListItem = {
        id: `tmp-${Date.now()}`,
        name: name.trim(),
        quantity: quantity.trim(),
        category: "sonstiges",
        checked: false,
        addedBy: selfName,
        addedAt: Date.now(),
      };
      setItems((prev) => [...prev, item]);
      logActivity(selfName, "hat hinzugefügt", item.name);
      const payload = { listId: activeListId, items: [{ name: item.name, quantity: item.quantity, addedByName: selfName }] };
      runCloud(
        { fn: "addItems", data: payload },
        () => addCloudItems({ data: payload }).then((res) => {
          const row = (res.items as CloudRow[])[0];
          if (!row) return;
          const next = rowToItem(row);
          if (!input.photo) return replaceItemLocally(item.id, next);
          return photoSaved.then(() => moveItemPhoto(item.id, next.id)).then(() => replaceItemLocally(item.id, next));
        })
      );
    },
    [selfName, activeListId, setItems, replaceItemLocally, logActivity]
  );

  const addCatalogItem = useCallback(
    (input: AddCatalogItemInput, _user = "Du") => {
      const item = buildCatalogItem(`tmp-${Date.now()}${Math.round(Math.random() * 1000)}`, input, selfName);
      const photoSaved = input.photo ? putItemPhoto(item.id, input.photo).catch(() => {}) : Promise.resolve();
      setItems((prev) => [...prev, item]);
      logActivity(selfName, "hat hinzugefügt", input.organic ? `${input.name} (Bio)` : input.name);
      const payload = { listId: activeListId, items: [itemToCloudInput(item, selfName)] };
      runCloud(
        { fn: "addItems", data: payload },
        () => addCloudItems({ data: payload }).then((res) => {
          const row = (res.items as CloudRow[])[0];
          if (!row) return;
          const next = rowToItem(row);
          if (!input.photo) return replaceItemLocally(item.id, next);
          return photoSaved.then(() => moveItemPhoto(item.id, next.id)).then(() => replaceItemLocally(item.id, next));
        })
      );
    },
    [selfName, activeListId, setItems, replaceItemLocally, logActivity]
  );

  const toggleItem = useCallback(
    (id: string) => {
      const current = activeList.items.find((it) => it.id === id);
      const after: ListItem | undefined = current ? { ...current, checked: !current.checked } : undefined;
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
      if (after && !id.startsWith("tmp-")) {
        if (after.checked) logActivity(selfName, "hat abgehakt", after.name);
        else logActivity(selfName, "hat wieder hinzugefügt", after.name);
        const checked = after.checked;
        runCloud(
          { fn: "updateItem", data: { id, checked, checkedByName: selfName } },
          () => updateCloudItem({ data: { id, checked, checkedByName: selfName } })
        );
      }
    },
    [setItems, selfName, logActivity, activeList]
  );

  const setItemGroup = useCallback(
    (id: string, label: string, emoji?: string) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, groupLabel: label, groupEmoji: emoji ?? it.groupEmoji } : it)));
      if (!id.startsWith("tmp-")) {
        const patch = { id, groupLabel: label, ...(emoji ? { groupEmoji: emoji } : {}) };
        runCloud({ fn: "updateItem", data: patch }, () => updateCloudItem({ data: patch }));
      }
    },
    [setItems]
  );

  const setItemQuantity = useCallback(
    (id: string, quantity: string) => {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity } : it)));
      if (!id.startsWith("tmp-")) {
        const patch = { id, quantity };
        runCloud({ fn: "updateItem", data: patch }, () => updateCloudItem({ data: patch }));
      }
    },
    [setItems]
  );

  const removeItem = useCallback(
    (id: string) => {
      const removed = activeList.items.find((it) => it.id === id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      if (!id.startsWith("tmp-")) {
        runCloud({ fn: "deleteItem", data: { id } }, () => deleteCloudItem({ data: { id } }));
      }
      if (removed) {
        const item = removed;
        toast(t("list.itemRemoved", { name: item.name }), {
          action: {
            label: t("common.undo"),
            onClick: () => {
              setItems((prev) => [...prev, item]);
              const payload = { listId: activeListId, items: [itemToCloudInput(item, selfName)] };
              runCloud({ fn: "addItems", data: payload }, () => addCloudItems({ data: payload }));
            },
          },
        });
      }
    },
    [setItems, activeList, activeListId, selfName]
  );

  const clearChecked = useCallback(() => {
    const removed = activeList.items.filter((it) => it.checked);
    setItems((prev) => prev.filter((it) => !it.checked));
    if (activeListId) {
      runCloud({ fn: "clearChecked", data: { listId: activeListId } }, () => clearCloudChecked({ data: { listId: activeListId } }));
    }
    if (removed.length) {
      toast(t("list.checkedCleared", { n: removed.length }), {
        action: {
          label: t("common.undo"),
          onClick: () => {
            setItems((prev) => [...prev, ...removed]);
            const payload = { listId: activeListId, items: removed.map((i) => itemToCloudInput(i, selfName)) };
            runCloud({ fn: "addItems", data: payload }, () => addCloudItems({ data: payload }));
          },
        },
      });
    }
  }, [setItems, activeList, activeListId, selfName]);

  const createListFromItems = useCallback(
    (name: string, items: ListItem[]) => {
      if (!user) return;
      const id = `tmp-${Date.now()}`;
      const optimistic: ShoppingList = {
        id,
        name: name.trim() || t("list.defaultName"),
        items,
        createdAt: Date.now(),
      };
      setCloudLists((prev) => [...prev, optimistic]);
      setActiveListId(id);
      createCloudList({
        data: {
          name: name.trim() || t("list.defaultName"),
          items: items.map((i) => itemToCloudInput({ ...i, checked: false }, selfName)),
        },
      })
        .then((res) => {
          const newId = String((res.list as CloudRow).id);
          setCloudLists((prev) =>
            prev.map((l) =>
              l.id === id
                ? { ...l, id: newId, inviteCode: (res.list as CloudRow).invite_code ?? null }
                : l
            )
          );
          setActiveListId(newId);
          scheduleReload();
        })
        .catch(() => {
          toast.error(t("cloud.error"));
          setCloudLists((prev) => prev.filter((l) => l.id !== id));
        });
    },
    [user, selfName, scheduleReload]
  );

  return {
    lists,
    templates,
    activeList,
    members,
    selfName,
    setActiveListId,
    createList,
    createListFromItems,
    renameList,
    deleteList,
    reorderLists,
    setItems,
    saveAsTemplate,
    createFromTemplate,
    joinByCode,
    hydrated,
    addItem,
    addCatalogItem,
    toggleItem,
    setItemGroup,
    setItemQuantity,
    removeItem,
    clearChecked,
  };
}

// ============================================================
// Gemeinsamer Einstiegspunkt (Signatur wie bisher)
// ============================================================

export function useShoppingList() {
  const user = useAuthUser();
  const local = useLocalLists();

  // Favoriten & Aktivitäten bleiben geräte-lokal (in beiden Modi)
  const [activity, setActivity] = useState<ActivityEntry[]>(SEED_ACTIVITY);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [localHydrated, setLocalHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedAct = localStorage.getItem(ACT_KEY);
      const savedFav = localStorage.getItem(FAV_KEY);
      if (savedAct) setActivity(JSON.parse(savedAct));
      if (savedFav) setFavorites(JSON.parse(savedFav));
    } catch {
      /* ignore */
    }
    setLocalHydrated(true);
  }, []);

  useEffect(() => {
    if (!localHydrated) return;
    try {
      localStorage.setItem(ACT_KEY, JSON.stringify(activity));
    } catch {
      /* ignore */
    }
  }, [activity, localHydrated]);

  useEffect(() => {
    if (!localHydrated) return;
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites, localHydrated]);

  const logActivity = useCallback((user_: string, action: string, item: string) => {
    setActivity((prev) =>
      [{ id: `a${Date.now()}`, user: user_, action, item, at: Date.now() }, ...prev].slice(0, 50)
    );
  }, []);

  const cloud = useCloudLists(user ?? null, local, logActivity);

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

  // ---- Lokaler Modus: Item-Funktionen wie bisher ----
  const localAddItem = useCallback(
    (name: string, quantity: string, category: CategoryId, user_ = "Du") => {
      const item: ListItem = {
        id: `i${Date.now()}`,
        name: name.trim(),
        quantity: quantity.trim(),
        category,
        checked: false,
        addedBy: user_,
        addedAt: Date.now(),
      };
      local.setItems((prev) => [...prev, item]);
      logActivity(user_, "hat hinzugefügt", item.name);
    },
    [local, logActivity]
  );

  const localAddCatalogItem = useCallback(
    (input: AddCatalogItemInput, user_ = "Du") => {
      const localItem = buildCatalogItem(`i${Date.now()}${Math.round(Math.random() * 1000)}`, input, user_);
      if (input.photo) putItemPhoto(localItem.id, input.photo).catch(() => {});
      local.setItems((prev) => [...prev, localItem]);
      logActivity(user_, "hat hinzugefügt", input.organic ? `${input.name} (Bio)` : input.name);
    },
    [local, logActivity]
  );

  const localSetItemGroup = useCallback(
    (id: string, label: string, emoji?: string) => {
      local.setItems((prev) => prev.map((it) => (it.id === id ? { ...it, groupLabel: label, groupEmoji: emoji ?? it.groupEmoji } : it)));
    },
    [local]
  );

  const localSetItemQuantity = useCallback(
    (id: string, quantity: string) => {
      local.setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity } : it)));
    },
    [local]
  );

  const localToggleItem = useCallback(
    (id: string) => {
      local.setItems((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          logActivity(it.addedBy, it.checked ? "hat wieder hinzugefügt" : "hat abgehakt", it.name);
          return { ...it, checked: !it.checked };
        })
      );
    },
    [local, logActivity]
  );

  const localRemoveItem = useCallback(
    (id: string) => {
      const removed = local.activeList.items.find((it) => it.id === id);
      local.setItems((prev) => prev.filter((it) => it.id !== id));
      if (removed) {
        const item = removed;
        toast(t("list.itemRemoved", { name: item.name }), {
          action: { label: t("common.undo"), onClick: () => local.setItems((prev) => [...prev, item]) },
        });
      }
    },
    [local]
  );

  const localClearChecked = useCallback(
    () => {
      const removed = local.activeList.items.filter((it) => it.checked);
      local.setItems((prev) => prev.filter((it) => !it.checked));
      if (removed.length) {
        toast(t("list.checkedCleared", { n: removed.length }), {
          action: { label: t("common.undo"), onClick: () => local.setItems((prev) => [...prev, ...removed]) },
        });
      }
    },
    [local]
  );

  // ---- Lokale Vorlagen (ohne Anmeldung) ----
  const [localTemplates, setLocalTemplates] = useState<ShoppingList[]>([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TPL_KEY);
      if (saved) setLocalTemplates(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);
  const persistLocalTemplates = useCallback((tpls: ShoppingList[]) => {
    setLocalTemplates(tpls);
    try {
      localStorage.setItem(TPL_KEY, JSON.stringify(tpls));
    } catch {
      /* ignore */
    }
  }, []);
  const saveAsTemplateLocal = useCallback(
    (id: string) => {
      const source = local.lists.find((l) => l.id === id);
      if (!source) return;
      persistLocalTemplates([
        ...localTemplates,
        {
          ...source,
          id: `t${Date.now()}`,
          isTemplate: true,
          createdAt: Date.now(),
          items: source.items.map((i) => ({ ...i, checked: false })),
        },
      ]);
      toast.success(t("lm.templateSaved"));
    },
    [local.lists, localTemplates, persistLocalTemplates]
  );
  const createFromTemplateLocal = useCallback(
    (templateId: string) => {
      const tpl = localTemplates.find((l) => l.id === templateId);
      if (!tpl) return;
      local.createListFromItems(
        tpl.name,
        tpl.items.map((i) => ({
          ...i,
          id: `i${Date.now()}${Math.round(Math.random() * 1000)}`,
          checked: false,
        }))
      );
    },
    [localTemplates, local]
  );
  const deleteTemplateLocal = useCallback(
    (templateId: string) => {
      persistLocalTemplates(localTemplates.filter((l) => l.id !== templateId));
    },
    [localTemplates, persistLocalTemplates]
  );

  if (!user) {
    return {
      items: local.activeList.items,
      lists: local.lists,
      templates: localTemplates,
      activeList: local.activeList,
      setActiveListId: local.setActiveListId,
      createList: local.createList,
      createListFromItems: local.createListFromItems,
      renameList: local.renameList,
      deleteList: local.deleteList,
      reorderLists: local.reorderLists,
      saveAsTemplate: saveAsTemplateLocal,
      createFromTemplate: createFromTemplateLocal,
      deleteTemplate: deleteTemplateLocal,
      joinByCode: (async () => {
        toast.error(t("join.needSignIn"));
        return false;
      }) as (code: string) => Promise<boolean>,
      activity,
      favorites,
      members: MEMBERS,
      selfName: "Du",
      signedIn: false as const,
      hydrated: local.hydrated && localHydrated,
      addItem: localAddItem,
      addCatalogItem: localAddCatalogItem,
      toggleItem: localToggleItem,
      setItemGroup: localSetItemGroup,
      setItemQuantity: localSetItemQuantity,
      removeItem: localRemoveItem,
      clearChecked: localClearChecked,
      isFavorite,
      toggleFavorite,
      inviteLinkFor: (_listId: string) => null as string | null,
    };
  }

  return {
    items: cloud.activeList.items,
    lists: cloud.lists,
    templates: cloud.templates,
    activeList: cloud.activeList,
    setActiveListId: cloud.setActiveListId,
    createList: cloud.createList,
    createListFromItems: cloud.createListFromItems,
    renameList: cloud.renameList,
    deleteList: cloud.deleteList,
    reorderLists: cloud.reorderLists,
    saveAsTemplate: cloud.saveAsTemplate,
    createFromTemplate: cloud.createFromTemplate,
    deleteTemplate: cloud.deleteList,
    joinByCode: cloud.joinByCode,
    activity,
    favorites,
    members: ["Du", ...cloud.members],
    selfName: cloud.selfName,
    signedIn: true as const,
    hydrated: cloud.hydrated && localHydrated,
    addItem: cloud.addItem,
    addCatalogItem: cloud.addCatalogItem,
    toggleItem: cloud.toggleItem,
    setItemGroup: cloud.setItemGroup,
    setItemQuantity: cloud.setItemQuantity,
    removeItem: cloud.removeItem,
    clearChecked: cloud.clearChecked,
    isFavorite,
    toggleFavorite,
    inviteLinkFor: (listId: string) => {
      const list = cloud.lists.find((l) => l.id === listId);
      if (!list?.inviteCode) return null;
      return `${window.location.origin}/beitreten?code=${list.inviteCode}`;
    },
  };
}

export type UseShoppingListReturn = ReturnType<typeof useShoppingList>;
