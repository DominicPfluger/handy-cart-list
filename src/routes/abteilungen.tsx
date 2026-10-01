import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useDepartmentOrder } from "../hooks/use-department-order";
import { useProductOrder } from "../hooks/use-product-order";
import { toast } from "sonner";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { Button } from "../components/ui/button";
import { BoltIcon, HeartIcon, PlusIcon, ScanIcon, SearchIcon, TrashIcon } from "../components/icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { deleteCustomEntry, isCustomId } from "../hooks/use-custom-catalog";
import { hideDepartment, useHiddenDepartments } from "../hooks/use-hidden-departments";
import { useHiddenProducts } from "../hooks/use-hidden-products";
import { RenameDialog, type RenameTarget } from "../components/rename-dialog";
import { AddEntryDialog, type AddEntryTarget } from "../components/add-entry-dialog";
import { useCustomNames } from "../hooks/use-custom-names";
import { useShoppingList } from "../hooks/use-shopping-list";
import { DIETS, DIET_EMOJI, setDiets, toggleDiet, useDietFilter } from "../hooks/use-diet-filter";
import { setCuisines, toggleCuisine, useCuisineFilter } from "../hooks/use-cuisine-filter";
import {
  catalogQueryOptions,
  useCatalog,
  childrenOf,
  compareByName,
  brandsFor,
  matchesProductSearch,
  originalName,
  pathTo,
  productsOf,
  type CatalogDepartment,
  type CatalogProduct,
} from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";
import { useT } from "../i18n";
import { ProductEmoji } from "../components/product-emoji";
import { HeadingDialog, type HeadingTarget } from "../components/heading-dialog";
import { VoiceInputButton } from "../components/voice-input";
import { useIsAdmin } from "../hooks/use-is-admin";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { saveHeading } from "../lib/admin.functions";


export const Route = createFileRoute("/abteilungen")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
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

function ProductThumb({ product }: { product: CatalogProduct }) {
  return <ProductEmoji emoji={product.emoji} className="text-3xl" />;
}

function DepartmentThumb({ department }: { department: CatalogDepartment }) {
  if (department.imageUrl) {
    return <img src={department.imageUrl} alt="" draggable={false} className="max-h-[74%] max-w-[74%] object-contain" />;
  }
  return <span className="text-5xl" aria-hidden="true">{department.emoji ?? "🧺"}</span>;
}

function DepartmentsPage() {
  const data = useCatalog();
  const hiddenIds = useHiddenDepartments();
  const hiddenProductIds = useHiddenProducts();
  const diets = useDietFilter();
  const [dietOpen, setDietOpen] = useState(false);
  const cuisineSel = useCuisineFilter();
  const cuisines = useMemo(() => cuisineSel.filter((id) => data.cuisines.some((c) => c.id === id)), [cuisineSel, data.cuisines]);
  const [cuisineOpen, setCuisineOpen] = useState(false);
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
  const products = useMemo(
    () => orderedProducts.filter((p) => !hiddenProductIds.includes(p.id) && !removedIds.has(p.departmentId) && (!diets.length || !p.excludedDiets.some((d) => (diets as string[]).includes(d))) && (!cuisines.length || p.cuisineIds.some((c) => cuisines.includes(c)))),
    [orderedProducts, diets, cuisines, removedIds, hiddenProductIds],
  );
  // Kategorien, deren Produkte durch den Filter alle wegfallen, ausblenden
  const hiddenDepts = useMemo(() => {
    const hidden = new Set<string>();
    if (!diets.length && !cuisines.length) return hidden;
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
      if (b === 0) hidden.add(id);
      return [a, b];
    };
    for (const r of kids.get(null) ?? []) walk(r);
    return hidden;
  }, [departments, orderedProducts, products, diets.length, cuisines.length]);
  const { t } = useT();
  const { addCatalogItem, isFavorite, toggleFavorite } = useShoppingList();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CatalogDepartment | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [addTarget, setAddTarget] = useState<AddEntryTarget | null>(null);
  const [headingTarget, setHeadingTarget] = useState<HeadingTarget | null>(null);
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const saveHeadingFn = useServerFn(saveHeading);
  const headingBefore = useMemo(() => new Map(data.headings.map((h) => [h.beforeProductId, h])), [data.headings]);
  const customNames = useCustomNames();
  const openRename = (e: CatalogDepartment | CatalogProduct, kind: "product" | "department") =>
    setRenameTarget({ id: e.id, name: e.name, originalName: originalName(e), isCustom: e.id in customNames, kind });

  const current = departments.find((department) => department.id === currentId) ?? null;
  useEffect(() => {
    if (currentId && removedIds.has(currentId)) setCurrentId(null);
  }, [currentId, removedIds]);
  const confirmRemove = () => {
    if (!removeTarget) return;
    if (isCustomId(removeTarget.id)) deleteCustomEntry(removeTarget.id);
    else hideDepartment(removeTarget.id);
    setRemoveTarget(null);
  };
  const breadcrumbs = pathTo(departments, currentId);
  const childDepartments = childrenOf(departments, currentId).filter((d) => !hiddenDepts.has(d.id));
  const directProducts = currentId ? productsOf(products, currentId) : [];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const order = new Map(orderedProducts.map((p, i) => [p.id, i]));
    return products
      .filter((product) => matchesProductSearch(product.name, normalizedQuery) || brandsFor(product).some((b) => b.toLocaleLowerCase().includes(normalizedQuery)))
      .sort((a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  }, [products, orderedProducts, normalizedQuery]);

  const matchedBrand = (product: CatalogProduct) =>
    matchesProductSearch(product.name, normalizedQuery) ? undefined : brandsFor(product).find((b) => b.toLocaleLowerCase().includes(normalizedQuery));

  const groupFor = (product: CatalogProduct) =>
    departments.find((department) => department.id === product.departmentId) ?? current;

  // ---- Drag & Drop für Kategorien und Artikel (langes Drücken) ----
  type DropTarget = { kind: "before" | "after" | "into"; id: string | null };
  type DragState = { what: "dept" | "product" | "heading"; id: string; name: string; x: number; y: number; target: DropTarget | null };
  const [drag, setDrag] = useState<DragState | null>(null);
  const pressRef = useRef<{ timer: number; x: number; y: number } | null>(null);
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
      x, y,
      timer: window.setTimeout(() => {
        pressRef.current = null;
        navigator.vibrate?.(30);
        setDrag({ what, id: entry.id, name: entry.name, x, y, target: null });
      }, 420),
    };
  };

  const pressMove = (event: React.PointerEvent) => {
    const p = pressRef.current;
    if (p && Math.hypot(event.clientX - p.x, event.clientY - p.y) > 8) cancelPress();
  };

  const startDragNow = (event: React.PointerEvent, entry: { id: string; name: string }, what: "product" | "heading") => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    cancelPress();
    setDrag({ what, id: entry.id, name: entry.name, x: event.clientX, y: event.clientY, target: null });
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

  const openDepartment = (id: string | null) => {
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

  const quickAdd = (product: CatalogProduct, group: CatalogDepartment | null) => {
    addCatalogItem({
      productId: product.id,
      name: product.name,
      quantity: formatQuantity(product.defaultQuantity, product.defaultUnit),
      unit: product.defaultUnit,
      organic: false,
      emoji: product.emoji,
      imageUrl: product.imageUrl,
      groupLabel: group?.name,
      groupEmoji: group?.emoji ?? undefined,
    });
    toast.success(t("common.addedToList", { name: product.name }));
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
      if (product) {
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
          onClick={() => { setDietOpen((v) => !v); setCuisineOpen(false); }}
          aria-expanded={dietOpen}
          aria-label={t("diet.filter")}
          title={`${t("diet.filter")}${diets.length ? ` · ${diets.length}` : ""}`}
          className={`shrink-0 rounded-lg px-0.5 py-1.5 text-base leading-none ${diets.length ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
        >
          🥗
        </button>
        <button
          type="button"
          onClick={() => { setCuisineOpen((v) => !v); setDietOpen(false); }}
          aria-expanded={cuisineOpen}
          aria-label={t("cuisine.filter")}
          title={`${t("cuisine.filter")}${cuisines.length ? ` · ${cuisines.length}` : ""}`}
          className={`shrink-0 rounded-lg px-0.5 py-1.5 text-base leading-none ${cuisines.length ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
        >
          🌍
        </button>
      </div>

      {cuisineOpen && (
        <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-1 text-sm font-semibold text-foreground">{t("cuisine.title")}</div>
          <p className="mb-3 text-xs text-muted-foreground">{t("cuisine.hint")}</p>
          <div className="flex flex-wrap gap-2">
            {data.cuisines.map((c) => {
              const on = cuisines.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCuisine(c.id)}
                  className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium leading-none ${on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-foreground"}`}
                >
                  {c.emoji && <span className="text-base leading-none">{c.emoji}</span>}
                  {c.name}
                </button>
              );
            })}
          </div>
          {cuisines.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="mt-2 px-2 text-primary" onClick={() => setCuisines([])}>
              {t("diet.reset")}
            </Button>
          )}
        </section>
      )}

      {dietOpen && (
        <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-1 text-sm font-semibold text-foreground">{t("diet.title")}</div>
          <p className="mb-3 text-xs text-muted-foreground">{t("diet.hint")}</p>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((d) => {
              const on = diets.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDiet(d)}
                  className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium leading-none ${on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-foreground"}`}
                >
                  <span className="text-base leading-none">{DIET_EMOJI[d]}</span>
                  {t(`diet.${d}`)}
                </button>
              );
            })}
          </div>
          {diets.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="mt-2 px-2 text-primary" onClick={() => setDiets([])}>
              {t("diet.reset")}
            </Button>
          )}
        </section>
      )}

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
                onClick={() => { if (index === breadcrumbs.length - 1) openRename(department, "department"); else openDepartment(department.id); }}
                aria-label={index === breadcrumbs.length - 1 ? t("rename.action", { name: department.name }) : undefined}
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

      {!normalizedQuery && childDepartments.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-base font-semibold text-foreground">{current ? t("dept.categories") : t("dept.allDepartments")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {childDepartments.map((department) => {
              const dropKind = drag?.target?.id === department.id ? drag.target.kind : null;
              return (
              <div key={department.id} className="group relative min-w-0">
              <Button
                type="button"
                variant="ghost"
                data-drop="tile"
                data-id={department.id}
                onPointerDown={(e) => startPress(e, department)}
                onPointerMove={pressMove}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                onClick={() => { if (!suppressClick.current) openDepartment(department.id); }}
                style={{ WebkitTouchCallout: "none" }}
                className={`relative w-full select-none ${drag?.id === department.id ? "opacity-40" : ""} ${dropKind === "into" ? "ring-2 ring-primary" : ""} ${dropKind === "before" ? "!border-l-4 !border-l-primary" : ""} ${dropKind === "after" ? "!border-r-4 !border-r-primary" : ""} h-auto min-w-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 text-left shadow-sm active:scale-[0.98]`}
              >
                <span className="grid aspect-[4/3] w-full place-items-center overflow-hidden bg-primary-soft/25">
                  <DepartmentThumb department={department} />
                </span>
                <span className="flex min-h-14 w-full items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 whitespace-normal text-sm font-semibold leading-5 text-foreground">{department.name}</span>
                  <span className="shrink-0 text-lg text-primary" aria-hidden="true">›</span>
                </span>
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label={t("dept.remove", { name: department.name })} title={t("dept.remove", { name: department.name })} onClick={() => setRemoveTarget(department)} className="absolute right-1 top-1 z-10 h-9 w-9 bg-card/90 text-muted-foreground transition-opacity hover:text-destructive focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                <TrashIcon className="h-4 w-4" />
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
          </div>
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {shownProducts.map((product, index) => {
              // Überschrift steht immer direkt vor ihrem Anker-Produkt (auch nach lokaler Umsortierung)
              const heading = !normalizedQuery ? headingBefore.get(product.id) : undefined;
              const showHeading = !!heading;
              void index;
              const group = groupFor(product);
              const favorite = isFavorite(product.id);
              const pt = drag?.what === "product" && drag.target?.id === product.id ? drag.target.kind : null;
              const draggable = !normalizedQuery;
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
                    className={`select-none bg-muted/50 px-3 pb-1.5 pt-3 text-sm font-bold text-foreground ${isAdmin ? "cursor-pointer" : ""} ${drag?.what === "heading" && drag.id === heading.id ? "opacity-40" : ""} ${headingDrop ? "ring-2 ring-inset ring-primary" : ""}`}
                  >
                    {heading.name}
                  </div>
                )}
                <div
                  data-drop={draggable ? "product" : undefined}
                  data-id={product.id}
                  onPointerDown={draggable ? (e) => startPress(e, product, "product") : undefined}
                  onPointerMove={draggable ? pressMove : undefined}
                  onPointerUp={draggable ? cancelPress : undefined}
                  onPointerLeave={draggable ? cancelPress : undefined}
                  onContextMenu={draggable ? (e) => e.preventDefault() : undefined}
                  onClickCapture={(e) => { if (suppressClick.current) { e.stopPropagation(); e.preventDefault(); } }}
                  className={`flex min-h-20 select-none items-center gap-3 px-3 py-2.5 ${draggable ? "pl-1" : ""} ${drag?.what === "product" && drag.id === product.id ? "opacity-40" : ""} ${pt === "before" ? "!border-t-2 !border-t-primary" : ""} ${pt === "after" && !headingDrop ? "!border-b-2 !border-b-primary" : ""}`}
                >
                  {draggable && (
                    <span
                      aria-hidden="true"
                      onPointerDown={(e) => startDragNow(e, product, "product")}
                      className="grid h-14 w-6 shrink-0 cursor-grab touch-none place-items-center text-lg leading-none text-muted-foreground active:cursor-grabbing"
                    >
                      ⠿
                    </span>
                  )}
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft/25">
                    <ProductThumb product={product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => openRename(product, "product")} aria-label={t("rename.action", { name: product.name })} className="inline-flex text-left text-sm font-semibold text-foreground">
                      <span>{product.name}</span>
                    </button>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {normalizedQuery && matchedBrand(product) ? `${matchedBrand(product)} · ` : ""}{normalizedQuery && group ? `${group.name} · ` : ""}{formatQuantity(product.defaultQuantity, product.defaultUnit)}
                    </p>
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
                    onClick={() => quickAdd(product, group)}
                    className="h-8 w-8 rounded-full text-muted-foreground"
                  >
                    <BoltIcon className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    aria-label={t("common.addWithQty", { name: product.name })}
                    onClick={() => { setSelectedBrand(normalizedQuery ? matchedBrand(product) : undefined); setSelectedProduct(product); }}
                    className="h-8 w-8 rounded-full shadow-none"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </Button>
                  </div>
                </div>
                </Fragment>
              );
            })}
          </div>
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

      <RenameDialog target={renameTarget} onClose={() => setRenameTarget(null)} />
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
      <CatalogProductDialog
        product={selectedProduct}
        groupLabel={selectedProduct ? groupFor(selectedProduct)?.name : undefined}
        groupEmoji={selectedProduct ? groupFor(selectedProduct)?.emoji : undefined}
        initialBrand={selectedBrand}
        onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
      />
    </div>
  );
}
