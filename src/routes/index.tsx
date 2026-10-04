import { createFileRoute } from "@tanstack/react-router";
import { useCheckedDisplay } from "../hooks/use-checked-display";
import { Fragment, useEffect, useState, useMemo, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { OverviewSortable } from "../components/overview-sortable";
import { SplashScreen } from "../components/splash-screen";
import { LandingPage } from "@/components/landing/landing-page";
import { shouldShowLanding, markLandingDone } from "@/lib/landing";
import {
  useShoppingList,
  getCategory,
  type ListItem,
} from "../hooks/use-shopping-list";
import { useDepartmentOrder } from "../hooks/use-department-order";
import { useProductOrder } from "../hooks/use-product-order";
import {
  catalogQueryOptions,
  useCatalog,
  headingByProduct,
  departmentIdsOf,
  type CatalogDepartment,
} from "../lib/catalog-query";
import { getLocale, pickName } from "../i18n";
import { deleteItemPhotos } from "../lib/item-photo-store";
import { ItemPhoto } from "../components/item-photo";
import {
  CheckIcon,
  PlusIcon,
  ShareIcon,
} from "../components/icons";
import { ListManager, shareList } from "../components/list-manager";
import { relocalizeQuantity } from "../lib/units";
import { speakQuantity } from "../lib/speech-units";
import { ExportListButton } from "../components/export-list-sheet";
import { unitShort, formatQuantity } from "../lib/units";
import { usePurchaseHistory } from "../hooks/use-purchase-history";
import { useT } from "../i18n";
import { ProductIcon, DepartmentIcon } from "../components/catalog-icon";
import { deptColor, deptColorByLabel } from "../lib/dept-colors";
import { toast } from "sonner";
import { currentMarket, useReferencePrices } from "../hooks/use-reference-prices";
import { priceForItem } from "../lib/item-price";
import { PurchaseMode, type PurchaseItem } from "../components/purchase-mode";
import { useSpeakLocale } from "../hooks/use-speak-locale";
import { useGroupOrder, applyGroupOrder, filterHidden } from "../hooks/use-group-order";
import { useStores } from "../hooks/use-stores";

const MARKET_CURRENCY: Record<string, string> = { CH: "CHF", DE: "EUR", AT: "EUR", FR: "EUR", ES: "EUR", MX: "MXN", IT: "EUR", BE: "EUR", NL: "EUR", GB: "GBP", US: "USD", CA: "CAD", PT: "EUR", BR: "BRL" };



export const Route = createFileRoute("/")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions(getLocale())),
  head: () => ({
    meta: [
      { title: "Shoppi — Unsere Einkaufsliste" },
      { name: "description", content: "Die smarte Einkaufsliste für deinen Alltag. Gemeinsam. Einfach. Einkaufen." },
      { property: "og:title", content: "Shoppi — Unsere Einkaufsliste" },
      { property: "og:description", content: "Die smarte Einkaufsliste für deinen Alltag." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  pendingComponent: () => <SplashScreen />,
  component: LandingGate,
});

/** Ziehbarer Abteilungs-Block in der Listenansicht (Griff in der Kopfzeile). */
function SortableGroup({ id, header, children }: { id: string; header: (handle: ReactNode) => ReactNode; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { t } = useT();
  const grip = (
    <button
      {...attributes}
      {...listeners}
      className="grid h-6 w-6 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground/60 active:cursor-grabbing"
      aria-label={t("list.moveGroup")}
      title={t("list.moveGroup")}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        {[6, 12, 18].map((y) => (
          <g key={y}>
            <circle cx={9} cy={y} r={1.6} />
            <circle cx={15} cy={y} r={1.6} />
          </g>
        ))}
      </svg>
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined }}
      className={isDragging ? "relative rounded-2xl shadow-lg" : undefined}
    >
      {header(grip)}
      {children}
    </div>
  );
}

function ListPage() {
  const {
    items, hydrated, loading, toggleItem, setItemGroup, removeItem, clearChecked, addItem, addCatalogItem,
    lists, activeList, setActiveListId, createList, renameList, deleteList, reorderLists,
    templates, saveAsTemplate, createFromTemplate, deleteTemplate, reorderTemplates,
  } = useShoppingList();
  const [managerOpen, setManagerOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  // Übersicht zuerst: erst nach Auswahl einer Liste wird deren Inhalt geladen.
  const [openListId, setOpenListId] = useState<string | null>(null);
  // Neue Liste erhält nach dem Speichern ihre endgültige Kennung: geöffnet bleiben.
  useEffect(() => {
    if (openListId?.startsWith("tmp-") && !activeList.id.startsWith("tmp-") && !lists.some((l) => l.id === openListId)) {
      setOpenListId(activeList.id);
    }
  }, [openListId, activeList.id, lists]);
  const [speakLocale] = useSpeakLocale();
  const { all: groupOrderAll, saveFor: saveGroupOrderFor, hiddenAll: hiddenGroupsAll, listStores, setListStore, store: settingsStore } = useGroupOrder();
  const activeStoreId = listStores[activeList.id] ?? "default";
  const pick = (o?: string[]) => (o && o.length > 0 ? o : undefined);
  const groupOrder = pick(groupOrderAll[activeStoreId]) ?? pick(groupOrderAll[settingsStore]) ?? groupOrderAll["default"] ?? [];
  const hiddenGroups = hiddenGroupsAll[activeStoreId] ?? [];
  const allStores = useStores();
  const activeStoreName = allStores.find((s) => s.id === activeStoreId)?.name;
  const saveGroupOrder = (keys: string[]) => saveGroupOrderFor(activeStoreId, keys);
  const groupSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const data = useCatalog();
  const { t } = useT();
  const { data: referencePrices, isPending: pricesPending } = useReferencePrices();
  /** "Beliebige/Beliebiger/Beliebiges …" (und Übersetzungen wie "Any …") nicht anzeigen. */
  const stripAnyPrefix = (name: string) =>
    name.replace(
      /^(beliebiges|beliebiger|beliebige|willekeurige|willekeurig|cualquier|qualquer|any)\s+/i,
      "",
    ).trim();
  /** Katalogartikel in der gewählten Sprache anzeigen (Sorte bleibt erhalten). */
  const displayName = (item: ListItem) => {
    const product = item.productId ? productById.get(item.productId) : undefined;
    if (!product) return stripAnyPrefix(item.name);
    const i = item.name.indexOf(" · ");
    const base = i >= 0 ? product.name + item.name.slice(i) : product.name;
    return stripAnyPrefix(base);
  };
  const { departments } = useDepartmentOrder(data.departments);

  const deptIds = useMemo(() => new Set(departments.map((d) => d.id)), [departments]);
  // Persönliche (nur lokal gespeicherte) Artikel-Anordnung übernehmen — analog Abteilungsansicht.
  const { products: orderedProducts } = useProductOrder(data.products, deptIds);

  const deptById = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments],
  );
  const productById = useMemo(
    () => new Map(orderedProducts.map((p) => [p.id, p])),
    [orderedProducts],
  );

  /** Kategorie eines Listeneintrags: Alias-Kategorie, wenn der Eintrag unter ihr hinzugefügt wurde, sonst Original. */
  const leafOf = (it: ListItem): CatalogDepartment | undefined => {
    const product = it.productId ? productById.get(it.productId) : undefined;
    if (!product?.departmentId) return undefined;
    if (it.groupLabel) {
      for (const id of departmentIdsOf(product, data.productAliases ?? []).slice(1)) {
        const d = deptById.get(id);
        if (d && (d.name === it.groupLabel || d.baseName === it.groupLabel || Object.values(d.names).includes(it.groupLabel))) return d;
      }
    }
    return deptById.get(product.departmentId);
  };

  /** Kategoriepfad (Wurzel → ... → Blatt) eines Produkts. */
  const chainOf = (leaf: CatalogDepartment): CatalogDepartment[] => {
    const chain: CatalogDepartment[] = [];
    let current: CatalogDepartment | undefined = leaf;
    while (current) {
      chain.unshift(current);
      current = current.parentId ? deptById.get(current.parentId) : undefined;
    }
    return chain;
  };

  /** Sortierschlüssel entlang des Kategoriebaums, analog zur Abteilungsansicht. */
  const treeOrder = (leaf: CatalogDepartment): number =>
    chainOf(leaf).reduce((acc, d) => acc * 1000 + d.sortOrder, 0);

  /** Findet eine Katalog-Abteilung anhand eines Gruppennamens (Name, Basisname oder Übersetzung). */
  const deptByLabel = (label: string): CatalogDepartment | undefined => {
    const needle = label.trim().toLowerCase();
    if (!needle) return undefined;
    for (const d of departments) {
      if (d.name.trim().toLowerCase() === needle) return d;
      if (d.baseName?.trim().toLowerCase() === needle) return d;
      if (Object.values(d.names).some((n) => n.trim().toLowerCase() === needle)) return d;
    }
    return undefined;
  };

  /** Bildet die festen Artikel-Kategorien (manuell eingetippte Einträge) auf die
   *  passende oberste Katalog-Abteilung ab, damit die Laden-Reihenfolge greift. */
  const CATEGORY_ROOT_NAMES: Record<string, string> = {
    "obst-gemuese": "Frischmarkt",
    milchprodukte: "Milchprodukte & Eier",
    backwaren: "Backwaren & Frühstück",
    "fleisch-fisch": "Fleisch & Fisch",
    getraenke: "Getränke",
    tierbedarf: "Tierbedarf",
  };
  const rootForCategory = (categoryId: string): CatalogDepartment | undefined => {
    const name = CATEGORY_ROOT_NAMES[categoryId];
    return name ? deptByLabel(name) : undefined;
  };

  interface Group {
    key: string;
    label: string;
    emoji: string;
    order: number;
    root?: CatalogDepartment | undefined;
    items: ListItem[];
  }

  /** Sortierung analog zur Abteilungsansicht: Einträge in Baumreihenfolge
   *  der Unterkategorien, innerhalb einer Unterkategorie in Katalog-Reihenfolge. */
  const grouped = useMemo(() => {
    const map = new Map<string, Group>();
    for (const it of items) {
      const leaf = leafOf(it);
      // Ohne Katalog-Verknüpfung: Gruppenname auf eine Abteilung abbilden,
      // damit die in den Einstellungen gespeicherte Reihenfolge greift.
      const fallbackDept = leaf ? undefined : rootForCategory(it.category) ?? deptByLabel(it.groupLabel ?? getCategory(it.category).label);
      const root = leaf ? chainOf(leaf)[0] : fallbackDept ? chainOf(fallbackDept)[0] : undefined;
      const key = root ? root.id : `label:${it.groupLabel ?? it.category}`;
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          label: root?.name ?? it.groupLabel ?? getCategory(it.category).label,
          emoji: root?.emoji ?? it.groupEmoji ?? getCategory(it.category).emoji,
          order: root ? root.sortOrder : Number.MAX_SAFE_INTEGER,
          root,
          items: [],
        };
        map.set(key, group);
      }
      group.items.push(it);
    }
    const groups = filterHidden(applyGroupOrder([...map.values()].sort((a, b) => a.order - b.order), groupOrder), hiddenGroups);
    for (const group of groups) {
      group.items.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        const ta = segOf(a).tree;
        const tb = segOf(b).tree;
        if (ta !== tb) return ta - tb;
        const pa = a.productId ? productById.get(a.productId) : undefined;
        const pb = b.productId ? productById.get(b.productId) : undefined;
        const oa = pa?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const ob = pb?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (oa !== ob) return oa - ob;
        // Gleichstand: alphabetisch wie in der Abteilungsansicht
        if (pa && pb) return pa.name.localeCompare(pb.name, getLocale());
        return a.addedAt - b.addedAt;
      });
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, productById, deptById, groupOrder, hiddenGroups]);

  /** Baum-Sortierschlüssel entlang des Kategoriebaums (analog Abteilungsansicht). */
  function segOf(it: ListItem) {
    const leaf = leafOf(it);
    return { tree: leaf ? treeOrder(leaf) : Number.MAX_SAFE_INTEGER };
  }


  const headingOf = useMemo(() => headingByProduct(data.products, data.headings), [data.products, data.headings]);
  const doneCount = items.filter((i) => i.checked).length;
  const [checkedDisplay] = useCheckedDisplay();
  const [showDone, setShowDone] = useState(false);
  const hideDone = checkedDisplay === "hide" && !showDone;
  const visibleGroups = useMemo(
    () => hideDone ? grouped.map((g) => ({ ...g, items: g.items.filter((i) => !i.checked) })).filter((g) => g.items.length > 0) : grouped,
    [grouped, hideDone],
  );
  const total = items.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;
  const estimate = useMemo(() => items.reduce((acc, item) => {
    const product = item.productId ? productById.get(item.productId) : undefined;
    const ref = item.productId ? referencePrices?.get(item.productId) : undefined;
    const amount = product && ref ? priceForItem({ quantity: item.quantity, unit: item.unit ?? "" }, product, ref) : null;
    if (amount === null) acc.missing += 1;
    else acc.value += amount;
    return acc;
  }, { value: 0, missing: 0 }), [items, productById, referencePrices]);
  const currency = referencePrices?.values().next().value?.currency ?? MARKET_CURRENCY[currentMarket()] ?? "EUR";

  /** Artikel für den freihändigen Kaufmodus (offene Einträge, Vorlese-Sprache). */
  const purchaseItems = useMemo<PurchaseItem[]>(() => grouped.flatMap((g) => {
    const colorDept = g.root ?? departments.find((d) => d.name === g.label || d.baseName === g.label);
    const color = (colorDept ? deptColor(colorDept, deptById) : undefined) ?? deptColorByLabel(g.label);
    return g.items.map((i) => {
      const product = i.productId ? productById.get(i.productId) : undefined;
      let name = displayName(i);
      if (product) {
        const k = i.name.indexOf(" · ");
        const base = pickName(product.names, speakLocale, product.baseName);
        name = stripAnyPrefix(k >= 0 ? base + i.name.slice(k) : base);
      }
      return {
        id: i.id,
        name,
        spoken: `${i.quantity ? speakQuantity(i.quantity, i.unit, speakLocale) + " " : ""}${name}`,
        quantity: i.quantity ? relocalizeQuantity(i.quantity, i.unit) : "",
        checked: i.checked,
        emoji: i.emoji || product?.emoji || "🛒",
        ...(product?.imagePath ? { imagePath: product.imagePath, imageUrl: product.imageUrl } : {}),
        ...(color ? { color } : {}),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [grouped, speakLocale, productById, deptById, departments]);


  // ---- Smarte Vorschläge (aus dem Einkaufsverlauf) & Einkauf abschliessen ----
  const { addPurchase } = usePurchaseHistory();
  const finishShopping = () => {
    const bought = items.filter((i) => i.checked);
    if (bought.length === 0) return;
    addPurchase(
      activeList.name,
      bought.map((i) => ({ name: displayName(i), productId: i.productId, emoji: i.emoji, quantity: i.quantity || undefined })),
    );
    clearCheckedWithPhotos();
    toast.success(t("hist.archived", { n: bought.length }));
  };
  const clearCheckedWithPhotos = () => {
    deleteItemPhotos(items.filter((i) => i.checked).map((i) => i.id)).catch(() => {});
    clearChecked();
  };

  // Erst nach Anmeldeprüfung und Laden der Listen anzeigen — keine aufblitzende Beispiel-Liste.
  if (loading || !hydrated) return <SplashScreen />;

  // ---- Übersicht: zuerst alle Listen anzeigen, Inhalt erst nach Auswahl laden ----
  if (!openListId || !lists.some((l) => l.id === openListId)) {
    return (
      <div className="space-y-5">
        <ListManager
          open={managerOpen}
          onClose={() => setManagerOpen(false)}
          lists={lists}
          activeId={activeList.id}
          templates={templates}
          onSelect={(id) => { setActiveListId(id); setOpenListId(id); }}
          onCreate={(name, storeId) => {
            const id = createList(name);
            if (id) { setListStore(id, storeId); setActiveListId(id); setOpenListId(id); }
          }}
          onRename={renameList}
          onDelete={deleteList}
          onReorder={reorderLists}
          onSaveAsTemplate={saveAsTemplate}
          onCreateFromTemplate={(templateId) => {
            createFromTemplate(templateId);
            toast.success(t("lm.templateCreated"));
          }}
          onDeleteTemplate={deleteTemplate}
          onReorderTemplates={reorderTemplates}
        />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("list.lists")}</h1>
        <OverviewSortable
          rows={lists.map((l) => ({
            id: l.id,
            name: l.name,
            sub: l.items.length === 0 ? t("list.empty1") : `${l.items.filter((i) => i.checked).length}/${l.items.length}`,
            emoji: "🛒",
          }))}
          onReorder={reorderLists}
          onOpen={(id) => { setActiveListId(id); setOpenListId(id); }}
          onSaveTemplate={(id) => { saveAsTemplate(id); toast.success(t("lm.templateSaved")); }}
          onDelete={(id) => {
            if (lists.length <= 1) { toast.error(t("lm.lastList")); return; }
            const l = lists.find((x) => x.id === id);
            if (l && confirm(t("lm.confirmDelete").replace("{name}", l.name))) deleteList(id);
          }}
          t={t}
        />
        <h2 className="pt-2 text-lg font-bold tracking-tight text-foreground">{t("lm.templates")}</h2>
        {templates.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("lm.templatesHint")}</p>
        ) : (
          <OverviewSortable
            rows={templates.map((tp) => ({ id: tp.id, name: tp.name, sub: String(tp.items.length), emoji: "📋" }))}
            onReorder={reorderTemplates}
            onOpen={(id) => { createFromTemplate(id); toast.success(t("lm.templateCreated")); }}
            onDelete={(id) => {
              const tp = templates.find((x) => x.id === id);
              if (tp && confirm(t("lm.deleteTemplateConfirm").replace("{name}", tp.name))) deleteTemplate(id);
            }}
            t={t}
          />
        )}
        <button
          onClick={() => setManagerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-3.5 text-sm font-semibold text-primary active:bg-muted"
        >
          <PlusIcon className="h-4 w-4" /> {t("lm.create")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ListManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        lists={lists}
        activeId={activeList.id}
        templates={templates}
        onSelect={setActiveListId}
        onCreate={(name, storeId) => {
          const id = createList(name);
          if (id) setListStore(id, storeId);
        }}
        onRename={renameList}
        onDelete={deleteList}
        onReorder={reorderLists}
        onSaveAsTemplate={saveAsTemplate}
        onCreateFromTemplate={(templateId) => {
          createFromTemplate(templateId);
          toast.success(t("lm.templateCreated"));
        }}
        onDeleteTemplate={deleteTemplate}
        onReorderTemplates={reorderTemplates}
      />

      {/* Zurück zur Listen-Übersicht */}
      <button
        onClick={() => setOpenListId(null)}
        className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground active:bg-muted/70"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
        {t("list.lists")}
      </button>

      {/* Title + progress */}
      <div>
        <div className="flex items-center gap-2">
          <button onClick={() => setManagerOpen(true)} className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{activeList.name}</h1>
            {activeStoreName && <p className="truncate text-xs text-muted-foreground">🏪 {activeStoreName}</p>}
          </button>
          <div className="-mr-1 flex shrink-0 items-center gap-0">
          <button
            onClick={() => setPurchaseOpen(true)}
            aria-label={t("purchase.title")}
            title={t("purchase.title")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary active:bg-muted"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1.5" /><circle cx="19" cy="21" r="1.5" />
              <path d="M2 3h3l2.6 12.4a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21.5 8H6" />
            </svg>
          </button>
          <button
            onClick={() => shareList({ ...activeList, items: activeList.items.map((i) => ({ ...i, name: displayName(i), quantity: i.quantity ? relocalizeQuantity(i.quantity, i.unit) : i.quantity })) })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary active:bg-muted"
            aria-label={t("list.share")}
            title={t("list.share")}
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <ExportListButton
            title={activeList.name}
            groups={grouped.map((g) => ({
              label: g.label,
              items: g.items.map((i) => {
                const product = i.productId ? productById.get(i.productId) : undefined;
                return {
                  name: displayName(i),
                  quantity: i.quantity ? relocalizeQuantity(i.quantity, i.unit) : "",
                  unit: i.unit ? unitShort(i.unit) : "",
                  organic: !!i.organic,
                  note: i.note ?? "",
                  checked: i.checked,
                  productId: i.productId ?? "",
                  defaultQuantity: product?.defaultQuantity ?? 0,
                  defaultUnit: product?.defaultUnit ?? "",
                  priceQuantity: i.quantity,
                  priceUnit: i.unit ?? "",
                };
              }),
            }))}
          />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {doneCount}/{total}
          </span>
        </div>
      </div>



      {/* List grouped by category */}
      {items.length === 0 && hydrated && (
        <div className="py-16 text-center">
          <div className="text-5xl">🧺</div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("list.empty1")}<br />{t("list.empty2")}
          </p>
        </div>
      )}

      <DndContext
        sensors={groupSensors}
        collisionDetection={closestCenter}
        onDragEnd={(e: DragEndEvent) => {
          const { active, over } = e;
          if (!over || active.id === over.id) return;
          const keys = grouped.map((g) => g.key);
          const from = keys.indexOf(String(active.id));
          const to = keys.indexOf(String(over.id));
          if (from < 0 || to < 0) return;
          keys.splice(to, 0, ...keys.splice(from, 1));
          saveGroupOrder(keys);
        }}
      >
      <SortableContext items={grouped.map((g) => g.key)} strategy={verticalListSortingStrategy}>
      <div className="space-y-6">
        {visibleGroups.map((group) => {
          return (
            <SortableGroup key={group.key} id={group.key} header={(grip) => (
              <div className="mb-2 flex items-center gap-1.5">
                {grip}
                <span className="grid h-6 w-6 shrink-0 place-items-center"><DepartmentIcon emoji={group.emoji} imageUrl={group.root?.imageUrl} imagePath={group.root?.imagePath} className="h-6 w-6 object-contain" symbolClassName="text-lg" /></span>
                <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
              </div>
            )}>
              <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                {group.items.map((item, index) => {
                  const h = group.items.length > 5 && !item.checked && item.productId ? headingOf.get(item.productId) : undefined;
                  const prev = group.items[index - 1];
                  const showH = h && (prev?.productId ? headingOf.get(prev.productId) : undefined) !== h;
                  return (
                  <Fragment key={item.id}>
                  {showH && <div className="bg-muted/50 px-4 pb-1.5 pt-3 text-sm font-bold text-foreground">{h.name}</div>}
                  <div
                    className="relative flex items-center gap-2.5 py-2.5 pl-3 pr-3"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${

                        item.checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-transparent"
                      }`}
                      aria-label={item.checked ? t("list.uncheck") : t("list.check")}
                    >
                      {item.checked && <CheckIcon className="h-4 w-4" />}
                    </button>
                    {(() => {
                      // Farbe: über die Wurzelkategorie, sonst über den Gruppennamen (z. B. ältere Einträge mit eigenem Gruppenlabel)
                      const colorDept = group.root ?? departments.find((d) => d.name === group.label || d.baseName === group.label);
                      const color = (colorDept ? deptColor(colorDept, deptById) : undefined) ?? deptColorByLabel(group.label);
                      return (
                    <div
                      className={`grid h-7 w-7 shrink-0 select-none place-items-center overflow-hidden rounded-md text-[19px] ${color ? "" : "bg-primary-soft/25"}`}
                      style={color ? { backgroundColor: color } : undefined}
                    >
                        {(() => {
                          const product = item.productId ? productById.get(item.productId) : undefined;
                          return <ProductIcon emoji={item.emoji} iconUrl={product?.iconUrl} iconPath={product?.iconPath} symbolClassName="text-[19px]" />;
                        })()}
                    </div>
                      );
                    })()}
                    <div className="min-w-0 flex-1">
                      <p className={`break-words font-medium text-sm ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {displayName(item)}{item.organic ? ` (${t("common.organic")})` : ""}
                      </p>
                      <p className="break-words text-xs text-muted-foreground">
                        {item.quantity ? relocalizeQuantity(item.quantity, item.unit) : "—"} · {t("list.by", { name: item.addedBy })}
                      </p>
                      {item.note && (
                        <p className="break-words text-xs italic text-muted-foreground/80">
                          📝 {item.note}
                        </p>
                      )}
                    </div>
                    <ItemPhoto itemId={item.id} readOnly />
                    {(() => {
                      const product = item.productId ? productById.get(item.productId) : undefined;
                      const ids = product ? departmentIdsOf(product, data.productAliases ?? []) : [];
                      if (ids.length < 2) return null;
                      const cur = leafOf(item)?.id ?? "";
                      return (
                        <label className="relative grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-base text-muted-foreground" title={t("palias.change")}>
                          <span aria-hidden="true">📂</span>
                          <select
                            aria-label={t("palias.change")}
                            value={cur}
                            onChange={(e) => { const d = deptById.get(e.target.value); if (d) setItemGroup(item.id, d.name, d.emoji ?? undefined); }}
                            className="absolute inset-0 cursor-pointer opacity-0"
                          >
                            {ids.map((id) => { const d = deptById.get(id); return d ? <option key={id} value={id}>{chainOf(d).map((x) => x.name).join(" › ")}</option> : null; })}
                          </select>
                        </label>
                      );
                    })()}
                  </div>
                  </Fragment>
                  );
                })}
              </div>
            </SortableGroup>
          );
        })}
      </div>
      </SortableContext>
      </DndContext>

      {hydrated && items.length > 0 && (
        <div className="border-t border-border pt-4" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-foreground">{t("list.estimatedTotal")}</span>
            <span className="text-lg font-bold text-foreground">{pricesPending ? "…" : estimate.missing === items.length ? "—" : new Intl.NumberFormat(getLocale(), { style: "currency", currency }).format(estimate.value)}</span>
          </div>
          {!pricesPending && estimate.missing > 0 && <p className="mt-1 text-xs text-muted-foreground">{t("list.unpriced", { n: estimate.missing })}</p>}
        </div>
      )}

      {checkedDisplay === "hide" && doneCount > 0 && (
        <button
          type="button"
          onClick={() => setShowDone((v) => !v)}
          className="w-full rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground transition active:bg-muted"
        >
          {showDone ? t("list.hideDone") : t("list.showDone", { n: doneCount })}
        </button>
      )}

      {/* Einkauf abschliessen: archiviert abgehakte Artikel im Verlauf */}
      {doneCount > 0 && (
        <button
          onClick={finishShopping}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
        >
          {t("hist.finish", { n: doneCount })}
        </button>
      )}
      {purchaseOpen && (
        <PurchaseMode
          items={purchaseItems}
          onToggle={toggleItem}
          onClose={() => setPurchaseOpen(false)}
        />
      )}
    </div>
  );
}

// Erster Besuch: Landingpage zeigen, danach direkt die Einkaufsliste.
function LandingGate() {
  const [decided, setDecided] = useState<boolean | null>(null);

  useEffect(() => {
    setDecided(!shouldShowLanding());
  }, []);

  if (decided === null) return <SplashScreen />;
  if (decided === false) {
    return (
      <LandingPage
        onEnterApp={() => {
          markLandingDone();
          setDecided(true);
        }}
      />
    );
  }
  return <ListPage />;
}
