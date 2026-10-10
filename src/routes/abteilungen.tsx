import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDepartmentOrder } from "../hooks/use-department-order";
import { useProductOrder } from "../hooks/use-product-order";
import { toast } from "sonner";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { useListChoiceGate } from "../components/list-choice-gate";
import { usePreferredDept } from "../hooks/use-preferred-dept";
import { Button } from "../components/ui/button";
import { BoltIcon, HeartIcon, PencilIcon, PlusIcon, ScanIcon, SearchIcon, TrashIcon } from "../components/icons";
import { RenameDialog, type RenameTarget } from "../components/rename-dialog";
import { useCustomNames } from "../hooks/use-custom-names";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { deleteCustomEntry, isCustomId } from "../hooks/use-custom-catalog";
import { hideDepartment, useHiddenDepartments } from "../hooks/use-hidden-departments";
import { useHiddenProducts } from "../hooks/use-hidden-products";
import { AddEntryDialog, type AddEntryTarget } from "../components/add-entry-dialog";
import { useShoppingList } from "../hooks/use-shopping-list";
import { useDietFilter } from "../hooks/use-diet-filter";
import {
  ensureCatalog, catalogQueryOptions,
  useCatalog,
  childrenOf,
  compareByName,
  brandsFor,
  originalName,
  matchesProductSearch,
  productsOf,
  productsIn,
  type CatalogDepartment,
  type CatalogProduct,
} from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";
import { getLocale, pickName, useT } from "../i18n";
import { ProductIcon, DepartmentIcon } from "../components/catalog-icon";
import { deptColor, deptColorStrong, isNonFoodRootName, rootOf } from "../lib/dept-colors";
import { HeadingDialog, type HeadingTarget } from "../components/heading-dialog";
import { VoiceInputButton } from "../components/voice-input";
import { useIsAdmin } from "../hooks/use-is-admin";
import { Store } from "lucide-react";
import { StorePickerInline } from "../components/store-picker-inline";
import { useGroupOrder } from "../hooks/use-group-order";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { saveHeading } from "../lib/admin.functions";
import { useReferencePrices, formatRefPrice } from "../hooks/use-reference-prices";
import { useMarket } from "../hooks/use-market";
import { removePersonalVariant, usePersonalVariants } from "../hooks/use-personal-variants";
import { variantDisplayName } from "../lib/utils";


export const Route = createFileRoute("/abteilungen")({
  ssr: false,
  loader: ({ context }) => ensureCatalog(context.queryClient, getLocale()),
  head: () => ({
    meta: [
      { title: "Shoppi — Abteilungen" },
      { name: "description", content: "Produkte nach Abteilungen und Kategorien entdecken und zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Abteilungen" },
      { property: "og:description", content: "Produkte nach Abteilungen und Kategorien entdecken." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DepartmentsPage,
});

const isBio = (v: string) => v.trim().toLowerCase() === "bio";
const hasBio = (p: CatalogProduct) => p.variants.some(isBio);
const expandVariants = (p: CatalogProduct) => p.variants.filter((v) => !isBio(v));

function ProductThumb({ product }: { product: CatalogProduct }) {
  return (
    <span className="relative grid h-full w-full place-items-center">
      <ProductIcon emoji={product.emoji} iconUrl={product.iconUrl} iconPath={product.iconPath} symbolClassName="text-4xl" />
      {hasBio(product) && <span aria-label="Bio" className="absolute bottom-0 right-0 text-xs leading-none">🌿</span>}
    </span>
  );
}

// Kacheln zeigen das Originalbild statt des 64px-Icons — sonst wirkt das hochskalierte Icon ausgefranst.
function TileThumb({ product }: { product: CatalogProduct }) {
  return (
    <span className="relative grid h-full w-full place-items-center">
      <ProductIcon
        emoji={product.emoji}
        iconUrl={product.imageUrl ?? product.iconUrl}
        iconPath={product.imageUrl ? product.imagePath : product.iconPath}
        symbolClassName="text-5xl"
      />
      {hasBio(product) && <span aria-label="Bio" className="absolute bottom-1 right-1 text-xs leading-none">🌿</span>}
    </span>
  );
}

function DepartmentThumb({ department }: { department: CatalogDepartment }) {
  // Bilder in den Kategorie-Kacheln etwas grösser darstellen als im Standard.
  return <DepartmentIcon emoji={department.emoji} imageUrl={department.imageUrl ?? department.iconUrl} imagePath={department.imagePath ?? department.iconPath} className="max-h-[88%] max-w-[88%] object-contain" symbolClassName="text-[3.6rem] leading-none" />;
}

function DepartmentsPage() {
  const data = useCatalog();
  const market = useMarket();
  const hiddenIds = useHiddenDepartments();
  const hiddenProductIds = useHiddenProducts();
  const diets = useDietFilter();
  const deptIds = useMemo(() => new Set(data.departments.map((d) => d.id)), [data.departments]);
  const { products: orderedProducts, move: moveProduct } = useProductOrder(data.products, deptIds);
  const { departments: orderedDepartments, move } = useDepartmentOrder(data.departments);
  const removedIds = useMemo(() => {
    const removed = new Set(hiddenIds);
    let changed = true;
    while (changed) {
      changed = false;
      for (const department of orderedDepartments) {
        if (department.parentId && removed.has(department.parentId) && !removed.has(department.id)) {
          removed.add(department.id);
          changed = true;
        }
      }
    }
    return removed;
  }, [hiddenIds, orderedDepartments]);
  const departments = useMemo(() => orderedDepartments.filter((d) => !removedIds.has(d.id)), [orderedDepartments, removedIds]);
  const filterExemptDepartments = useMemo(() => {
    const byId = new Map(orderedDepartments.map((d) => [d.id, d]));
    return new Set(orderedDepartments.filter((d) => isNonFoodRootName(rootOf(d, byId).baseName)).map((d) => d.id));
  }, [orderedDepartments]);
  const products = useMemo(
    () => orderedProducts.filter((p) => !hiddenProductIds.includes(p.id) && !removedIds.has(p.departmentId) && (filterExemptDepartments.has(p.departmentId) || !diets.length || !p.excludedDiets.some((d) => (diets as string[]).includes(d)))),
    [orderedProducts, diets, removedIds, hiddenProductIds, filterExemptDepartments],
  );
  // Kategorien, deren Produkte durch den Filter alle wegfallen, ausblenden
  const hiddenDepts = useMemo(() => {
    const hidden = new Set<string>();
    if (!diets.length) return hidden;
    const kids = new Map<string | null, string[]>();
    for (const d of departments) kids.set(d.parentId, [...(kids.get(d.parentId) ?? []), d.id]);
    const count = (list: CatalogProduct[]) => {
      const m = new Map<string, number>();
      for (const p of list) m.set(p.departmentId, (m.get(p.departmentId) ?? 0) + 1);
      return m;
    };
    const all = count(orderedProducts), shown = count(products);
    const walk = (id: string): [number, number] => {
      let a = all.get(id) ?? 0, b = shown.get(id) ?? 0;
      for (const c of kids.get(id) ?? []) { const [x, y] = walk(c); a += x; b += y; }
      if (b === 0 && !filterExemptDepartments.has(id)) hidden.add(id);
      return [a, b];
    };
    for (const r of kids.get(null) ?? []) walk(r);
    return hidden;
  }, [departments, orderedProducts, products, diets.length, filterExemptDepartments]);
  const { t } = useT();
  const personalVariants = usePersonalVariants();
  const refPrices = useReferencePrices();
  const { addCatalogItem, isFavorite, toggleFavorite, activeList } = useShoppingList();
  const { preferred: preferredDept } = usePreferredDept();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [tileMode, setTileMode] = useState(false);
  useEffect(() => { setTileMode(localStorage.getItem("shoppi:dept-tiles") === "1"); }, []);
  const toggleTileMode = () => setTileMode((v) => { localStorage.setItem("shoppi:dept-tiles", v ? "0" : "1"); return !v; });
  const [removeTarget, setRemoveTarget] = useState<CatalogDepartment | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const customNames = useCustomNames();
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [addTarget, setAddTarget] = useState<AddEntryTarget | null>(null);
  const [headingTarget, setHeadingTarget] = useState<HeadingTarget | null>(null);
  const isAdmin = useIsAdmin();
  const [storeOpen, setStoreOpen] = useState(false);
  const { setStore } = useGroupOrder();
  const storeBarRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const saveHeadingFn = useServerFn(saveHeading);
  const headingBefore = useMemo(() => new Map(data.headings.map((h) => [h.beforeProductId, h])), [data.headings]);

  const current = departments.find((department) => department.id === currentId) ?? null;
  const deptById = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);
  useEffect(() => {
    if (currentId && removedIds.has(currentId)) setCurrentId(null);
  }, [currentId, removedIds]);
  const confirmRemove = () => {
    if (!removeTarget) return;
    if (isCustomId(removeTarget.id)) deleteCustomEntry(removeTarget.id);
    else hideDepartment(removeTarget.id);
    setRemoveTarget(null);
  };
  // Alias-Kategorien: zusätzlich unter weiteren Oberkategorien angezeigt (gleiche Kategorie, gleiche Produkte)
  const [aliasVia, setAliasVia] = useState<Record<string, string>>({}); // deptId -> Alias-Oberkategorie, über die geöffnet wurde
  const breadcrumbs = useMemo(() => {
    const byId = new Map(departments.map((d) => [d.id, d]));
    const out: CatalogDepartment[] = [];
    let cur = currentId ? byId.get(currentId) : undefined;
    let guard = 0;
    while (cur && guard++ < 20) {
      out.unshift(cur);
      const up: string | null = aliasVia[cur.id] ?? cur.parentId;
      cur = up ? byId.get(up) : undefined;
    }
    return out;
  }, [departments, currentId, aliasVia]);
  const aliasIds = new Set<string>();
  const childDepartments = (() => {
    const own = childrenOf(departments, currentId);
    if (!currentId) return own.filter((d) => !hiddenDepts.has(d.id));
    const byId = new Map(departments.map((d) => [d.id, d]));
    const aliases = (data.departmentAliases ?? [])
      .filter((a) => a.parentId === currentId)
      .map((a) => { const d = byId.get(a.departmentId); return d ? { ...d, sortOrder: a.sortOrder } : null; })
      .filter((d): d is CatalogDepartment => !!d && !own.some((o) => o.id === d.id));
    for (const a of aliases) aliasIds.add(a.id);
    return [...own, ...aliases]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((d) => !hiddenDepts.has(d.id));
  })();
  const directProducts = currentId ? productsIn(products, data.productAliases ?? [], currentId) : [];
  const aliasProductIds = new Set(directProducts.filter((p) => p.departmentId !== currentId).map((p) => p.id));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const locale = getLocale();
  const variantLabel = (product: CatalogProduct, v: string) => variantDisplayName(v, pickName(product.variantNames?.[v], locale, v));
  const matchedVariant = (product: CatalogProduct) =>
    (product.variants ?? []).find((v) => matchesProductSearch(variantLabel(product, v), normalizedQuery) || (product.variantSynonyms?.[v] ?? []).some((s) => matchesProductSearch(s, normalizedQuery)));
  const matchedSynonym = (product: CatalogProduct) =>
    (product.synonyms ?? []).find((s) => matchesProductSearch(s, normalizedQuery));
  // Bezeichnungen aus verwandten Sprachvarianten (gleicher Sprachstamm, z. B. de/de-CH/de-AT)
  const langStem = locale.split("-")[0];
  const matchedLocaleName = (product: CatalogProduct) => {
    for (const [loc, name] of Object.entries(product.names ?? {})) {
      if (loc !== locale && loc.split("-")[0] === langStem && matchesProductSearch(name, normalizedQuery)) return name;
    }
    for (const v of product.variants ?? []) {
      for (const [loc, name] of Object.entries(product.variantNames?.[v] ?? {})) {
        if (loc !== locale && loc.split("-")[0] === langStem && matchesProductSearch(name, normalizedQuery)) return name;
      }
    }
    return undefined;
  };
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    // Rang der Abteilung = Position in der Baumstruktur (Tiefensuche nach sortOrder)
    const kids = new Map<string | null, CatalogDepartment[]>();
    for (const d of departments) kids.set(d.parentId, [...(kids.get(d.parentId) ?? []), d]);
    const deptRank = new Map<string, number>();
    const walk = (pid: string | null) => {
      for (const d of [...(kids.get(pid) ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)) {
        if (deptRank.has(d.id)) continue;
        deptRank.set(d.id, deptRank.size);
        walk(d.id);
      }
    };
    walk(null);
    const order = new Map(orderedProducts.map((p, i) => [p.id, i]));
    const big = Number.MAX_SAFE_INTEGER;
    return orderedProducts
      .filter((p) => !hiddenProductIds.includes(p.id) && !removedIds.has(p.departmentId))
      .filter((product) => matchesProductSearch(product.name, normalizedQuery) || matchesProductSearch(product.baseName ?? "", normalizedQuery) || brandsFor(product, market).some((b) => matchesProductSearch(b, normalizedQuery)) || !!matchedVariant(product) || !!matchedSynonym(product) || !!matchedLocaleName(product))
      .sort((a, b) => (deptRank.get(a.departmentId) ?? big) - (deptRank.get(b.departmentId) ?? big) || (order.get(a.id) ?? big) - (order.get(b.id) ?? big));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments, orderedProducts, hiddenProductIds, removedIds, normalizedQuery, market]);

  const matchedBrand = (product: CatalogProduct) =>
    matchesProductSearch(product.name, normalizedQuery) || matchedVariant(product) ? undefined : brandsFor(product, market).find((b) => b.toLocaleLowerCase().includes(normalizedQuery));
  const synonymHint = (product: CatalogProduct) =>
    matchesProductSearch(product.name, normalizedQuery) || matchedVariant(product) || matchedBrand(product) ? undefined : matchedSynonym(product) ?? matchedLocaleName(product);

  const groupFor = (product: CatalogProduct) => {
    // Alias-Produkt in der aktuellen Kategorie → aktuelle Kategorie; Suche/Spracheingabe → bevorzugte Kategorie
    if (!normalizedQuery && currentId && aliasProductIds.has(product.id)) return departments.find((d) => d.id === currentId) ?? current;
    const pref = preferredDept[product.id];
    if (pref && (pref === product.departmentId || (data.productAliases ?? []).some((a) => a.productId === product.id && a.departmentId === pref))) {
      const d = departments.find((x) => x.id === pref);
      if (d) return d;
    }
    return departments.find((department) => department.id === product.departmentId) ?? current;
  };

  // ---- Drag & Drop für Kategorien und Artikel (langes Drücken) ----
  type DropTarget = { kind: "before" | "after" | "into"; id: string | null };
  type DragState = { what: "dept" | "product" | "heading"; id: string; name: string; x: number; y: number; target: DropTarget | null };
  const [drag, setDrag] = useState<DragState | null>(null);
  const pressRef = useRef<{ timer: number; x: number; y: number; what: "dept" | "product" | "heading"; id: string; name: string } | null>(null);
  const suppressClick = useRef(false);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const findTarget = (x: number, y: number, dragged: { what: "dept" | "product" | "heading"; id: string }): DropTarget | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]");
    if (!el) return null;
    const id = el.dataset["id"] || null;
    const drop = el.dataset["drop"];
    if (drop === "crumb") return dragged.what === "heading" ? null : { kind: "into", id };
    if (id === dragged.id) return null;
    const r = el.getBoundingClientRect();
    if (drop === "heading") {
      // Auf Überschrift ablegen → direkt unter die Überschrift (nach dem Anker-Produkt)
      if (dragged.what !== "product") return null;
      return { kind: "after", id };
    }
    if (drop === "product") {
      if (dragged.what === "dept") return null;
      const fy = (y - r.top) / r.height;
      return { kind: fy < 0.5 ? "before" : "after", id };
    }
    const fx = (x - r.left) / r.width;
    return { kind: fx < 0.28 ? "before" : fx > 0.72 ? "after" : "into", id };
  };

  const cancelPress = () => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  };

  const startPress = (event: React.PointerEvent, entry: { id: string; name: string }, what: "dept" | "product" | "heading" = "dept") => {
    if (event.button !== 0) return;
    const { clientX: x, clientY: y } = event;
    cancelPress();
    pressRef.current = {
      x, y, what, id: entry.id, name: entry.name,
      timer: window.setTimeout(() => {
        pressRef.current = null;
        navigator.vibrate?.(30);
        setDrag({ what, id: entry.id, name: entry.name, x, y, target: null });
      }, 420),
    };
  };

  const pressMove = (event: React.PointerEvent) => {
    const p = pressRef.current;
    if (!p || Math.hypot(event.clientX - p.x, event.clientY - p.y) <= 8) return;
    if (p.what === "product") {
      // Ziehen am Listen-Icon: sofort verschieben
      cancelPress();
      try { (event.currentTarget as Element).releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
      const d = { what: p.what, id: p.id, name: p.name };
      setDrag({ ...d, x: event.clientX, y: event.clientY, target: findTarget(event.clientX, event.clientY, d) });
      return;
    }
    cancelPress();
  };

  useEffect(() => {
    if (!drag) return;
    let lastY = drag.y;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      lastY = e.clientY;
      setDrag({ ...d, x: e.clientX, y: e.clientY, target: findTarget(e.clientX, e.clientY, d) });
    };
    // Automatisches Scrollen am oberen/unteren Rand
    const scrollTimer = window.setInterval(() => {
      const edge = 80;
      const h = window.innerHeight;
      const dy = lastY < edge ? -Math.ceil((edge - lastY) / 6) : lastY > h - edge ? Math.ceil((lastY - (h - edge)) / 6) : 0;
      if (!dy) return;
      window.scrollBy(0, dy);
      const d = dragRef.current;
      if (d) setDrag({ ...d, target: findTarget(d.x, d.y, d) });
    }, 16);
    const onUp = () => {
      const d = dragRef.current;
      setDrag(null);
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 50);
      if (!d?.target) return;
      const { kind, id } = d.target;
      if (d.what === "heading") {
        const heading = data.headings.find((h) => h.id === d.id);
        if (!heading || !id) return;
        const list = productsOf(products, heading.departmentId);
        const i = list.findIndex((p) => p.id === id);
        const anchor = kind === "after" ? list[i + 1] ?? list[i] : list[i];
        if (!anchor || anchor.id === heading.beforeProductId) return;
        void saveHeadingFn({ data: { id: heading.id, departmentId: heading.departmentId, beforeProductId: anchor.id } })
          .then(() => queryClient.invalidateQueries({ queryKey: ["catalog"] }))
          .catch((e) => toast.error(String(e?.message ?? e)));
        return;
      }
      if (d.what === "product") {
        if (kind === "into") {
          if (!id) return;
          const dragged = products.find((p) => p.id === d.id);
          if (dragged?.departmentId === id) return;
          moveProduct(d.id, id);
          const name = departments.find((dep) => dep.id === id)?.name;
          toast.success(t("dept.moved", { name: d.name, target: name ?? "" }));
          return;
        }
        const target = products.find((p) => p.id === id);
        if (!target) return;
        const siblings = productsOf(products, target.departmentId).filter((p) => p.id !== d.id);
        const index = siblings.findIndex((p) => p.id === target.id) + (kind === "after" ? 1 : 0);
        moveProduct(d.id, target.departmentId, index);
        return;
      }
      if (kind === "into") {
        const dragged = departments.find((dep) => dep.id === d.id);
        if (dragged?.parentId === id) return;
        const ok = move(d.id, id);
        const name = id ? departments.find((dep) => dep.id === id)?.name : t("dept.allDepartments");
        if (ok) toast.success(t("dept.moved", { name: d.name, target: name ?? "" }));
        else toast.error(t("dept.moveSelf"));
        return;
      }
      const target = departments.find((dep) => dep.id === id);
      if (!target) return;
      const siblings = childrenOf(departments, target.parentId).filter((dep) => dep.id !== d.id);
      const index = siblings.findIndex((dep) => dep.id === target.id) + (kind === "after" ? 1 : 0);
      move(d.id, target.parentId, index);
    };
    const block = (e: TouchEvent) => e.preventDefault();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("touchmove", block, { passive: false });
    return () => {
      window.clearInterval(scrollTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchmove", block);
    };
  }, [drag?.id, departments, products, move, moveProduct, t, data.headings, saveHeadingFn, queryClient]);

  const openDepartment = (id: string | null, via?: string) => {
    if (id) setAliasVia((prev) => {
      const next = { ...prev };
      if (via) next[id] = via; else if (!breadcrumbs.some((b) => b.id === id)) delete next[id];
      return next;
    });
    setCurrentId(id);
    setQuery("");
    if (id === null) window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const reset = () => {
      setCurrentId(null);
      setQuery("");
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("shoppi:abteilungen-reset", reset);
    return () => window.removeEventListener("shoppi:abteilungen-reset", reset);
  }, []);

  // Ladenwahl-Popup bei Klick ausserhalb des Suchleisten-Bereichs schliessen
  useEffect(() => {
    if (!storeOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!storeBarRef.current?.contains(e.target as Node)) setStoreOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [storeOpen]);

  const quickAdd = (product: CatalogProduct, group: CatalogDepartment | null, variant?: string) => {
    const name = variant ? `${product.name} · ${variantLabel(product, variant)}` : product.name;
    const vi = variant ? product.variantImages?.[variant] : undefined;
    addCatalogItem({
      productId: product.id,
      departmentId: product.departmentId,
      name,
      quantity: formatQuantity(product.defaultQuantity, product.defaultUnit),
      unit: product.defaultUnit,
      organic: false,
      emoji: product.emoji,
      imageUrl: vi?.imageUrl ?? product.imageUrl,
      groupLabel: group?.name,
      groupEmoji: group?.emoji ?? undefined,
    });
    toast.success(activeList?.name ? t("common.addedToNamedList", { name, list: activeList.name }) : t("common.addedToList", { name }));
  };
  const quickAddRef = useRef(quickAdd);
  quickAddRef.current = quickAdd;
  const { gate, dialog: listChoiceDialog } = useListChoiceGate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpanded = (id: string) => {
    setExpandedId((previous) => previous === id ? null : id);
  };

  /** Gesprochene Zutaten im Katalog finden und hinzufügen. */
  const handleVoiceResult = (text: string) => {
    const tokens = text
      .split(/[,;+]|\s+und\s+|\s+plus\s+/i)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);
    let added = 0;
    for (const token of tokens) {
      const q = token.toLocaleLowerCase();
      const product =
        products.find((p) => p.name.toLocaleLowerCase() === q) ??
        products.find((p) => matchesProductSearch(p.name, q));
      const synHit = product ? undefined : products.flatMap((p) => Object.entries(p.variantSynonyms ?? {}).filter(([v, terms]) => p.variants.includes(v) && terms.some((s) => s.toLocaleLowerCase() === q)).map(([v]) => ({ p, v })))[0];
      if (synHit) {
        quickAdd(synHit.p, groupFor(synHit.p), synHit.v);
        added += 1;
      } else if (product) {
        quickAdd(product, groupFor(product));
        added += 1;
      }
    }
    if (added > 0) toast.success(t("voice.added", { n: added }));
    else toast.error(t("voice.noMatch"));
  };

  const shownProducts = normalizedQuery ? searchResults : directProducts;

  return (
    <div className="space-y-5">
      {drag && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[120%] rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg"
          style={{ left: drag.x, top: drag.y }}
        >
          {drag.name}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("nav.departments")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dept.subtitle")}</p>
      </div>

      <div ref={storeBarRef} className="space-y-2">
        <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 shadow-sm">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("dept.search")}
            aria-label={t("dept.search")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <VoiceInputButton
            onResult={handleVoiceResult}
            className="shrink-0 rounded-lg p-1 text-primary transition active:bg-muted"
          />
          <button
            type="button"
            onClick={() => setStoreOpen((open) => !open)}
            aria-label={t("store.label")}
            aria-expanded={storeOpen}
            className={`shrink-0 rounded-lg p-1 text-primary transition active:bg-muted ${storeOpen ? "bg-primary-soft/60" : ""}`}
          >
            <Store className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <StorePickerInline
          open={storeOpen}
          onPick={(id) => {
            setStore(id);
            setStoreOpen(false);
          }}
          onClose={() => setStoreOpen(false)}
        />
      </div>

      {!normalizedQuery && breadcrumbs.length > 0 && (
        <nav aria-label={t("dept.breadcrumb")} className="no-scrollbar flex items-center gap-1 overflow-x-auto text-xs">
          <Button type="button" variant="ghost" size="sm" onClick={() => openDepartment(null)} data-drop="crumb" data-id="" className={`shrink-0 px-2 text-muted-foreground ${drag?.target?.kind === "into" && drag.target.id === null ? "ring-2 ring-primary" : ""}`}>
            {t("dept.all")}
          </Button>
          {breadcrumbs.map((department, index) => (
            <div key={department.id} className="flex shrink-0 items-center gap-1">
              <span className="text-muted-foreground" aria-hidden="true">›</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openDepartment(department.id)}
                data-drop="crumb"
                data-id={department.id}
                className={`${index === breadcrumbs.length - 1 ? "px-2 font-semibold text-primary" : "px-2 text-muted-foreground"} ${drag?.target?.kind === "into" && drag.target.id === department.id ? "ring-2 ring-primary" : ""}`}
              >
                {department.name}
              </Button>
            </div>
          ))}
        </nav>
      )}

      {!normalizedQuery && !!(current?.imagePath || current?.iconPath) && (
        <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-muted">
          <DepartmentIcon emoji={current.emoji} imageUrl={current.imageUrl ?? current.iconUrl} imagePath={current.imagePath ?? current.iconPath} className="h-full w-full object-cover" />
        </div>
      )}

      {!normalizedQuery && childDepartments.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-base font-semibold text-foreground">{current ? t("dept.categories") : t("dept.allDepartments")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {childDepartments.map((department) => {
              const dropKind = drag?.target?.id === department.id ? drag.target.kind : null;
              // Alias-Kacheln erben die Farbe der Oberkategorie, unter der sie gerade angezeigt werden.
              const tileVia = aliasIds.has(department.id) && currentId ? { ...aliasVia, [department.id]: currentId } : aliasVia;
              const tileColor = deptColor(department, deptById, tileVia);
              const tileStrong = deptColorStrong(department, deptById, tileVia);
              return (
              <div key={department.id} className="group relative min-w-0">
              <Button
                type="button"
                variant="ghost"
                data-drop="tile"
                data-id={department.id}
                
                onPointerMove={pressMove}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                onClick={() => { if (!suppressClick.current) openDepartment(department.id, aliasIds.has(department.id) ? currentId ?? undefined : undefined); }}
                style={{ WebkitTouchCallout: "none", ...(tileStrong ? { "--tile-strong": tileStrong } : {}) } as React.CSSProperties}
                className={`group/tile relative w-full select-none ${drag?.id === department.id ? "opacity-40" : ""} ${dropKind === "into" ? "ring-2 ring-primary" : ""} ${dropKind === "before" ? "!border-l-4 !border-l-primary" : ""} ${dropKind === "after" ? "!border-r-4 !border-r-primary" : ""} h-auto min-w-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 text-left shadow-sm active:scale-[0.98]`}
              >
                <span
                  className={`grid aspect-[4/3] w-full place-items-center overflow-hidden ${tileColor ? "" : "bg-primary-soft/25"}`}
                  style={tileColor ? { backgroundColor: tileColor } : undefined}
                >
                  <DepartmentThumb department={department} />
                </span>
                <span className="flex min-h-14 w-full items-center justify-center gap-2 bg-background px-3 py-2 transition-colors group-hover/tile:bg-[var(--tile-strong)]">
                  <span className="min-w-0 text-center whitespace-normal text-[13px] font-bold leading-4 text-foreground">{department.name}</span>
                </span>
              </Button>
              </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("dept.tip")}</p>
          <Button type="button" variant="outline" onClick={() => setAddTarget({ kind: "department", parentId: currentId, parentName: current?.name })} className="mt-3 w-full rounded-xl">
            <PlusIcon className="h-4 w-4" /> {t("add.category")}
          </Button>
        </section>
      )}

      {(normalizedQuery || shownProducts.length > 0) && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">{normalizedQuery ? t("common.searchResults") : t("dept.products")}</h2>
            <div className="flex overflow-hidden rounded-lg border border-border text-xs font-medium">
              <button type="button" onClick={() => tileMode && toggleTileMode()} aria-pressed={!tileMode} className={`px-2.5 py-1 ${!tileMode ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{t("dept.viewList")}</button>
              <button type="button" onClick={() => !tileMode && toggleTileMode()} aria-pressed={tileMode} className={`px-2.5 py-1 ${tileMode ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{t("dept.viewTiles")}</button>
            </div>
          </div>
          {tileMode ? (
            <div className="grid grid-cols-2 gap-2.5">
              {shownProducts.map((product) => {
                const group = groupFor(product);
                const favorite = isFavorite(product.id);
                return (
                  <div key={product.id} className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <button type="button" aria-label={product.name} onClick={() => navigate({ to: "/produkt/$id", params: { id: product.id } })} className="grid aspect-square w-full place-items-center overflow-hidden bg-primary-soft/25">
                      <TileThumb product={product} />
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={favorite ? t("common.removeFavorite", { name: product.name }) : t("common.addFavorite", { name: product.name })}
                      onClick={() => toggleFavorite({
                        productId: product.id,
                        name: product.name,
                        emoji: product.emoji,
                        imageUrl: product.imageUrl,
                        defaultQuantity: product.defaultQuantity,
                        defaultUnit: product.defaultUnit,
                        organicAvailable: product.organicAvailable,
                        groupLabel: group?.name,
                        groupEmoji: group?.emoji ?? undefined,
                      })}
                      className={`absolute left-1 top-1 h-8 w-8 ${favorite ? "rounded-full bg-coral/15 text-coral" : "rounded-full bg-background/60 text-muted-foreground"}`}
                    >
                      <HeartIcon className={`h-3.5 w-3.5 ${favorite ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("common.quickAdd", { name: product.name })}
                      onClick={() => gate(() => quickAddRef.current(product, group))}
                      className="absolute right-1 top-1 h-8 w-8 rounded-full bg-background/60 text-muted-foreground"
                    >
                      <BoltIcon className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex min-h-12 flex-1 items-center gap-1 px-1.5 py-1.5">
                      <div className="min-w-0 flex-1 text-center">
                        <span className="line-clamp-2 text-xs font-semibold leading-4 text-foreground">{product.name}</span>
                        {normalizedQuery && group && <span className="block truncate text-[10px] text-muted-foreground">{group.name}</span>}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        aria-label={t("common.addWithQty", { name: product.name })}
                        onClick={() => { const b = normalizedQuery ? matchedBrand(product) : undefined; gate(() => { setSelectedBrand(b); setSelectedVariant(undefined); setSelectedProduct(product); }); }}
                        className="h-8 w-8 shrink-0 rounded-full shadow-none"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {shownProducts.map((product, index) => {
              // Überschrift steht immer direkt vor ihrem Anker-Produkt (auch nach lokaler Umsortierung)
              const heading = !normalizedQuery ? headingBefore.get(product.id) : undefined;
              const showHeading = !!heading;
              void index;
              const group = groupFor(product);
              const favorite = isFavorite(product.id);
              const pt = drag?.what === "product" && drag.target?.id === product.id ? drag.target.kind : null;
              const draggable = !normalizedQuery && !aliasProductIds.has(product.id);
              const headingDrop = drag?.what === "product" && heading && drag.target?.id === heading.beforeProductId && drag.target.kind === "after" && drag.id !== heading.beforeProductId;
              return (
                <Fragment key={product.id}>
                {showHeading && heading && (
                  <div
                    data-drop={draggable ? "heading" : undefined}
                    data-id={heading.beforeProductId}
                    onPointerDown={isAdmin ? (e) => startPress(e, heading, "heading") : undefined}
                    onPointerMove={isAdmin ? pressMove : undefined}
                    onPointerUp={isAdmin ? cancelPress : undefined}
                    onPointerLeave={isAdmin ? cancelPress : undefined}
                    onContextMenu={isAdmin ? (e) => e.preventDefault() : undefined}
                    onClick={() => { if (isAdmin && !suppressClick.current) setHeadingTarget({ departmentId: heading.departmentId, products: directProducts, heading }); }}
                    className={`select-none bg-primary-soft/25 px-3 pb-1.5 pt-3 text-sm font-bold text-foreground ${isAdmin ? "cursor-pointer" : ""} ${drag?.what === "heading" && drag.id === heading.id ? "opacity-40" : ""} ${headingDrop ? "ring-2 ring-inset ring-primary" : ""}`}
                  >
                    {heading.name}
                  </div>
                )}
                <div
                  data-drop={draggable ? "product" : undefined}
                  data-id={product.id}
                  onClickCapture={(e) => { if (suppressClick.current) { e.stopPropagation(); e.preventDefault(); } }}
                  className={`cv-row flex min-h-16 select-none items-center gap-2.5 px-2.5 py-2 ${drag?.what === "product" && drag.id === product.id ? "opacity-40" : ""} ${pt === "before" ? "!border-t-2 !border-t-primary" : ""} ${pt === "after" && !headingDrop ? "!border-b-2 !border-b-primary" : ""}`}
                >
                  <button
                    type="button"
                    aria-label={product.name}
                    onPointerDown={draggable ? (e) => startPress(e, product, "product") : undefined}
                    onPointerMove={draggable ? pressMove : undefined}
                    onPointerUp={draggable ? cancelPress : undefined}
                    onPointerLeave={draggable ? cancelPress : undefined}
                    onContextMenu={draggable ? (e) => e.preventDefault() : undefined}
                    aria-expanded={expandVariants(product).length > 0 ? expandedId === product.id : undefined}
                    onClick={() => {
                      if (suppressClick.current) return;
                      navigate({ to: "/produkt/$id", params: { id: product.id } });
                    }}
                    className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary-soft/25 ${draggable ? "cursor-grab touch-none" : "cursor-pointer"}`}
                  >
                    <ProductThumb product={product} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => navigate({ to: "/produkt/$id", params: { id: product.id } })} className="inline-flex max-w-full text-left text-sm font-semibold text-foreground">
                      <span className="truncate">{product.name}</span>
                    </button>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                       {normalizedQuery && synonymHint(product) ? `${t("search.alsoKnownAs", { name: synonymHint(product)! })} · ` : ""}{normalizedQuery && matchedBrand(product) ? `${matchedBrand(product)} · ` : ""}{normalizedQuery && !matchesProductSearch(product.name, normalizedQuery) && matchedVariant(product) ? `${variantLabel(product, matchedVariant(product)!)} · ` : ""}{normalizedQuery && group ? `${group.name} · ` : ""}{formatQuantity(product.defaultQuantity, product.defaultUnit)}
                       {refPrices.data?.get(product.id) ? ` · ${formatRefPrice(refPrices.data.get(product.id)!)}` : ""}
                    </p>
                    {expandVariants(product).length > 0 && (
                      <button type="button" onClick={() => toggleExpanded(product.id)} aria-expanded={expandedId === product.id} aria-label={t("dept.variants", { count: expandVariants(product).length })} className="mt-0.5 block max-w-full truncate text-left text-xs font-medium text-primary">
                        {t("dept.variants", { count: expandVariants(product).length })} {expandedId === product.id ? "▴" : "▾"}
                      </button>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 -mr-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={favorite ? t("common.removeFavorite", { name: product.name }) : t("common.addFavorite", { name: product.name })}
                    onClick={() => toggleFavorite({
                      productId: product.id,
                      name: product.name,
                      emoji: product.emoji,
                      imageUrl: product.imageUrl,
                      defaultQuantity: product.defaultQuantity,
                      defaultUnit: product.defaultUnit,
                      organicAvailable: product.organicAvailable,
                      groupLabel: group?.name,
                      groupEmoji: group?.emoji ?? undefined,
                    })}
                    className={`h-8 w-8 ${favorite ? "rounded-full bg-coral/15 text-coral" : "rounded-full text-muted-foreground"}`}
                  >
                    <HeartIcon className={`h-3.5 w-3.5 ${favorite ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("common.quickAdd", { name: product.name })}
                    onClick={() => gate(() => quickAddRef.current(product, group))}
                    className="h-8 w-8 rounded-full text-muted-foreground"
                  >
                    <BoltIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    aria-label={t("common.addWithQty", { name: product.name })}
                    onClick={() => { const b = normalizedQuery ? matchedBrand(product) : undefined; gate(() => { setSelectedBrand(b); setSelectedVariant(undefined); setSelectedProduct(product); }); }}
                    className="h-8 w-8 rounded-full shadow-none"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </Button>
                  <span aria-hidden className="w-1.5 shrink-0" />
                  </div>
                </div>
                {expandedId === product.id && (
                  <div className="border-t border-dashed border-border bg-muted/30 py-1 pl-8 pr-2.5">
                    {expandVariants(product).map((v) => {
                      const vi = product.variantImages?.[v];
                      const vName = variantLabel(product, v);
                      const vFav = isFavorite(`${product.id}::${v}`);
                      return (
                        <div key={v} className="flex items-center gap-2.5 py-1.5">
                          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-primary-soft/25">
                            <ProductIcon emoji={product.emoji} iconUrl={vi?.iconUrl ?? vi?.imageUrl ?? product.iconUrl} iconPath={vi?.iconPath ?? vi?.imagePath ?? product.iconPath} symbolClassName="text-2xl" />
                          </div>
                          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{vName}</span>
                          {(personalVariants[product.id] ?? []).includes(v) && (
                            <Button type="button" variant="ghost" size="icon" aria-label={t("dept.removeVariant", { name: vName })} title={t("dept.removeVariant", { name: vName })} onClick={() => removePersonalVariant(product.id, v)} className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                              <TrashIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <div className="flex shrink-0 items-center gap-0.5 -mr-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={vFav ? t("common.removeFavorite", { name: `${product.name} · ${vName}` }) : t("common.addFavorite", { name: `${product.name} · ${vName}` })}
                              onClick={() => toggleFavorite({
                                productId: `${product.id}::${v}`,
                                name: `${product.name} · ${vName}`,
                                emoji: product.emoji,
                                imageUrl: vi?.imageUrl ?? product.imageUrl ?? undefined,
                                defaultQuantity: product.defaultQuantity,
                                defaultUnit: product.defaultUnit,
                                organicAvailable: product.organicAvailable,
                                groupLabel: group?.name,
                                groupEmoji: group?.emoji ?? undefined,
                              })}
                              className={`h-8 w-8 ${vFav ? "rounded-full bg-coral/15 text-coral" : "rounded-full text-muted-foreground"}`}
                            >
                              <HeartIcon className={`h-3.5 w-3.5 ${vFav ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("common.quickAdd", { name: `${product.name} · ${vName}` })}
                              onClick={() => gate(() => quickAddRef.current(product, group, v))}
                              className="h-8 w-8 rounded-full text-muted-foreground"
                            >
                              <BoltIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              aria-label={t("common.addWithQty", { name: `${product.name} · ${vName}` })}
                              onClick={() => gate(() => { setSelectedBrand(undefined); setSelectedVariant(v); setSelectedProduct(product); })}
                              className="h-8 w-8 rounded-full shadow-none"
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                            </Button>
                            <span aria-hidden className="w-1.5 shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </Fragment>
              );
            })}
          </div>
          )}
          {!normalizedQuery && currentId && (
            <Button type="button" variant="outline" onClick={() => setAddTarget({ kind: "product", parentId: currentId, parentName: current?.name })} className="mt-3 w-full rounded-xl">
              <PlusIcon className="h-4 w-4" /> {t("add.product")}
            </Button>
          )}
          {!normalizedQuery && currentId && isAdmin && directProducts.length > 0 && (
            <Button type="button" variant="outline" onClick={() => setHeadingTarget({ departmentId: currentId, products: directProducts })} className="mt-2 w-full rounded-xl">
              <PlusIcon className="h-4 w-4" /> {t("heading.add")}
            </Button>
          )}
        </section>
      )}
      <AddEntryDialog target={addTarget} onClose={() => setAddTarget(null)} />
      <RenameDialog target={renameTarget} onClose={() => setRenameTarget(null)} />
      <HeadingDialog target={headingTarget} onClose={() => setHeadingTarget(null)} />

      <Link to="/scanner" className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/30 py-3 text-sm font-semibold text-primary transition active:scale-[0.98]">
        <ScanIcon className="h-5 w-5" />
        {t("dept.scan")}
      </Link>

      {normalizedQuery && shownProducts.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl" aria-hidden="true">🔎</div>
          <p className="mt-3 text-sm font-medium text-foreground">{t("dept.noProduct")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("common.tryOther")}</p>
        </div>
      )}

      {!normalizedQuery && childDepartments.length === 0 && directProducts.length === 0 && (
        <>
          <div className={`grid gap-2 ${currentId ? "grid-cols-2" : "grid-cols-1"}`}>
            <Button type="button" variant="outline" onClick={() => setAddTarget({ kind: "department", parentId: currentId, parentName: current?.name })} className="rounded-xl">
              <PlusIcon className="h-4 w-4" /> {t("add.category")}
            </Button>
            {currentId && (
              <Button type="button" variant="outline" onClick={() => setAddTarget({ kind: "product", parentId: currentId, parentName: current?.name })} className="rounded-xl">
                <PlusIcon className="h-4 w-4" /> {t("add.product")}
              </Button>
            )}
          </div>
          <div className="py-6 text-center text-sm text-muted-foreground">{t("dept.empty")}</div>
        </>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dept.removeTitle", { name: removeTarget?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t(isCustomId(removeTarget?.id ?? "") ? "dept.deleteDescription" : "dept.hideDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("dept.removeConfirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {listChoiceDialog}
      <CatalogProductDialog
        product={selectedProduct}
        groupLabel={selectedProduct ? groupFor(selectedProduct)?.name : undefined}
        groupEmoji={selectedProduct ? groupFor(selectedProduct)?.emoji : undefined}
        initialDepartmentId={selectedProduct ? groupFor(selectedProduct)?.id : undefined}
        initialBrand={selectedBrand}
        initialVariant={selectedVariant}
        onOpenChange={(open) => { if (!open) { setSelectedProduct(null); setSelectedVariant(undefined); } }}
      />
    </div>
  );
}
