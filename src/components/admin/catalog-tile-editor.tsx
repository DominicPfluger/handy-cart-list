import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { getUnits } from "@/lib/units";
import { rootColorByName } from "@/lib/dept-colors";
import { prepareCategoryImage } from "@/lib/image-upload";
import { saveProductIcon, saveProductIconFromPath } from "@/lib/product-icon";
import { forgetCatalogImage } from "@/lib/catalog-image-cache";
import { estimateProductPricesAllMarkets, generateImageFor, listProductImages } from "@/lib/product-media.functions";
import { suggestCategoryProducts, suggestImagePrompt, translateVariants } from "@/lib/admin.functions";
import { currentMarket, formatRefPrice, type RefPrice } from "@/hooks/use-reference-prices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageZoomOverlay, ZoomableImage } from "@/components/admin/zoomable-image";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

const MARKET_CCY: Record<string, string> = { CH: "CHF", DE: "EUR", AT: "EUR", FR: "EUR", ES: "EUR", MX: "MXN", IT: "EUR", BE: "EUR", NL: "EUR", GB: "GBP", US: "USD", CA: "CAD", PT: "EUR", BR: "BRL" };

/** Alias-Kategorien: id = "deptalias:<aliasId>", alias_id + dept_id (Original) gesetzt. */
export type TileDept = { id: string; name: string; emoji: string | null; parent_id: string | null; sort_order: number; image_path: string | null; alias_id?: string; dept_id?: string };
/** Alias-Einträge: id = "alias:<aliasId>", alias_id + product_id gesetzt. */
export type TileProd = { id: string; name: string; emoji: string | null; department_id: string; default_quantity: number; default_unit: string; image_path?: string | null; variants?: string[]; alias_id?: string; product_id?: string };

const COMMON_VARIANTS = ["Bio", "Vollkorn", "vegan", "laktosefrei", "glutenfrei", "zuckerfrei", "light", "groß", "klein", "mild", "scharf"];

type Target = { kind: "department" | "product"; id: string | null } | null;
type Drag = { kind: "department" | "product" | "heading"; id: string; index: number; x: number; y: number; label: string } | null;
export type TileHeading = { id: string; name: string; before_product_id: string };

export function CatalogTileEditor(p: {
  depts: TileDept[];
  cur: string | null;
  setCur: (id: string | null) => void;
  children: TileDept[];
  products: TileProd[];
  path: TileDept[];
  nm: (id: string, base: string) => string;
  unavailable: (prod: TileProd) => boolean;
  prices: Map<string, RefPrice> | undefined;
  run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>;
  must: (q: PromiseLike<{ error: { message: string } | null }>) => Promise<void>;
  translateIds: (ids?: string[]) => Promise<number>;
  reorder: (kind: "department" | "product", list: { id: string }[], from: number, to: number) => void;
  remove: (kind: "department" | "product", id: string, name: string) => void;
  /** Zusätzlicher Inhalt unter dem Editor (z. B. Aliase). */
  below?: React.ReactNode;
  /** Öffnet die erweiterte Bearbeitung (Übersetzungen, Marken, Aliase …). */
  onAdvanced?: (kind: "department" | "product", id: string) => void;
  busy?: boolean;
  onRemoveAlias?: (aliasId: string, name: string) => void;
  /** Wählbare Kategorien für eine neue Alias-Kategorie. */
  deptAliasOptions?: { id: string; label: string }[];
  onAddDeptAlias?: (deptId: string) => void;
  onRemoveDeptAlias?: (aliasId: string, name: string) => void;
  headings?: TileHeading[];
  onAddHeading?: (name: string) => void;
  onMoveHeading?: (id: string, beforeProductId: string) => void;
  /** Ordnet ein Produkt einer Überschrift zu ("" = vor die erste Überschrift). */
  onAssignHeading?: (productId: string, headingId: string) => void;
  onRenameHeading?: (id: string, name: string) => void;
  onDeleteHeading?: (id: string, name: string) => void;
  onBulkAdd?: (() => void) | undefined;
  /** Ergänzt fehlende Übersetzungen per KI (ganzer Katalog). */
  onTranslateMissing?: () => void;
}) {
  const [newTitle, setNewTitle] = useState<string | null>(null);
  const headingBefore = useMemo(() => new Map((p.headings ?? []).map((h) => [h.before_product_id, h])), [p.headings]);
  const editMode = true;
  const [target, setTarget] = useState<Target>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [over, setOver] = useState<string | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after" | null>(null);
  const [aliasPick, setAliasPick] = useState(false);
  const [aliasSearch, setAliasSearch] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const moved = useRef(false);
  const genImgAll = useServerFn(generateImageFor);
  const [imgProg, setImgProg] = useState<{ done: number; total: number } | null>(null);
  const generateAllImages = () => {
    const missing = p.products.filter((x) => !x.image_path);
    let list = missing;
    if (missing.length === 0) {
      if (!window.confirm(T("tile.genAllRedo", { n: p.products.length }))) return;
      list = p.products;
    } else if (!window.confirm(T("tile.genAllConfirm", { n: missing.length }))) return;
    void p.run(async () => {
      setImgProg({ done: 0, total: list.length });
      try {
        for (let i = 0; i < list.length; i++) {
          const result = await genImgAll({ data: { id: list[i]!.id, kind: "product" } });
          await saveProductIconFromPath(list[i]!.id, result.path);
          setImgProg({ done: i + 1, total: list.length });
        }
      } finally { setImgProg(null); }
    }, T("tile.genAllDone", { n: list.length }));
  };
  const deptById = useMemo(() => new Map(p.depts.map((d) => [d.id, d])), [p.depts]);

  const rootName = (d: TileDept) => {
    let c = d; let g = 0;
    while (c.parent_id && g++ < 20) { const n = deptById.get(c.parent_id); if (!n) break; c = n; }
    return c.name;
  };

  const paths = [...p.children.map((c) => c.image_path), ...p.products.map((x) => x.image_path)].filter((x): x is string => Boolean(x));
  const imgs = useQuery({
    queryKey: ["admin-tile-imgs", paths.join("|")],
    enabled: paths.length > 0,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.storage.from("catalog-images").createSignedUrls(paths, 3600);
      const m = new Map<string, string>();
      for (const e of data ?? []) if (e.path && e.signedUrl) m.set(e.path, e.signedUrl);
      return m;
    },
  });
  const img = (path: string | null | undefined) => (path ? imgs.data?.get(path) : undefined);

  // ---------- Drag & Drop per Pointer (Maus + Touch) ----------
  const startDrag = (e: React.PointerEvent, kind: "department" | "product" | "heading", id: string, index: number, label: string) => {
    if (!editMode) return;
    e.preventDefault();
    moved.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ kind, id, index, x: e.clientX, y: e.clientY, label });
  };
  const dropAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-drop]");
    return el ? { kind: el.dataset["drop"]!, id: el.dataset["id"] ?? "", index: Number(el.dataset["index"] ?? -1), el } : null;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) moved.current = true;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
    const t = dropAt(e.clientX, e.clientY);
    if (t && t.kind === "product" && drag.kind === "product") {
      const r = t.el.getBoundingClientRect();
      setOverPos(e.clientY > r.top + r.height / 2 ? "after" : "before");
    } else setOverPos(null);
    setOver(t ? `${t.kind}:${t.id}` : null);
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag;
    setDrag(null); setOver(null); setOverPos(null);
    if (!d || !moved.current) return;
    const t = dropAt(e.clientX, e.clientY);
    if (!t || t.id === d.id) return;
    if (d.kind === "heading") {
      if (t.kind === "product") p.onMoveHeading?.(d.id, t.id);
      return;
    }
    if (d.kind === "product" && t.kind === "heading") {
      p.reorder("product", p.products, d.index, t.index);
      return;
    }
    const isAlias = d.id.startsWith("alias:") || d.id.startsWith("deptalias:");
    if (isAlias && (t.kind === "crumb" || t.kind === "department")) return;
    const after = (() => { const r = t.el.getBoundingClientRect(); return d.kind === "product" ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2; })();
    if (t.kind === "crumb") {
      const dest = t.id || null;
      if (d.kind === "product" && !dest) return;
      void p.run(() => p.must(d.kind === "product"
        ? supabase.from("products").update({ department_id: dest! }).eq("id", d.id)
        : supabase.from("departments").update({ parent_id: dest }).eq("id", d.id)), T("tile.moved"));
    } else if (t.kind === "department" && d.kind === "product") {
      void p.run(() => p.must(supabase.from("products").update({ department_id: t.id }).eq("id", d.id)), T("tile.moved"));
    } else if (t.kind === d.kind) {
      p.reorder(d.kind, d.kind === "department" ? p.children : p.products, d.index, t.index + (after ? 1 : 0));
    }
  };

  const dragHandlers = { onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: () => { setDrag(null); setOver(null); setOverPos(null); } };
  const click = (fn: () => void) => () => { if (moved.current) { moved.current = false; return; } fn(); };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{T("tile.hint")}</p>

      <nav className="flex flex-wrap items-center gap-1 text-sm">
        <button type="button" data-drop="crumb" data-id="" onClick={() => p.setCur(null)}
          className={`rounded-md px-1 font-semibold text-primary ${over === "crumb:" ? "ring-2 ring-primary" : ""}`}>{T("adm.catalog")}</button>
        {p.path.map((d) => (
          <span key={d.id} className="flex items-center gap-1">
            <span className="text-muted-foreground">›</span>
            <button type="button" data-drop="crumb" data-id={d.id} onClick={() => p.setCur(d.id)}
              className={`rounded-md px-1 font-semibold text-primary ${over === `crumb:${d.id}` ? "ring-2 ring-primary" : ""}`}>{p.nm(d.id, d.name)}</button>
          </span>
        ))}
      </nav>


      {editMode && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setTarget({ kind: "department", id: null })}>+ {T("tile.newCat")}</Button>
          {p.onAddDeptAlias && <Button size="sm" variant="outline" disabled={!p.cur} title={!p.cur ? T("tile.pickDeptAlias") : undefined} onClick={() => { setAliasSearch(""); setAliasPick(true); }}>+ {T("tile.newDeptAlias")}</Button>}
          {p.cur && p.onAddHeading && p.products.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setNewTitle("")}>+ {T("adm.heading")}</Button>
          )}
          {p.cur && <Button size="sm" variant="outline" onClick={() => setTarget({ kind: "product", id: null })}>+ {T("tile.newProd")}</Button>}
          {p.cur && p.onBulkAdd && <Button size="sm" variant="outline" onClick={p.onBulkAdd}>+ {T("adm.multi")}</Button>}
          {p.cur && <Button size="sm" variant="outline" onClick={() => setSuggesting(true)}>✨ {T("tile.suggest")}</Button>}
          {p.cur && p.products.length > 0 && (
            <Button size="sm" variant="outline" disabled={!!imgProg} onClick={generateAllImages}>
              🖼️ {imgProg ? T("tile.genAllBusy", { done: imgProg.done, total: imgProg.total }) : T("tile.genAll")}
            </Button>
          )}
          {p.onTranslateMissing && <Button size="sm" variant="outline" disabled={p.busy} onClick={p.onTranslateMissing}>🌐 {p.busy ? T("adm.working") : T("adm.trMissing")}</Button>}
        </div>
      )}

      {(p.children.length > 0 || editMode) && (
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-5 xl:grid-cols-7">
          {p.children.map((c, i) => (
            <div key={c.id} data-drop="department" data-id={c.id} data-index={i}
              style={{ background: rootColorByName(rootName(c)) }}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl bg-primary-soft p-2.5 ${c.alias_id ? "border border-dashed border-border" : ""} ${drag?.id === c.id ? "opacity-40" : ""} ${over === `department:${c.id}` ? "ring-2 ring-primary" : ""}`}>
              <button type="button" aria-label={p.nm(c.dept_id ?? c.id, c.name)}
                onPointerDown={(e) => startDrag(e, "department", c.id, i, c.emoji ?? "📁")} {...dragHandlers}
                onClick={click(() => p.setCur(c.dept_id ?? c.id))}
                onDoubleClick={() => { const u = img(c.image_path); if (u) setZoom(u); }}
                className={`flex h-16 w-full items-center justify-center overflow-hidden rounded-xl text-4xl ${editMode ? "cursor-grab touch-none" : ""}`}>
                {img(c.image_path) ? <ZoomableImage src={img(c.image_path)!} className="h-full w-full object-cover" /> : c.emoji ?? "📁"}
              </button>
              <span className="line-clamp-2 text-center text-[13px] font-bold leading-tight text-foreground">{p.nm(c.dept_id ?? c.id, c.name)}{c.alias_id && <span className="block text-[10px] font-normal text-muted-foreground">· {T("adm.alias")}</span>}</span>
              {editMode && !c.alias_id && (
                <button type="button" onClick={() => setTarget({ kind: "department", id: c.id })} aria-label={T("tile.editItem")}
                  className="absolute right-1 top-1 rounded-full bg-background/80 px-1.5 text-xs">✎</button>
              )}
              {editMode && c.alias_id && (
                <button type="button" onClick={() => p.onRemoveDeptAlias?.(c.alias_id!, p.nm(c.dept_id ?? c.id, c.name))} aria-label={T("adm.delete")}
                  className="absolute right-1 top-1 rounded-full bg-background/80 px-1.5 text-xs text-destructive">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {p.cur && p.onAddHeading && newTitle !== null && (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = newTitle.trim(); if (!n) return; p.onAddHeading!(n); setNewTitle(null); }}>
            <input autoFocus value={newTitle} maxLength={80} onChange={(e) => setNewTitle(e.target.value)} placeholder={T("adm.heading")}
              className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm" />
            <button type="submit" className="rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground">{T("adm.save")}</button>
            <button type="button" onClick={() => setNewTitle(null)} className="rounded-xl border border-border px-3 text-sm">✕</button>
          </form>
      )}

      {p.cur && (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {p.products.map((x, i) => {
            const pid = x.product_id ?? x.id;
            const price = p.prices?.get(pid);
            const h = headingBefore.get(x.id);
            return (
              <Fragment key={x.id}>
              {h && (
                <div data-drop="heading" data-id={h.id} data-index={i}
                  className={`flex items-center gap-2 bg-muted/50 px-3 py-2 ${drag?.id === h.id ? "opacity-40" : ""} ${over === `heading:${h.id}` ? "bg-primary-soft" : ""}`}>
                  {editMode && (
                    <span onPointerDown={(e) => startDrag(e, "heading", h.id, i, p.nm(h.id, h.name))} {...dragHandlers}
                      aria-label={T("adm.drag")} className="cursor-grab touch-none select-none px-1 text-lg text-muted-foreground">⠿</span>
                  )}
                  <button type="button" disabled={!editMode}
                    onClick={click(() => { const n = window.prompt(T("adm.heading"), h.name)?.trim(); if (n && n !== h.name) p.onRenameHeading?.(h.id, n); })}
                    className="min-w-0 flex-1 truncate text-left text-sm font-bold text-foreground">{p.nm(h.id, h.name)}</button>
                  {editMode && (
                    <button type="button" onClick={() => p.onDeleteHeading?.(h.id, h.name)} aria-label={T("adm.delete")}
                      className="rounded-full px-2 text-xs text-muted-foreground">✕</button>
                  )}
                </div>
              )}
              <div data-drop="product" data-id={x.id} data-index={i}
                className={`flex items-center gap-3 px-3 py-2 ${x.alias_id ? "border border-dashed border-border" : ""} ${drag?.id === x.id ? "opacity-40" : ""} ${over === `product:${x.id}` ? (overPos === "after" ? "shadow-[inset_0_-3px_0_0_var(--color-primary)]" : overPos === "before" ? "shadow-[inset_0_3px_0_0_var(--color-primary)]" : "bg-primary-soft") : ""} ${p.unavailable(x) ? "opacity-50" : ""}`}>
                <span onPointerDown={(e) => startDrag(e, "product", x.id, i, x.emoji ?? "•")} {...dragHandlers} onDoubleClick={() => { const u = img(x.image_path); if (u) setZoom(u); }}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-2xl ${editMode ? "cursor-grab touch-none" : ""}`}>
                  {img(x.image_path) ? <ZoomableImage src={img(x.image_path)!} className="h-full w-full object-cover" /> : x.emoji ?? "🛒"}
                </span>
                <button type="button" disabled={!editMode} onClick={click(() => x.alias_id ? p.onAdvanced?.("product", pid) : setTarget({ kind: "product", id: x.id }))} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-semibold text-foreground">{p.nm(pid, x.name)}{x.alias_id && <span className="ml-1 text-[10px] font-normal text-muted-foreground">· {T("adm.alias")}</span>}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {x.default_quantity} {getUnits(getLocale()).find((u) => u.id === x.default_unit)?.label ?? x.default_unit}
                    {price ? ` · ${formatRefPrice(price)}` : ""}
                  </div>
                </button>
                {editMode && x.alias_id && (
                  <button type="button" onClick={() => p.onRemoveAlias?.(x.alias_id!, p.nm(pid, x.name))} aria-label={T("adm.delete")}
                    className="rounded-full px-2 text-xs text-destructive">✕</button>
                )}
              </div>
              </Fragment>
            );
          })}
        </div>
      )}

      {p.below}

      {suggesting && p.cur && <SuggestSheet {...p} cur={p.cur} onClose={() => setSuggesting(false)} />}

      {aliasPick && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setAliasPick(false)}>
          <div className="flex max-h-[80vh] w-full max-w-md flex-col gap-2 rounded-t-2xl bg-card p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-foreground">{T("tile.pickDeptAlias")}</p>
            <Input autoFocus value={aliasSearch} onChange={(e) => setAliasSearch(e.target.value)} placeholder={T("tile.deptAliasSearch")} className="h-10 rounded-xl" />
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {(p.deptAliasOptions ?? []).filter((o) => o.label.toLowerCase().includes(aliasSearch.trim().toLowerCase())).map((o) => (
                <button key={o.id} type="button" onClick={() => { p.onAddDeptAlias?.(o.id); setAliasPick(false); }}
                  className="w-full truncate rounded-lg border border-border px-3 py-2 text-left text-sm text-foreground">{o.label}</button>
              ))}
              {(p.deptAliasOptions ?? []).length === 0 && <p className="text-sm text-muted-foreground">{T("adm.noHits")}</p>}
            </div>
            <Button variant="outline" onClick={() => setAliasPick(false)}>{T("adm.cancel")}</Button>
          </div>
        </div>
      )}

      {drag && moved.current && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card px-3 py-2 text-2xl shadow-lg" style={{ left: drag.x, top: drag.y }}>{drag.label}</div>
      )}

      {target && (
        <ItemSheet key={`${target.kind}:${target.id}`} {...p} target={target} onClose={() => setTarget(null)}
          imgUrl={target.id ? img(target.kind === "department" ? deptById.get(target.id)?.image_path : p.products.find((x) => x.id === target.id)?.image_path) : undefined} />
      )}

      {zoom && <ImageZoomOverlay src={zoom} open onClose={() => setZoom(null)} />}
    </div>
  );
}

function ItemSheet(p: Parameters<typeof CatalogTileEditor>[0] & { target: NonNullable<Target>; onClose: () => void; imgUrl: string | undefined }) {
  const genImg = useServerFn(generateImageFor);
  const trVariants = useServerFn(translateVariants);
  const suggestPrompt = useServerFn(suggestImagePrompt);
  const isDept = p.target.kind === "department";
  const item = p.target.id ? (isDept ? p.depts.find((d) => d.id === p.target.id) : p.products.find((x) => x.id === p.target.id)) : undefined;
  const prod = !isDept ? (item as TileProd | undefined) : undefined;
  const [name, setName] = useState(item?.name ?? "");
  const [emoji, setEmoji] = useState(item?.emoji ?? "");
  const [qty, setQty] = useState(prod?.default_quantity ?? 1);
  const [unit, setUnit] = useState(prod?.default_unit ?? "stueck");
  const [hint, setHint] = useState("");
  const [large, setLarge] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null | undefined>(undefined);
  const [imageBusy, setImageBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const estAll = useServerFn(estimateProductPricesAllMarkets);
  const qc = useQueryClient();
  const [estimating, setEstimating] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichStatus, setEnrichStatus] = useState("");
  const [enrichErrors, setEnrichErrors] = useState<string[]>([]);
  const [estimates, setEstimates] = useState<Array<{ market: string; price: number; currency: string; unit_price: number | null; unit_basis: string | null }>>([]);
  const [variants, setVariants] = useState<string[]>(prod?.variants ?? []);
  const [variantInput, setVariantInput] = useState("");
  const [prodLines, setProdLines] = useState("");
  const heads = p.headings ?? [];
  const curHeadingId = (() => {
    if (!prod) return "";
    const idx = p.products.findIndex((x) => x.id === prod.id);
    let curH = "";
    for (const h of heads) { const ai = p.products.findIndex((x) => x.id === h.before_product_id); if (ai >= 0 && ai <= idx) curH = h.id; }
    return curH;
  })();
  const [headingSel, setHeadingSel] = useState(curHeadingId);
  const addVariant = (v: string) => {
    const vals = v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    setVariants((x) => {
      const next = [...x];
      for (const val of vals) if (!next.some((y) => y.toLowerCase() === val.toLowerCase())) next.push(val);
      return next;
    });
    setVariantInput("");
  };
  const effId = item?.id ?? newId ?? undefined;
  const table = isDept ? "departments" : "products";

  // KI-Vorschlag für den Bildtext einer Kategorie, abgeleitet aus den enthaltenen Produkten.
  const [suggesting, setSuggesting] = useState(false);
  const loadSuggestion = (overwrite: boolean) => {
    if (!isDept || !effId) return;
    setSuggesting(true);
    void suggestPrompt({ data: { departmentId: effId } })
      .then((r) => { if (r.prompt) setHint((h) => (overwrite || !h.trim() ? r.prompt : h)); })
      .catch(() => {})
      .finally(() => setSuggesting(false));
  };
  useEffect(() => { loadSuggestion(false); }, [effId, isDept]);

  const save = async () => {
    if (enriching) return;
    const isNewProduct = !item && !isDept && !newId;
    let createdId: string | undefined;
    await p.run(async () => {
    if (!name.trim()) throw new Error(T("tile.nameRequired"));
    const base = { name: name.trim(), emoji: emoji.trim() || null };
    let id = item?.id;
    if (item) {
      await p.must(isDept
        ? supabase.from("departments").update(base).eq("id", item.id)
        : supabase.from("products").update({ ...base, default_quantity: qty, default_unit: unit as never, variants }).eq("id", item.id));
      if (item.name !== base.name) {
        await p.must(supabase.from("catalog_translations").delete().eq("entity_id", item.id).eq("is_manual", false));
        await p.translateIds([item.id]);
      }
      if (!isDept) void trVariants({ data: { productId: item.id } }).catch(() => {});
    } else {
      const r = isDept
        ? await supabase.from("departments").insert({ ...base, parent_id: p.cur, sort_order: p.children.length + 1 }).select("id").single()
        : await supabase.from("products").insert({ ...base, department_id: p.cur!, default_quantity: qty, default_unit: unit as never, variants, sort_order: p.products.length + 1 }).select("id").single();
      if (r.error) throw new Error(r.error.message);
      id = r.data.id;
      if (!isNewProduct) await p.translateIds([id]);
      if (!isDept) void trVariants({ data: { productId: id } }).catch(() => {});
      setNewId(id);
      if (isNewProduct) createdId = id;
      if (isDept && id) {
        const names = [...new Set(prodLines.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))];
        if (names.length) {
          const rows = names.map((n, i) => ({ department_id: id, name: n, default_quantity: 1, default_unit: "stueck" as never, sort_order: i + 1 }));
          const ins = await supabase.from("products").insert(rows).select("id");
          if (ins.error) throw new Error(ins.error.message);
          await p.translateIds((ins.data ?? []).map((x) => x.id as string));
        }
      }
    }
    if (!isDept && id && price.trim() && !Number.isNaN(Number(price))) {
      const market = currentMarket();
      await p.must(supabase.from("product_reference_prices").upsert({ product_id: id, market, price: Number(price), currency: MARKET_CCY[market] ?? "EUR" }, { onConflict: "product_id,market" }));
    }
    // Bei neuen Einträgen offen lassen, damit gleich ein Bild ergänzt werden kann.
    if (item) p.onClose();
    });
    if (createdId) {
      const id = createdId;
      const errors: string[] = [];
      setEnriching(true);
      setEnrichErrors([]);
      const step = async (label: string, fn: () => Promise<void>) => {
        setEnrichStatus(label);
        try { await fn(); } catch (e) { errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`); setEnrichErrors([...errors]); }
      };
      await step(T("tile.enrichTranslation"), async () => { await p.translateIds([id]); });
      await step(T("tile.enrichImage"), async () => {
        const { data, error } = await supabase.from("products").select("image_path, icon_path").eq("id", id).single();
        if (error) throw new Error(error.message);
        const path = data?.image_path ?? (await genImg({ data: { id, kind: "product" } })).path;
        if (!data?.icon_path) await saveProductIconFromPath(id, path);
        const signed = await supabase.storage.from("catalog-images").createSignedUrl(path, 600);
        if (signed.data?.signedUrl) setLarge(signed.data.signedUrl);
      });
      await step(T("tile.enrichPrices"), async () => {
        const r = await estAll({ data: { productId: id, skipExisting: true } });
        setEstimates(r.items);
        const mine = r.items.find((x) => x.market === currentMarket());
        if (mine && !price.trim()) setPrice(String(mine.price));
        if (r.failed) throw new Error(T("tile.estimateAllFailed", { n: r.failed }));
      });
      void qc.invalidateQueries();
      setEnrichStatus(errors.length ? T("tile.enrichPartial") : T("tile.enrichDone"));
      setEnriching(false);
    }
    if (!isDept && item && headingSel !== curHeadingId) p.onAssignHeading?.(item.id, headingSel);
  };

  const upload = (file: File) => p.run(async () => {
    const blob = await prepareCategoryImage(file);
    if (!effId) throw new Error(T("tile.nameRequired"));
    const path = `${table}/${effId}.png`;
    if (!isDept) await p.must(supabase.from("products").update({ icon_path: null }).eq("id", effId));
    const { error } = await supabase.storage.from("catalog-images").upload(path, blob, { contentType: "image/webp", upsert: true });
    if (error) throw new Error(error.message);
    if (isDept) await p.must(supabase.from(table).update({ image_path: path }).eq("id", effId));
    else await saveProductIcon(effId, blob, path);
    await forgetCatalogImage(path);
    const { data: signed } = await supabase.storage.from("catalog-images").createSignedUrl(path, 600);
    setImagePreview(signed?.signedUrl ?? null);
  });

  const removeProductImage = async () => {
    if (!effId || isDept || !window.confirm(T("tile.removeImageConfirm"))) return;
    setImageBusy(true);
    try {
      await p.run(async () => {
        await p.must(supabase.from("products").update({ image_path: null, icon_path: null }).eq("id", effId));
        if (item && "image_path" in item && item.image_path) await forgetCatalogImage(item.image_path);
        setImagePreview(null);
        setLarge(null);
        await qc.invalidateQueries({ queryKey: ["admin-tile-imgs"] });
      }, T("tile.imageRemoved"));
    } finally { setImageBusy(false); }
  };

  const generateDialogImage = async () => {
    if (!effId) return;
    setImageBusy(true);
    try {
      await p.run(async () => {
        const generated = await genImg({ data: { id: effId, kind: isDept ? "department" : "product", hint: hint.trim() || undefined } });
        await forgetCatalogImage(generated.path);
        if (!isDept) await saveProductIconFromPath(effId, generated.path);
        const { data, error } = await supabase.storage.from("catalog-images").createSignedUrl(generated.path, 600);
        if (error) throw error;
        if (data?.signedUrl) setImagePreview(data.signedUrl);
      }, T("tile.imgDone"));
    } finally { setImageBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/30" onClick={p.onClose}>
      <div className="w-full max-w-[440px] space-y-3 rounded-t-3xl bg-background p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        {picking && effId && <ImagePicker onClose={() => setPicking(false)} onPick={(path) => { setPicking(false); void p.run(async () => {
          if (isDept) await p.must(supabase.from(table).update({ image_path: path }).eq("id", effId));
          else await saveProductIconFromPath(effId, path);
          const { data: signed } = await supabase.storage.from("catalog-images").createSignedUrl(path, 600);
          setImagePreview(signed?.signedUrl ?? null);
        }); }} />}
        <h2 className="text-lg font-bold text-foreground">{item ? T("tile.editItem") : isDept ? T("tile.newCat") : T("tile.newProd")}</h2>
        {enrichStatus && <div role="status" className="text-sm text-foreground">{enriching && <span aria-hidden="true">⏳ </span>}{enrichStatus}</div>}
        {enrichErrors.length > 0 && <ul className="max-h-24 overflow-auto text-xs text-destructive">{enrichErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-4xl">
            {(imagePreview === undefined ? p.imgUrl : imagePreview) ? <ZoomableImage src={(imagePreview === undefined ? p.imgUrl : imagePreview) ?? ""} className="h-full w-full object-cover" /> : emoji || (isDept ? "📁" : "🛒")}
          </div>
          {effId && (
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>{T("tile.upload")}</Button>
                <Button size="sm" variant="outline" onClick={() => setPicking(true)}>🖼️ {T("tile.pickImage")}</Button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
              </div>
              <div className="flex gap-2">
                <Input aria-label={T("tile.aiHint")} placeholder={suggesting ? T("tile.aiSuggestLoading") : T("tile.aiHint")} value={hint} onChange={(e) => setHint(e.target.value)} className="h-10 flex-1 rounded-xl text-sm" />
                {isDept && (
                  <Button size="sm" variant="outline" className="h-10 px-3" disabled={suggesting} aria-label={T("tile.aiSuggestReload")} title={T("tile.aiSuggestReload")} onClick={() => loadSuggestion(true)}>↻</Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={imageBusy || p.busy} onClick={() => void generateDialogImage()}>{imageBusy ? T("adm.working") : isDept || !item ? `✨ ${T("tile.aiImage")}` : `✨ ${T("tile.regenerateImage")}`}</Button>
                {!isDept && item && (imagePreview === undefined ? Boolean(p.imgUrl) : Boolean(imagePreview)) &&
                  <Button size="sm" variant="outline" className="text-destructive" disabled={imageBusy || p.busy} onClick={() => void removeProductImage()}>{T("tile.removeImage")}</Button>}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input aria-label={T("tile.emoji")} placeholder="🙂" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="h-11 w-16 rounded-xl text-center text-xl" />
          <Input aria-label={T("tile.name")} placeholder={T("tile.name")} value={name} onChange={(e) => setName(e.target.value)} className="h-11 flex-1 rounded-xl" />
        </div>
        {!isDept && (
          <div className="flex gap-2">
            <Input aria-label={T("tile.qty")} type="number" min={0} step="any" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-11 w-24 rounded-xl" />
            <select aria-label={T("tile.unit")} value={unit} onChange={(e) => setUnit(e.target.value)} className="h-11 flex-1 rounded-xl border border-input bg-background px-2 text-sm">
              {getUnits(getLocale()).map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        )}
        {!isDept && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input aria-label={T("tile.price")} placeholder={T("tile.price", { market: currentMarket() })} type="number" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 flex-1 rounded-xl" />
              {item && (
                <Button variant="outline" className="h-11 rounded-xl" disabled={estimating} onClick={() => {
                  if (!window.confirm(T("tile.estimateAllConfirm"))) return;
                  setEstimating(true);
                  void p.run(async () => {
                    const r = await estAll({ data: { productId: item.id } });
                    setEstimates(r.items);
                    const mine = r.items.find((x) => x.market === currentMarket());
                    if (mine) setPrice(String(mine.price));
                    void qc.invalidateQueries();
                    if (r.failed > 0) throw new Error(T("tile.estimateAllFailed", { n: r.failed }));
                  }, T("tile.estimateAllDone")).finally(() => setEstimating(false));
                }}>{estimating ? "…" : `✨ ${T("tile.estimateAll")}`}</Button>
              )}
            </div>
            {estimates.length > 0 && (
              <ul className="max-h-40 space-y-0.5 overflow-y-auto rounded-xl bg-muted p-2 text-xs text-foreground">
                {estimates.map((e) => (
                  <li key={e.market}>{e.market} · {e.currency} {e.price.toFixed(2)}{e.unit_price ? ` · ${e.currency} ${e.unit_price.toFixed(2)}/${e.unit_basis}` : ""}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {!isDept && item && heads.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">{T("adm.headingAssign")}</h3>
            <select aria-label={T("adm.headingAssign")} value={headingSel} onChange={(e) => setHeadingSel(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-2 text-sm">
              <option value="">{T("adm.noHeading")}</option>
              {heads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        {!isDept && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">{T("adm.variants")}</h3>
            {variants.length > 0 && (
              <div className="divide-y divide-border rounded-lg border border-border">
                {variants.map((v) => (
                  <div key={v} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
                    <span className="truncate">{v}</span>
                    <button type="button" aria-label={`${v} entfernen`} onClick={() => setVariants((x) => x.filter((y) => y !== v))} className="shrink-0 text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-start gap-2">
              <textarea
                value={variantInput}
                rows={3}
                placeholder={T("adm.variantPlaceholder")}
                onChange={(e) => setVariantInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addVariant(variantInput); } }}
                className="min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="button" variant="outline" onClick={() => addVariant(variantInput)} disabled={!variantInput.trim()}>+</Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_VARIANTS.map((cv) => {
                const on = variants.some((x) => x.toLowerCase() === cv.toLowerCase());
                return (
                  <button key={cv} type="button" disabled={on} onClick={() => addVariant(cv)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/15 text-muted-foreground line-through" : "border-border bg-background text-muted-foreground"}`}>
                    {on ? "✓ " : "+ "}{cv}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">{T("adm.variantsHint")}</p>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          {item && p.onAdvanced && <Button variant="outline" className="h-11 rounded-xl" onClick={() => { p.onAdvanced!(p.target.kind, item.id); p.onClose(); }}>⚙ {T("tile.advanced")}</Button>}
          {item && <Button variant="outline" className="h-11 rounded-xl text-destructive" onClick={() => { p.remove(p.target.kind, item.id, item.name); p.onClose(); }}>{T("tile.delete")}</Button>}
          <Button variant="outline" className="h-11 rounded-xl" onClick={p.onClose}>{T("common.cancel")}</Button>
          <Button className="h-11 flex-1 rounded-xl" disabled={enriching} onClick={() => void save()}>{enriching ? T("adm.working") : T("tile.save")}</Button>
        </div>
      </div>
      {large && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-6" onClick={() => setLarge(null)}>
          <button type="button" aria-label={T("common.cancel")} onClick={() => setLarge(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-xl text-foreground shadow">✕</button>
          <img src={large} alt="" className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </div>
  );
}

function ImagePicker(p: { onClose: () => void; onPick: (path: string) => void }) {
  const list = useServerFn(listProductImages);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const r = useQuery({ queryKey: ["admin-image-picker", q, page], queryFn: () => list({ data: { q, page, perPage: 30 } }) });
  const pages = r.data ? Math.max(1, Math.ceil(r.data.total / r.data.perPage)) : 1;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={(e) => { e.stopPropagation(); p.onClose(); }}>
      <div className="flex max-h-[85vh] w-full max-w-[440px] flex-col gap-3 rounded-t-3xl bg-background p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{T("tile.pickImage")}</h2>
          <button aria-label={T("common.cancel")} onClick={p.onClose} className="text-xl text-muted-foreground">✕</button>
        </div>
        <Input placeholder="🔍" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="h-11 rounded-xl" />
        <div className="grid flex-1 grid-cols-3 gap-2 md:grid-cols-6 overflow-y-auto">
          {r.data?.items.map((it) => (
            <button key={it.id} onClick={() => p.onPick(it.path)} className="flex flex-col items-center gap-1 rounded-xl p-1 hover:bg-muted">
              {it.url ? <img src={it.url} alt="" className="aspect-square w-full rounded-lg object-cover" /> : <div className="aspect-square w-full rounded-lg bg-muted" />}
              <span className="line-clamp-2 text-center text-[11px] text-foreground">{it.name}</span>
            </button>
          ))}
          {r.data && r.data.items.length === 0 && <p className="col-span-3 py-6 text-center text-sm text-muted-foreground">{T("tile.pickEmpty")}</p>}
          {r.isLoading && <p className="col-span-3 py-6 text-center text-sm text-muted-foreground">…</p>}
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
            <span className="text-sm text-muted-foreground">{page + 1} / {pages}</span>
            <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>›</Button>
          </div>
        )}
      </div>
    </div>
  );
}

type Suggestion = { name: string; emoji: string; quantity: number; unit: string; existingId: string | null; relevance: number };

function SuggestSheet(p: Parameters<typeof CatalogTileEditor>[0] & { cur: string; onClose: () => void }) {
  const suggest = useServerFn(suggestCategoryProducts);
  const [keywords, setKeywords] = useState("");
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"relevance" | "alpha" | "loaded">("relevance");

  const load = async (more: boolean) => {
    setBusy(true); setErr(null);
    try {
      const prev = more ? items ?? [] : [];
      const r = await suggest({ data: { departmentId: p.cur, keywords: keywords.trim() || undefined, count: 10, exclude: prev.map((x) => x.name).slice(0, 300) } });
      const have = new Set(prev.map((x) => x.name.toLowerCase()));
      const fresh = r.filter((x) => !have.has(x.name.toLowerCase()));
      setItems([...prev, ...fresh]);
      setSel((o) => { const n = new Set(more ? o : []); fresh.forEach((x) => n.add(x.name)); return n; });
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const shown = (() => {
    const l = [...(items ?? [])];
    if (sortBy === "relevance") l.sort((a, b) => b.relevance - a.relevance);
    else if (sortBy === "alpha") l.sort((a, b) => a.name.localeCompare(b.name));
    return l;
  })();
  const stars = (r: number) => (r >= 70 ? "★★★" : r >= 40 ? "★★" : "★");
  const chosen = (items ?? []).filter((x) => sel.has(x.name));

  const create = () => p.run(async () => {
    const fresh = chosen.filter((s) => !s.existingId);
    const links = chosen.filter((s) => s.existingId);
    const ids: string[] = [];
    if (fresh.length) {
      const r = await supabase.from("products").insert(fresh.map((s, i) => ({
        name: s.name, emoji: s.emoji, department_id: p.cur, default_quantity: s.quantity, default_unit: s.unit as never, sort_order: p.products.length + i + 1,
      }))).select("id");
      if (r.error) throw new Error(r.error.message);
      ids.push(...r.data.map((x) => x.id));
    }
    if (links.length) {
      await p.must(supabase.from("product_aliases").upsert(links.map((s) => ({ product_id: s.existingId!, department_id: p.cur })), { onConflict: "product_id,department_id", ignoreDuplicates: true }));
    }
    for (let i = 0; i < ids.length; i += 120) await p.translateIds(ids.slice(i, i + 120));
    p.onClose();
  }, T("tile.suggestDone", { n: chosen.length }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={p.onClose}>
      <div className="max-h-[85vh] w-full max-w-[440px] space-y-3 overflow-y-auto rounded-t-2xl bg-background p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{T("tile.suggest")}</h2>
          <button type="button" onClick={p.onClose} className="text-xl">✕</button>
        </div>
        <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={T("tile.suggestKeywords")} />
        <Button className="w-full" variant={items ? "outline" : "default"} disabled={busy} onClick={() => void load(false)}>
          {busy ? T("tile.suggestBusy") : items ? T("tile.suggestAgain") : T("tile.suggestGo")}
        </Button>
        {err && <p className="text-sm text-destructive">{err}</p>}
        {items && items.length === 0 && <p className="text-sm text-muted-foreground">{T("tile.suggestEmpty")}</p>}
        {items && items.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            {T("tile.suggestSort")}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-foreground">
              <option value="relevance">{T("tile.sortRelevance")}</option>
              <option value="alpha">{T("tile.sortAlpha")}</option>
              <option value="loaded">{T("tile.sortLoaded")}</option>
            </select>
          </label>
        )}
        {items && items.length > 0 && (
          <div className="divide-y divide-border rounded-xl border border-border">
            {shown.map((s) => (
              <label key={s.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                <input type="checkbox" checked={sel.has(s.name)} onChange={() => setSel((o) => { const n = new Set(o); if (n.has(s.name)) n.delete(s.name); else n.add(s.name); return n; })} />
                <span className="text-xl">{s.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.quantity} {getUnits(getLocale()).find((u) => u.id === s.unit)?.label ?? s.unit}
                    {s.existingId ? ` · ${T("tile.suggestLink")}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-primary" title={String(s.relevance)}>{stars(s.relevance)}</span>
              </label>
            ))}
          </div>
        )}
        {items && items.length > 0 && (
          <Button variant="outline" className="w-full" disabled={busy} onClick={() => void load(true)}>{busy ? T("tile.suggestBusy") : T("tile.suggestMore")}</Button>
        )}
        {items && items.length > 0 && (
          <Button className="w-full" disabled={sel.size === 0} onClick={create}>{T("tile.suggestCreate", { n: sel.size })}</Button>
        )}
      </div>
    </div>
  );
}
