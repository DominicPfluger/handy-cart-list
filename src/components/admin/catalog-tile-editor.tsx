import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { getUnits } from "@/lib/units";
import { rootColorByName } from "@/lib/dept-colors";
import { prepareCategoryImage } from "@/lib/image-upload";
import { generateImageFor, listProductImages } from "@/lib/product-media.functions";
import { suggestCategoryProducts, translateVariants } from "@/lib/admin.functions";
import { currentMarket, formatRefPrice, type RefPrice } from "@/hooks/use-reference-prices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageZoomOverlay, ZoomableImage } from "@/components/admin/zoomable-image";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

const MARKET_CCY: Record<string, string> = { CH: "CHF", DE: "EUR", AT: "EUR", FR: "EUR", ES: "EUR", MX: "MXN", IT: "EUR", BE: "EUR", NL: "EUR", GB: "GBP", US: "USD", CA: "CAD", PT: "EUR", BR: "BRL" };

export type TileDept = { id: string; name: string; emoji: string | null; parent_id: string | null; sort_order: number; image_path: string | null };
export type TileProd = { id: string; name: string; emoji: string | null; department_id: string; default_quantity: number; default_unit: string; image_path?: string | null; variants?: string[] };

const COMMON_VARIANTS = ["Bio", "Vollkorn", "vegan", "laktosefrei", "glutenfrei", "zuckerfrei", "light", "groß", "klein", "mild", "scharf"];

type Target = { kind: "department" | "product"; id: string | null } | null;
type Drag = { kind: "department" | "product"; id: string; index: number; x: number; y: number; label: string } | null;

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
  onSortRelevance?: (() => void) | undefined;
  busy?: boolean;
}) {
  const [editMode, setEditMode] = useState(true);
  const [target, setTarget] = useState<Target>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [over, setOver] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const moved = useRef(false);
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
  const startDrag = (e: React.PointerEvent, kind: "department" | "product", id: string, index: number, label: string) => {
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
    setOver(t ? `${t.kind}:${t.id}` : null);
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag;
    setDrag(null); setOver(null);
    if (!d || !moved.current) return;
    const t = dropAt(e.clientX, e.clientY);
    if (!t || t.id === d.id) return;
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

  const dragHandlers = { onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: () => { setDrag(null); setOver(null); } };
  const click = (fn: () => void) => () => { if (moved.current) { moved.current = false; return; } fn(); };

  return (
    <div className="space-y-3">
      <div className="flex rounded-xl bg-muted p-1 text-sm font-semibold">
        {([true, false] as const).map((m) => (
          <button key={String(m)} type="button" onClick={() => { setEditMode(m); setTarget(null); }}
            className={`flex-1 rounded-lg py-1.5 ${editMode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {m ? T("tile.edit") : T("tile.preview")}
          </button>
        ))}
      </div>
      {editMode && <p className="text-xs text-muted-foreground">{T("tile.hint")}</p>}

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

      {(p.children.length > 0 || editMode) && (
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-5 xl:grid-cols-7">
          {p.children.map((c, i) => (
            <div key={c.id} data-drop="department" data-id={c.id} data-index={i}
              style={{ background: rootColorByName(rootName(c)) }}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl bg-primary-soft p-2.5 ${drag?.id === c.id ? "opacity-40" : ""} ${over === `department:${c.id}` ? "ring-2 ring-primary" : ""}`}>
              <button type="button" aria-label={p.nm(c.id, c.name)}
                onPointerDown={(e) => startDrag(e, "department", c.id, i, c.emoji ?? "📁")} {...dragHandlers}
                onClick={click(() => p.setCur(c.id))}
                onDoubleClick={() => { const u = img(c.image_path); if (u) setZoom(u); }}
                className={`flex h-16 w-full items-center justify-center overflow-hidden rounded-xl text-4xl ${editMode ? "cursor-grab touch-none" : ""}`}>
                {img(c.image_path) ? <ZoomableImage src={img(c.image_path)!} className="h-full w-full object-cover" /> : c.emoji ?? "📁"}
              </button>
              <span className="line-clamp-2 text-center text-[13px] font-bold leading-tight text-foreground">{p.nm(c.id, c.name)}</span>
              {editMode && (
                <button type="button" onClick={() => setTarget({ kind: "department", id: c.id })} aria-label={T("tile.editItem")}
                  className="absolute right-1 top-1 rounded-full bg-background/80 px-1.5 text-xs">✎</button>
              )}
            </div>
          ))}
          {editMode && (
            <button type="button" onClick={() => setTarget({ kind: "department", id: null })}
              className="flex min-h-28 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground">
              <span className="text-2xl">+</span>{T("tile.newCat")}
            </button>
          )}
        </div>
      )}

      {p.cur && (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {p.products.map((x, i) => {
            const price = p.prices?.get(x.id);
            return (
              <div key={x.id} data-drop="product" data-id={x.id} data-index={i}
                className={`flex items-center gap-3 px-3 py-2 ${drag?.id === x.id ? "opacity-40" : ""} ${over === `product:${x.id}` ? "bg-primary-soft" : ""} ${p.unavailable(x) ? "opacity-50" : ""}`}>
                <span onPointerDown={(e) => startDrag(e, "product", x.id, i, x.emoji ?? "•")} {...dragHandlers} onDoubleClick={() => { const u = img(x.image_path); if (u) setZoom(u); }}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-2xl ${editMode ? "cursor-grab touch-none" : ""}`}>
                  {img(x.image_path) ? <ZoomableImage src={img(x.image_path)!} className="h-full w-full object-cover" /> : x.emoji ?? "🛒"}
                </span>
                <button type="button" disabled={!editMode} onClick={click(() => setTarget({ kind: "product", id: x.id }))} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-semibold text-foreground">{p.nm(x.id, x.name)}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {x.default_quantity} {getUnits(getLocale()).find((u) => u.id === x.default_unit)?.label ?? x.default_unit}
                    {price ? ` · ${formatRefPrice(price)}` : ""}
                  </div>
                </button>
              </div>
            );
          })}
          {editMode && (
            <button type="button" onClick={() => setTarget({ kind: "product", id: null })}
              className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold text-primary">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-dashed border-border text-xl">+</span>{T("tile.newProd")}
            </button>
          )}
          {editMode && (
            <button type="button" onClick={() => setSuggesting(true)}
              className="flex w-full items-center gap-3 px-3 py-3 text-sm font-semibold text-primary">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-xl">✨</span>{T("tile.suggest")}
            </button>
          )}
        </div>
      )}

      {p.cur && editMode && p.onSortRelevance && (
        <button type="button" disabled={p.busy} onClick={p.onSortRelevance}
          className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm font-semibold text-primary disabled:opacity-50">
          ↕ {p.busy ? T("adm.working") : T("adm.sortRelevance")}
        </button>
      )}

      {suggesting && p.cur && <SuggestSheet {...p} cur={p.cur} onClose={() => setSuggesting(false)} />}

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
  const isDept = p.target.kind === "department";
  const item = p.target.id ? (isDept ? p.depts.find((d) => d.id === p.target.id) : p.products.find((x) => x.id === p.target.id)) : undefined;
  const prod = !isDept ? (item as TileProd | undefined) : undefined;
  const [name, setName] = useState(item?.name ?? "");
  const [emoji, setEmoji] = useState(item?.emoji ?? "");
  const [qty, setQty] = useState(prod?.default_quantity ?? 1);
  const [unit, setUnit] = useState(prod?.default_unit ?? "stueck");
  const [hint, setHint] = useState("");
  const [large, setLarge] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [picking, setPicking] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [variants, setVariants] = useState<string[]>(prod?.variants ?? []);
  const [variantInput, setVariantInput] = useState("");
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

  const save = () => p.run(async () => {
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
      await p.translateIds([id]);
      if (!isDept) void trVariants({ data: { productId: id } }).catch(() => {});
      setNewId(id);
    }
    if (!isDept && id && price.trim() && !Number.isNaN(Number(price))) {
      const market = currentMarket();
      await p.must(supabase.from("product_reference_prices").upsert({ product_id: id, market, price: Number(price), currency: MARKET_CCY[market] ?? "EUR" }, { onConflict: "product_id,market" }));
    }
    // Bei neuen Einträgen offen lassen, damit gleich ein Bild ergänzt werden kann.
    if (item) p.onClose();
  });

  const upload = (file: File) => p.run(async () => {
    const blob = await prepareCategoryImage(file);
    const path = `${table}/${effId!}.png`;
    const { error } = await supabase.storage.from("catalog-images").upload(path, blob, { contentType: "image/webp", upsert: true });
    if (error) throw new Error(error.message);
    await p.must(supabase.from(table).update({ image_path: path }).eq("id", effId!));
  });

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/30" onClick={p.onClose}>
      <div className="w-full max-w-[440px] space-y-3 rounded-t-3xl bg-background p-5 pb-8" onClick={(e) => e.stopPropagation()}>
        {picking && effId && <ImagePicker onClose={() => setPicking(false)} onPick={(path) => { setPicking(false); void p.run(() => p.must(supabase.from(table).update({ image_path: path }).eq("id", effId))); }} />}
        <h2 className="text-lg font-bold text-foreground">{item ? T("tile.editItem") : isDept ? T("tile.newCat") : T("tile.newProd")}</h2>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted text-4xl">
            {p.imgUrl ? <ZoomableImage src={p.imgUrl} className="h-full w-full object-cover" /> : emoji || (isDept ? "📁" : "🛒")}
          </div>
          {effId && (
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>{T("tile.upload")}</Button>
                <Button size="sm" variant="outline" onClick={() => setPicking(true)}>🖼️ {T("tile.pickImage")}</Button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
              </div>
              <Input aria-label={T("tile.aiHint")} placeholder={T("tile.aiHint")} value={hint} onChange={(e) => setHint(e.target.value)} className="h-10 rounded-xl text-sm" />
              <Button size="sm" variant="outline" className="self-start" onClick={() => p.run(async () => {
                await genImg({ data: { id: effId, kind: isDept ? "department" : "product", hint: hint.trim() || undefined } });
                const { data } = await supabase.storage.from("catalog-images").createSignedUrl(`${table}/${effId}.png`, 600);
                if (data?.signedUrl) setLarge(data.signedUrl);
              }, T("tile.imgDone"))}>✨ {T("tile.aiImage")}</Button>
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
          <Input aria-label={T("tile.price")} placeholder={T("tile.price", { market: currentMarket() })} type="number" min={0} step="any" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11 rounded-xl" />
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
          {item && <Button variant="outline" className="h-11 rounded-xl text-destructive" onClick={() => { p.remove(p.target.kind, item.id, item.name); p.onClose(); }}>{T("tile.delete")}</Button>}
          <Button variant="outline" className="h-11 rounded-xl" onClick={p.onClose}>{T("common.cancel")}</Button>
          <Button className="h-11 flex-1 rounded-xl" onClick={() => void save()}>{T("tile.save")}</Button>
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

type Suggestion = { name: string; emoji: string; quantity: number; unit: string; existingId: string | null };

function SuggestSheet(p: Parameters<typeof CatalogTileEditor>[0] & { cur: string; onClose: () => void }) {
  const suggest = useServerFn(suggestCategoryProducts);
  const [keywords, setKeywords] = useState("");
  const [items, setItems] = useState<Suggestion[] | null>(null);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await suggest({ data: { departmentId: p.cur, keywords: keywords.trim() || undefined } });
      setItems(r); setSel(new Set(r.map((_, i) => i)));
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const chosen = (items ?? []).filter((_, i) => sel.has(i));

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
        <Button className="w-full" variant={items ? "outline" : "default"} disabled={busy} onClick={load}>
          {busy ? T("tile.suggestBusy") : items ? T("tile.suggestAgain") : T("tile.suggestGo")}
        </Button>
        {err && <p className="text-sm text-destructive">{err}</p>}
        {items && items.length === 0 && <p className="text-sm text-muted-foreground">{T("tile.suggestEmpty")}</p>}
        {items && items.length > 0 && (
          <div className="divide-y divide-border rounded-xl border border-border">
            {items.map((s, i) => (
              <label key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                <input type="checkbox" checked={sel.has(i)} onChange={() => setSel((o) => { const n = new Set(o); if (n.has(i)) n.delete(i); else n.add(i); return n; })} />
                <span className="text-xl">{s.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.quantity} {getUnits(getLocale()).find((u) => u.id === s.unit)?.label ?? s.unit}
                    {s.existingId ? ` · ${T("tile.suggestLink")}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        {items && items.length > 0 && (
          <Button className="w-full" disabled={sel.size === 0} onClick={create}>{T("tile.suggestCreate", { n: sel.size })}</Button>
        )}
      </div>
    </div>
  );
}
