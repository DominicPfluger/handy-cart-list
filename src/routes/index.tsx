import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState, useMemo } from "react";
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
import {
  CheckIcon,
  TrashIcon,
  PlusIcon,
  ShareIcon,
} from "../components/icons";
import { ListManager, shareList } from "../components/list-manager";
import { relocalizeQuantity } from "../lib/units";
import { SpeakListButton } from "../components/speak-list-button";
import { speakQuantity } from "../lib/speech-units";
import { ExportListButton } from "../components/export-list-sheet";
import { unitShort } from "../lib/units";
import { usePurchaseHistory } from "../hooks/use-purchase-history";
import { useT } from "../i18n";
import { ProductEmoji } from "../components/product-emoji";
import { toast } from "sonner";


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

function ListPage() {
  const {
    items, hydrated, toggleItem, setItemGroup, removeItem, clearChecked, addItem,
    lists, activeList, setActiveListId, createList, renameList, deleteList, reorderLists,
    templates, saveAsTemplate, createFromTemplate, deleteTemplate,
  } = useShoppingList();
  const [managerOpen, setManagerOpen] = useState(false);
  const data = useCatalog();
  const { t } = useT();
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
      const root = leaf ? chainOf(leaf)[0] : undefined;
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
    const groups = [...map.values()].sort((a, b) => a.order - b.order);
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
  }, [items, productById, deptById]);

  /** Baum-Sortierschlüssel entlang des Kategoriebaums (analog Abteilungsansicht). */
  function segOf(it: ListItem) {
    const leaf = leafOf(it);
    return { tree: leaf ? treeOrder(leaf) : Number.MAX_SAFE_INTEGER };
  }


  const headingOf = useMemo(() => headingByProduct(data.products, data.headings), [data.products, data.headings]);
  const doneCount = items.filter((i) => i.checked).length;
  const total = items.length;
  const progress = total > 0 ? (doneCount / total) * 100 : 0;

  // ---- Smarte Vorschläge (aus dem Einkaufsverlauf) & Einkauf abschliessen ----
  const { addPurchase } = usePurchaseHistory();
  const finishShopping = () => {
    const bought = items.filter((i) => i.checked);
    if (bought.length === 0) return;
    addPurchase(
      activeList.name,
      bought.map((i) => ({ name: displayName(i), productId: i.productId, emoji: i.emoji, quantity: i.quantity || undefined })),
    );
    clearChecked();
    toast.success(t("hist.archived", { n: bought.length }));
  };

  return (
    <div className="space-y-5">
      <ListManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        lists={lists}
        activeId={activeList.id}
        templates={templates}
        onSelect={setActiveListId}
        onCreate={createList}
        onRename={renameList}
        onDelete={deleteList}
        onReorder={reorderLists}
        onSaveAsTemplate={saveAsTemplate}
        onCreateFromTemplate={(templateId) => {
          createFromTemplate(templateId);
          toast.success(t("lm.templateCreated"));
        }}
        onDeleteTemplate={deleteTemplate}
      />

      {/* List switcher */}
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 no-scrollbar" role="tablist" aria-label={t("list.lists")}>
        {lists.map((l) => (
          <button
            key={l.id}
            role="tab"
            aria-selected={l.id === activeList.id}
            onClick={() => setActiveListId(l.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              l.id === activeList.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {l.name}
          </button>
        ))}
        <button
          onClick={() => setManagerOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary"
        >
          <PlusIcon className="h-3.5 w-3.5" /> {t("list.lists")}
        </button>
      </div>

      {/* Title + progress */}
      <div>
        <div className="flex items-center gap-2">
          <button onClick={() => setManagerOpen(true)} className="min-w-0 flex-1 text-left">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">{activeList.name}</h1>
          </button>
          <SpeakListButton
            title={activeList.name}
            groups={(sl) => grouped.map((g) => ({
              label: g.root ? pickName(g.root.names, sl, g.root.baseName) : g.label,
              items: g.items.filter((i) => !i.checked).map((i) => {
                const product = i.productId ? productById.get(i.productId) : undefined;
                let name = displayName(i);
                if (product) {
                  const k = i.name.indexOf(" · ");
                  const base = pickName(product.names, sl, product.baseName);
                  name = stripAnyPrefix(k >= 0 ? base + i.name.slice(k) : base);
                }
                return `${i.quantity ? speakQuantity(i.quantity, i.unit, sl) + " " : ""}${name}`;
              }),
            }))}
          />
          <ExportListButton
            title={activeList.name}
            groups={grouped.map((g) => ({
              label: g.label,
              items: g.items.map((i) => ({
                name: displayName(i),
                quantity: i.quantity ? relocalizeQuantity(i.quantity, i.unit) : "",
                unit: i.unit ? unitShort(i.unit) : "",
                organic: !!i.organic,
                note: i.note ?? "",
                checked: i.checked,
              })),
            }))}
          />
          <button
            onClick={() => shareList({ ...activeList, items: activeList.items.map((i) => ({ ...i, name: displayName(i), quantity: i.quantity ? relocalizeQuantity(i.quantity, i.unit) : i.quantity })) })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary active:bg-muted"
            aria-label={t("list.share")}
          >
            <ShareIcon className="h-5 w-5" />
          </button>
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

      <div className="space-y-6">
        {grouped.map((group) => {
          return (
            <div key={group.key}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-base">{group.emoji}</span>
                <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
              </div>
              <div className="divide-y divide-border rounded-2xl border border-border bg-card">
                {group.items.map((item, index) => {
                  const h = group.items.length > 5 && !item.checked && item.productId ? headingOf.get(item.productId) : undefined;
                  const prev = group.items[index - 1];
                  const showH = h && (prev?.productId ? headingOf.get(prev.productId) : undefined) !== h;
                  return (
                  <Fragment key={item.id}>
                  {showH && <div className="bg-muted/50 px-4 pb-1.5 pt-3 text-sm font-bold text-foreground">{h.name}</div>}
                  <div
                    className="relative flex items-center gap-3 py-3 pl-4 pr-4"
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
                    <div className="grid h-10 w-10 shrink-0 select-none place-items-center overflow-hidden rounded-lg bg-primary-soft/25 text-xl">
                      <ProductEmoji emoji={item.emoji} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`break-words text-sm font-medium ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
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
                    <button
                      onClick={() => removeItem(item.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-coral transition active:scale-90"
                      aria-label={t("list.remove")}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  </Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Einkauf abschliessen: archiviert abgehakte Artikel im Verlauf */}
      {doneCount > 0 && (
        <button
          onClick={finishShopping}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
        >
          {t("hist.finish", { n: doneCount })}
        </button>
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
