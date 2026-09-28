import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDepartmentOrder } from "../hooks/use-department-order";
import { saveProductOrder } from "../hooks/use-product-order";
import { toast } from "sonner";
import { CatalogProductDialog } from "../components/catalog-product-dialog";
import { Button } from "../components/ui/button";
import { BoltIcon, HeartIcon, PencilIcon, PlusIcon, ScanIcon, SearchIcon } from "../components/icons";
import { RenameDialog, type RenameTarget } from "../components/rename-dialog";
import { AddEntryDialog, type AddEntryTarget } from "../components/add-entry-dialog";
import { useCustomNames } from "../hooks/use-custom-names";
import { useShoppingList } from "../hooks/use-shopping-list";
import {
  catalogQueryOptions,
  useCatalog,
  childrenOf,
  compareByName,
  matchesProductSearch,
  originalName,
  pathTo,
  productsOf,
  type CatalogDepartment,
  type CatalogProduct,
} from "../lib/catalog-query";
import { formatQuantity } from "../lib/units";
import { useT } from "../i18n";


export const Route = createFileRoute("/abteilungen")({
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
  return <span className="text-3xl" aria-hidden="true">{product.emoji ?? "🛒"}</span>;
}

function DepartmentThumb({ department }: { department: CatalogDepartment }) {
  if (department.imageUrl) {
    return <img src={department.imageUrl} alt="" draggable={false} className="max-h-[74%] max-w-[74%] object-contain" />;
  }
  return <span className="text-5xl" aria-hidden="true">{department.emoji ?? "🧺"}</span>;
}

function DepartmentsPage() {
  const data = useCatalog();
  const { t } = useT();
  const { addCatalogItem, isFavorite, toggleFavorite } = useShoppingList();
  const { departments, move } = useDepartmentOrder(data.departments);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [addTarget, setAddTarget] = useState<AddEntryTarget | null>(null);
  const customNames = useCustomNames();
  const openRename = (e: CatalogDepartment | CatalogProduct) =>
    setRenameTarget({ id: e.id, name: e.name, originalName: originalName(e), isCustom: e.id in customNames });

  const current = departments.find((department) => department.id === currentId) ?? null;
  const breadcrumbs = pathTo(departments, currentId);
  const childDepartments = childrenOf(departments, currentId);
  const directProducts = currentId ? productsOf(data.products, currentId) : [];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searchResults = useMemo(
    () => normalizedQuery
      ? data.products
          .filter((product) => matchesProductSearch(product.name, normalizedQuery))
          .sort(compareByName)
      : [],
    [data.products, normalizedQuery],
  );

  const groupFor = (product: CatalogProduct) =>
    departments.find((department) => department.id === product.departmentId) ?? current;

  // ---- Drag & Drop (langes Drücken) ----
  type DropTarget = { kind: "before" | "after" | "into"; id: string | null };
  const [drag, setDrag] = useState<{ type: "dept" | "product"; id: string; name: string; x: number; y: number; target: DropTarget | null } | null>(null);
  const pressRef = useRef<{ timer: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const findTarget = (x: number, y: number, draggedId: string, type: "dept" | "product" = "dept"): DropTarget | null => {
    if (type === "product") {
      const pel = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-pdrop]");
      const pid = pel?.dataset["id"];
      if (!pel || !pid || pid === draggedId) return null;
      const pr = pel.getBoundingClientRect();
      return { kind: y < pr.top + pr.height / 2 ? "before" : "after", id: pid };
    }
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]");
    if (!el) return null;
    const id = el.dataset["id"] || null;
    if (el.dataset["drop"] === "crumb") return { kind: "into", id };
    if (id === draggedId) return null;
    const r = el.getBoundingClientRect();
    const fx = (x - r.left) / r.width;
    return { kind: fx < 0.28 ? "before" : fx > 0.72 ? "after" : "into", id };
  };

  const cancelPress = () => {
    if (pressRef.current) window.clearTimeout(pressRef.current.timer);
    pressRef.current = null;
  };

  const startPress = (event: React.PointerEvent, department: { id: string; name: string }, type: "dept" | "product" = "dept") => {
    if (event.button !== 0) return;
    const { clientX: x, clientY: y } = event;
    cancelPress();
    pressRef.current = {
      x, y,
      timer: window.setTimeout(() => {
        pressRef.current = null;
        navigator.vibrate?.(30);
        setDrag({ type, id: department.id, name: department.name, x, y, target: null });
      }, 420),
    };
  };

  const pressMove = (event: React.PointerEvent) => {
    const p = pressRef.current;
    if (p && Math.hypot(event.clientX - p.x, event.clientY - p.y) > 8) cancelPress();
  };

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setDrag({ ...d, x: e.clientX, y: e.clientY, target: findTarget(e.clientX, e.clientY, d.id, d.type) });
    };
    const onUp = () => {
      const d = dragRef.current;
      setDrag(null);
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 50);
      if (!d?.target) return;
      const { kind, id } = d.target;
      if (d.type === "product") {
        const ids = directProducts.map((pr) => pr.id).filter((pid) => pid !== d.id);
        const at = ids.indexOf(id ?? "") + (kind === "after" ? 1 : 0);
        ids.splice(Math.max(0, at), 0, d.id);
        saveProductOrder(ids);
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
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("touchmove", block);
    };
  }, [drag?.id, departments, directProducts, move, t]);

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
              {index === breadcrumbs.length - 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => openRename(department)} aria-label={t("rename.action", { name: department.name })} className="h-7 w-7 rounded-full text-muted-foreground">
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
              )}
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
              const t = drag?.target?.id === department.id ? drag.target.kind : null;
              return (
              <Button
                key={department.id}
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
                className={`relative select-none ${drag?.id === department.id ? "opacity-40" : ""} ${t === "into" ? "ring-2 ring-primary" : ""} ${t === "before" ? "!border-l-4 !border-l-primary" : ""} ${t === "after" ? "!border-r-4 !border-r-primary" : ""} h-auto min-w-0 flex-col items-stretch gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 text-left shadow-sm active:scale-[0.98]`}
              >
                <span className="grid aspect-[4/3] w-full place-items-center overflow-hidden bg-primary-soft/25">
                  <DepartmentThumb department={department} />
                </span>
                <span className="flex min-h-14 w-full items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 whitespace-normal text-sm font-semibold leading-5 text-foreground">{department.name}</span>
                  <span className="shrink-0 text-lg text-primary" aria-hidden="true">›</span>
                </span>
              </Button>
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
            {shownProducts.map((product) => {
              const group = groupFor(product);
              const favorite = isFavorite(product.id);
              return (
                <div
                  key={product.id}
                  data-pdrop={normalizedQuery ? undefined : ""}
                  data-id={product.id}
                  onPointerDown={normalizedQuery ? undefined : (e) => startPress(e, product, "product")}
                  onPointerMove={pressMove}
                  onPointerUp={cancelPress}
                  onPointerLeave={cancelPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClickCapture={(e) => { if (suppressClick.current) { e.stopPropagation(); e.preventDefault(); } }}
                  className={`flex min-h-20 select-none items-center gap-3 px-3 py-2.5 ${drag?.id === product.id ? "opacity-40" : ""} ${drag?.target?.id === product.id && drag.target.kind === "before" ? "border-t-4 !border-t-primary" : ""} ${drag?.target?.id === product.id && drag.target.kind === "after" ? "border-b-4 !border-b-primary" : ""}`}
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft/25">
                    <ProductThumb product={product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => openRename(product)} aria-label={t("rename.action", { name: product.name })} className="inline-flex text-left text-sm font-semibold text-foreground">
                      <span>{product.name}</span>
                    </button>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {normalizedQuery && group ? `${group.name} · ` : ""}{formatQuantity(product.defaultQuantity, product.defaultUnit)}
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
                    onClick={() => setSelectedProduct(product)}
                    className="h-8 w-8 rounded-full shadow-none"
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                  </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {!normalizedQuery && currentId && (
            <Button type="button" variant="outline" onClick={() => setAddTarget({ kind: "product", parentId: currentId, parentName: current?.name })} className="mt-3 w-full rounded-xl">
              <PlusIcon className="h-4 w-4" /> {t("add.product")}
            </Button>
          )}
        </section>
      )}
      <AddEntryDialog target={addTarget} onClose={() => setAddTarget(null)} />

      <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-soft/30 py-3 text-sm font-semibold text-primary transition active:scale-[0.98]">
        <ScanIcon className="h-5 w-5" />
        {t("dept.scan")}
      </button>

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
      <CatalogProductDialog
        product={selectedProduct}
        groupLabel={selectedProduct ? groupFor(selectedProduct)?.name : undefined}
        groupEmoji={selectedProduct ? groupFor(selectedProduct)?.emoji : undefined}
        onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
      />
    </div>
  );
}