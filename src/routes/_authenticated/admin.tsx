import { BulkTreeForm, type TreeBlock } from "@/components/admin/bulk-tree-form";
import { VariantImageButton } from "@/components/admin/variant-image-button";
import { VariantAiBulkButton } from "@/components/admin/variant-ai-dialog";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin, translateMissing, saveHeading, deleteHeading, suggestProducts, rankProducts, translateVariants, suggestVariants, createBulkBackup, undoBulkBackup } from "@/lib/admin.functions";
import { LOCALES, getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);
import { getUnits } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCuisinePicker } from "@/components/cuisine-admin";

import { DeptAliasEditor, KEY as DEPT_ALIAS_KEY, loadAliases as loadDeptAliases } from "@/components/dept-alias-admin";
import { ProductBrandEditor } from "@/components/brand-admin";
import { ProductSynonymEditor } from "@/components/admin/synonym-editor";
import { ProductAliasEditor, KEY as ALIAS_KEY, loadAliases } from "@/components/product-alias-admin";
import { DeptImageEditor } from "@/components/dept-image-admin";
import { ZoomableImage } from "@/components/admin/zoomable-image";
import { signedCategoryImageUrl } from "@/lib/image-upload";
import { deptTreeOrder } from "@/lib/dept-order";
import { isNonFoodRootName } from "@/lib/dept-colors";
import { MarketAdmin, MarketAdminsManager } from "@/components/market-admin";
import { useMarketCodes } from "@/hooks/use-markets";
import { flagOf } from "@/lib/catalog-query";
import { DIETS, DIET_EMOJI } from "@/hooks/use-diet-filter";
import { AiImageOptionSelects, DEFAULT_AI_IMAGE_OPTS, type AiImageOpts } from "@/components/admin/ai-image-options";
import { generateImageFor } from "@/lib/product-media.functions";
import { saveProductIconFromPath } from "@/lib/product-icon";
import type { HeadingGroup } from "@/components/admin/heading-ai-dialog";
import { useReferencePrices } from "@/hooks/use-reference-prices";

// Schwere Admin-Bereiche werden erst beim Öffnen des jeweiligen Tabs geladen.
const CatalogTileEditor = lazy(() => import("@/components/admin/catalog-tile-editor").then((m) => ({ default: m.CatalogTileEditor })));
const CatalogMediaPanel = lazy(() => import("@/components/admin/catalog-media-panel").then((m) => ({ default: m.CatalogMediaPanel })));
const CatalogHealthPanel = lazy(() => import("@/components/admin/catalog-health-panel").then((m) => ({ default: m.CatalogHealthPanel })));
const LocaleAdminPanel = lazy(() => import("@/components/admin/locale-admin-panel").then((m) => ({ default: m.LocaleAdminPanel })));
const SpeechTextsPanel = lazy(() => import("@/components/admin/speech-texts-panel").then((m) => ({ default: m.SpeechTextsPanel })));
const UnitsPanel = lazy(() => import("@/components/admin/units-panel").then((m) => ({ default: m.UnitsPanel })));
const MarketsManager = lazy(() => import("@/components/admin/markets-manager").then((m) => ({ default: m.MarketsManager })));
const ImportPanel = lazy(() => import("@/components/admin/import-panel").then((m) => ({ default: m.ImportPanel })));
const MarketDataImport = lazy(() => import("@/components/admin/market-data-import").then((m) => ({ default: m.MarketDataImport })));
const CatalogPreview = lazy(() => import("@/components/admin/catalog-preview").then((m) => ({ default: m.CatalogPreview })));
const HeadingAiDialog = lazy(() => import("@/components/admin/heading-ai-dialog").then((m) => ({ default: m.HeadingAiDialog })));
const RecipeAdmin = lazy(() => import("@/components/recipe-admin").then((m) => ({ default: m.RecipeAdmin })));
const RecipeAssignAdmin = lazy(() => import("@/components/recipe-admin").then((m) => ({ default: m.RecipeAssignAdmin })));
const RecipeTraitsAdmin = lazy(() => import("@/components/recipe-traits-admin").then((m) => ({ default: m.RecipeTraitsAdmin })));
const CuisineAdmin = lazy(() => import("@/components/cuisine-admin").then((m) => ({ default: m.CuisineAdmin })));


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Shoppi — Admin-Panel Katalog" },
      { name: "description", content: "Kategorien, Produkte, Überschriften und Übersetzungen des Shoppi-Katalogs auf einer Seite verwalten." },
      { property: "og:title", content: "Shoppi — Admin-Panel Katalog" },
      { property: "og:description", content: "Kategorien, Produkte, Überschriften und Sprachen verwalten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Kind = "department" | "product" | "heading";
type Dept = { id: string; name: string; emoji: string | null; parent_id: string | null; sort_order: number; image_path: string | null; icon_path: string | null };
type Prod = { id: string; name: string; emoji: string | null; department_id: string; sort_order: number; default_quantity: number; default_unit: string; excluded_diets: string[]; variants: string[]; markets: string[]; image_path: string | null; icon_path: string | null };
type Head = { id: string; name: string; department_id: string; before_product_id: string };
type Tr = { entity_id: string; locale: string; name: string; is_manual: boolean };
type Sel = { kind: Kind; id: string } | null;

async function paged<T>(fn: (from: number, to: number) => PromiseLike<{ data: T[] | null }>) {
  const all: T[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await fn(f, f + 999);
    all.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return all;
}

async function loadAll() {
  const [depts, prods, heads, trs, mo, mx] = await Promise.all([
    paged<Dept>((a, b) => supabase.from("departments").select("id, name, emoji, parent_id, sort_order, image_path, icon_path").order("sort_order").order("id").range(a, b)),
    paged<Prod>((a, b) => supabase.from("products").select("id, name, emoji, department_id, sort_order, default_quantity, default_unit, excluded_diets, variants, markets, image_path, icon_path").order("sort_order").order("id").range(a, b) as never),
    paged<Head>((a, b) => supabase.from("product_headings").select("id, name, department_id, before_product_id").order("id").range(a, b)),
    paged<Tr>((a, b) => supabase.from("catalog_translations").select("entity_id, locale, name, is_manual").order("id").range(a, b)),
    paged<{ product_id: string; market: string; sort_order: number }>((a, b) => supabase.from("product_market_order").select("product_id, market, sort_order").order("id").range(a, b)),
    paged<{ product_id: string; market: string }>((a, b) => supabase.from("product_market_exclusions").select("product_id, market").order("id").range(a, b)),
  ]);
  const tr = new Map<string, Record<string, Tr>>();
  for (const t of trs) tr.set(t.entity_id, { ...(tr.get(t.entity_id) ?? {}), [t.locale]: t });
  const order = new Map(mo.map((o) => [`${o.product_id}|${o.market}`, o.sort_order]));
  const excl = new Set(mx.map((o) => `${o.product_id}|${o.market}`));
  return { depts, prods, heads, tr, order, excl };
}

type AdminData = Awaited<ReturnType<typeof loadAll>>;

const TABLE = { department: "departments", product: "products" } as const;

function AdminPage() {
  const MARKETS = useMarketCodes();
  const qc = useQueryClient();
  const check = useServerFn(checkAdmin);
  const translate = useServerFn(translateMissing);
  const saveH = useServerFn(saveHeading);
  const delH = useServerFn(deleteHeading);
  const suggest = useServerFn(suggestProducts);
  const genImgFor = useServerFn(generateImageFor);
  const trVariants = useServerFn(translateVariants);
  const rank = useServerFn(rankProducts);
  const [sortBy, setSortBy] = useState<"popularity" | "alphabetical" | "price" | "similarity" | "marketRelevance">("popularity");
  /** "" = globale Reihenfolge, sonst Marktcode (z. B. CH) für marktspezifische Relevanz. */
  const [mk, setMk] = useState<string>("");
  /** Anzeigesprache des Katalogs im Admin (nur Anzeige, Bearbeitung bleibt Deutsch). */
  const [viewLoc, setViewLoc] = useState<string>("de-DE");
  const admin = useQuery({ queryKey: ["admin-check"], queryFn: () => check() });
  const q = useQuery({ queryKey: ["admin-catalog"], queryFn: loadAll, enabled: Boolean(admin.data?.isAdmin) });
  const [cur, setCur] = useState<string | null>(null);
  const [sel, setSel] = useState<Sel>(null);
  const [imageEditor, setImageEditor] = useState<{ kind: "product"; id: string } | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [bulk, setBulk] = useState<false | "plain" | "suggest">(false);
  const [bulkTree, setBulkTree] = useState(false);
  const [sortDlg, setSortDlg] = useState<string | null>(null);
  /** Aktiver Admin-Bereich (Tabs). */
  const [tab, setTab] = useState<"catalog" | "media" | "prices" | "import" | "recipes" | "cuisines" | "languages" | "markets" | "health" | "speech" | "units" | "more">("catalog");
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("shoppi:admin-tiles", { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent("shoppi:admin-tiles", { detail: false }));
    };
  }, []);
  const refPrices = useReferencePrices();

  const d = q.data;
  const deptById = useMemo(() => new Map((d?.depts ?? []).map((x) => [x.id, x])), [d]);
  const path = (id: string | null) => {
    const out: Dept[] = [];
    let c = id ? deptById.get(id) : undefined;
    while (c) { out.unshift(c); c = c.parent_id ? deptById.get(c.parent_id) : undefined; }
    return out;
  };
  const deptAliasQ = useQuery({ queryKey: DEPT_ALIAS_KEY, queryFn: loadDeptAliases });
  // Alias-Kategorien an ihrer Position einmischen (wie in der App-Abteilungsansicht).
  const children = useMemo(() => {
    const own = (d?.depts ?? []).filter((x) => x.parent_id === cur);
    if (!cur || !d) return own;
    const byId = new Map(d.depts.map((x) => [x.id, x]));
    const extra = (deptAliasQ.data ?? []).filter((a) => a.parent_id === cur).flatMap((a) => {
      const x = byId.get(a.department_id);
      return x && x.parent_id !== cur ? [{ ...x, id: `deptalias:${a.id}`, sort_order: a.sort_order, alias_id: a.id, dept_id: x.id }] : [];
    });
    if (!extra.length) return own;
    return [...own, ...extra].sort((a, b) => a.sort_order - b.sort_order);
  }, [d, cur, deptAliasQ.data]);
  const ownProducts = useMemo(() => {
    const base = (d?.prods ?? []).filter((x) => x.department_id === cur);
    if (!mk || !d) return base;
    const avail = base.filter((p) => (p.markets.length === 0 || p.markets.includes(mk)) && !d.excl.has(`${p.id}|${mk}`));
    const rest = base.filter((p) => !avail.includes(p));
    const pos = (p: Prod) => d.order.get(`${p.id}|${mk}`);
    avail.sort((a, b) => {
      const pa = pos(a), pb = pos(b);
      if (pa != null && pb != null) return pa - pb;
      if (pa != null) return -1;
      if (pb != null) return 1;
      return a.sort_order - b.sort_order;
    });
    return [...avail, ...rest];
  }, [d, cur, mk]);
  const aliasQ = useQuery({ queryKey: ALIAS_KEY, queryFn: loadAliases });
  // Alias-Produkte an ihrer Alias-Position einmischen (wie in der App-Abteilungsansicht).
  const products = useMemo(() => {
    if (!cur || !d) return ownProducts;
    const byId = new Map(d.prods.map((x) => [x.id, x]));
    const extra = (aliasQ.data ?? []).filter((a) => a.department_id === cur).flatMap((a) => {
      const p = byId.get(a.product_id);
      return p && p.department_id !== cur ? [{ ...p, id: `alias:${a.id}`, sort_order: a.sort_order, alias_id: a.id, product_id: p.id }] : [];
    });
    if (!extra.length) return ownProducts;
    if (mk) return [...ownProducts, ...extra];
    return [...ownProducts, ...extra].sort((a, b) => a.sort_order - b.sort_order);
  }, [ownProducts, aliasQ.data, cur, d, mk]);
  const unavailable = (p: Prod) => Boolean(mk && d && ((p.markets.length > 0 && !p.markets.includes(mk)) || d.excl.has(`${p.id}|${mk}`)));
  const headings = (d?.heads ?? []).filter((x) => x.department_id === cur);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    await qc.invalidateQueries({ queryKey: ["catalog"] });
    await qc.invalidateQueries({ queryKey: ["catalog-images"] });
  };
  const run = async (fn: () => Promise<unknown>, ok: string | null = T("adm.saved")) => {
    setBusy(true);
    try { await fn(); if (ok !== null) toast.success(ok); await refresh(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  const must = async (p: PromiseLike<{ error: { message: string } | null }>) => { const r = await p; if (r.error) throw new Error(r.error.message); };

  const translateIds = async (ids?: string[]) => {
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const r = await translate({ data: { ids, limit: 120 } });
      total += r.written;
      if (r.remaining === 0) break;
    }
    return total;
  };

  const reorder = (kind: "department" | "product", list: { id: string }[], from: number, to: number) => {
    if (from < 0 || from >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    const at = Math.max(0, Math.min(to > from ? to - 1 : to, next.length));
    if (at === from) return;
    next.splice(at, 0, item!);
    // Sofort anzeigen – das Neuladen des ganzen Katalogs dauert einige Sekunden.
    const pos = new Map(next.map((x, i) => [x.id, i + 1]));
    const key = kind === "department" ? "depts" : "prods";
    if (kind === "department" || !mk) {
      qc.setQueryData(["admin-catalog"], (old: Record<string, unknown> | undefined) => {
        if (!old) return old;
        const arr = (old[key] as Array<{ id: string; sort_order: number }>).map((x) => (pos.has(x.id) ? { ...x, sort_order: pos.get(x.id)! } : x));
        arr.sort((a, b) => a.sort_order - b.sort_order || (a.id < b.id ? -1 : 1));
        return { ...old, [key]: arr };
      });
    }
    if (kind === "product") {
      qc.setQueryData(ALIAS_KEY, (old: Array<{ id: string; sort_order: number }> | undefined) =>
        old?.map((a) => (pos.has(`alias:${a.id}`) ? { ...a, sort_order: pos.get(`alias:${a.id}`)! } : a)));
    }
    if (kind === "department") {
      qc.setQueryData(DEPT_ALIAS_KEY, (old: Array<{ id: string; sort_order: number }> | undefined) =>
        old?.map((a) => (pos.has(`deptalias:${a.id}`) ? { ...a, sort_order: pos.get(`deptalias:${a.id}`)! } : a)));
    }
    run(async () => {
      if (kind === "product") { await saveOrder(next); await qc.invalidateQueries({ queryKey: ALIAS_KEY }); }
      else {
        const aliases = next.map((x, i) => [x.id, i + 1] as const).filter(([id]) => id.startsWith("deptalias:"));
        await Promise.all(aliases.map(([id, n]) => must(supabase.from("department_aliases").update({ sort_order: n }).eq("id", id.slice(10)))));
        await Promise.all(next.map((x, i) => [x, i + 1] as const).filter(([x]) => !x.id.startsWith("deptalias:"))
          .map(([x, n]) => must(supabase.from(TABLE[kind]).update({ sort_order: n }).eq("id", x.id))));
        await qc.invalidateQueries({ queryKey: DEPT_ALIAS_KEY });
      }
    }, T("adm.orderSaved"));
  };

  /** Produkt-Reihenfolge speichern: global in products, sonst pro Markt in product_market_order. Aliase: product_aliases. */
  const saveOrder = async (all: { id: string }[]) => {
    const aliases = all.map((x, i) => [x.id, i + 1] as const).filter(([id]) => id.startsWith("alias:"));
    await Promise.all(aliases.map(([id, n]) => must(supabase.from("product_aliases").update({ sort_order: n }).eq("id", id.slice(6)))));
    const list = all.filter((x) => !x.id.startsWith("alias:"));
    if (!mk) {
      await Promise.all(all.map((x, i) => [x, i + 1] as const).filter(([x]) => !x.id.startsWith("alias:"))
        .map(([x, n]) => must(supabase.from("products").update({ sort_order: n }).eq("id", x.id))));
      return;
    }
    await must(supabase.from("product_market_order").upsert(
      list.map((x, i) => ({ product_id: x.id, market: mk, sort_order: i + 1 })),
      { onConflict: "product_id,market" },
    ));
  };

  /** Überschrift verschieben: die ganze Gruppe (Überschrift + ihre Produkte bis zur nächsten Überschrift) wandert mit. */
  /** insertAt = Einfügeposition in `products` (0..n); mode "title" = nur Überschrift, "group" = mit ihren Produkten. */
  const moveHeading = (headingId: string, insertAt: number, mode: "title" | "group") => {
    const h = d?.heads.find((x) => x.id === headingId);
    if (!h) return;
    const others = d?.heads.filter((x) => x.id !== headingId && x.department_id === h.department_id) ?? [];
    const anchors = new Set(others.map((x) => x.before_product_id));
    const firstOwn = (list: { id: string }[], from: number) => list.slice(from).find((p) => !p.id.startsWith("alias:"));
    const start = products.findIndex((p) => p.id === h.before_product_id);
    if (mode === "title" || start < 0) {
      const anchor = firstOwn(products, insertAt);
      if (!anchor) { toast.error(T("adm.headingMoveNoTarget")); return; }
      if (anchor.id === h.before_product_id) return;
      if (anchors.has(anchor.id)) { toast.error(T("adm.headingMoveTaken")); return; }
      run(() => saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: anchor.id } }), T("adm.headingMoved"));
      return;
    }
    let end = start + 1;
    while (end < products.length && !anchors.has(products[end]!.id)) end++;
    if (insertAt >= start && insertAt <= end) return; // gleiche Stelle
    const group = products.slice(start, end);
    const rest = products.filter((p) => !group.includes(p));
    const at = insertAt > start ? insertAt - group.length : insertAt;
    const next = [...rest.slice(0, at), ...group, ...rest.slice(at)];
    const anchor = firstOwn(group, 0);
    if (!anchor) { toast.error(T("adm.headingMoveNoTarget")); return; }
    run(async () => {
      await saveOrder(next);
      await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: anchor.id } });
      await qc.invalidateQueries({ queryKey: ALIAS_KEY });
    }, T("adm.headingMoved"));
  };
  /** Produkt wurde direkt unter eine Überschrift gezogen: Überschrift an dieses Produkt hängen. */
  const setHeadingAnchor = (headingId: string, productId: string) => {
    const h = d?.heads.find((x) => x.id === headingId);
    if (!h || productId.startsWith("alias:")) return;
    void run(() => saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: productId } }), T("adm.headingMoved"));
  };

  /** Produkt unter eine Überschrift verschieben (ans Ende der Gruppe; "" = ganz nach oben, vor die erste Überschrift). */
  /** Produkt an Position `to` (0..n in `list`) einfügen und der Überschrift `headingId` ("" = keine) zuordnen.
   *  Danach wird jede Überschrift auf das erste eigene Produkt ihrer Gruppe neu verankert. */
  const moveProduct = (list: { id: string }[], productIds: string | string[], to: number, headingId: string) => {
    const sel = new Set(Array.isArray(productIds) ? productIds : [productIds]);
    const block = list.filter((x) => sel.has(x.id));
    if (block.length === 0) return;
    const isOwn = (id: string) => !id.startsWith("alias:");
    // Gruppen vor dem Verschieben ermitteln
    const anchorIdx = headings.map((h) => ({ h, i: list.findIndex((x) => x.id === h.before_product_id) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
    const members = new Map<string, Set<string>>();
    anchorIdx.forEach(({ h, i }, k) => {
      const end = anchorIdx[k + 1]?.i ?? list.length;
      members.set(h.id, new Set(list.slice(i, end).map((x) => x.id)));
    });
    for (const s of members.values()) for (const id of sel) s.delete(id);
    if (headingId) { const m = members.get(headingId); if (m) for (const id of sel) m.add(id); }
    const rest = list.filter((x) => !sel.has(x.id));
    const before = list.slice(0, to).filter((x) => sel.has(x.id)).length;
    const at = Math.max(0, Math.min(to - before, rest.length));
    const next = [...rest.slice(0, at), ...block, ...rest.slice(at)];
    const changed = next.some((x, i) => x.id !== list[i]!.id);
    // Neue Anker
    const used = new Set<string>();
    const updates: { h: Head; anchor: string }[] = [];
    for (const { h } of anchorIdx) {
      const m = members.get(h.id)!;
      let anchor = next.find((x) => m.has(x.id) && isOwn(x.id))?.id;
      if (!anchor) {
        // Leere Gruppe: Überschrift bleibt an ihrer Stelle, vor dem nächsten eigenen Produkt
        const oldPos = list.findIndex((x) => x.id === h.before_product_id);
        const after = list.slice(oldPos + 1).find((x) => isOwn(x.id) && !sel.has(x.id) && !used.has(x.id));
        anchor = after?.id ?? h.before_product_id;
      }
      used.add(anchor);
      if (anchor !== h.before_product_id) updates.push({ h, anchor });
    }
    if (!changed && updates.length === 0) return;
    const pos = new Map(next.map((x, i) => [x.id, i + 1]));
    if (!mk) {
      qc.setQueryData(["admin-catalog"], (old: Record<string, unknown> | undefined) => {
        if (!old) return old;
        const prods = (old["prods"] as Array<{ id: string; sort_order: number }>).map((x) => (pos.has(x.id) ? { ...x, sort_order: pos.get(x.id)! } : x));
        prods.sort((a, b) => a.sort_order - b.sort_order || (a.id < b.id ? -1 : 1));
        const up = new Map(updates.map((u) => [u.h.id, u.anchor]));
        const heads = (old["heads"] as Head[] | undefined)?.map((h) => (up.has(h.id) ? { ...h, before_product_id: up.get(h.id)! } : h));
        return { ...old, prods, ...(heads ? { heads } : {}) };
      });
    }
    qc.setQueryData(ALIAS_KEY, (old: Array<{ id: string; sort_order: number }> | undefined) =>
      old?.map((a) => (pos.has(`alias:${a.id}`) ? { ...a, sort_order: pos.get(`alias:${a.id}`)! } : a)));
    run(async () => {
      if (changed) await saveOrder(next);
      for (const u of updates) await saveH({ data: { id: u.h.id, departmentId: u.h.department_id, beforeProductId: u.anchor } });
      await qc.invalidateQueries({ queryKey: ALIAS_KEY });
    }, T("adm.orderSaved"));
  };

  const assignHeading = async (productId: string, headingId: string) => {
    const prod0 = d?.prods.find((x) => x.id === productId);
    if (!d || !prod0) return;
    const list = d.prods.filter((x) => x.department_id === prod0.department_id).slice().sort((a, b) => a.sort_order - b.sort_order);
    const heads = d.heads.filter((h) => h.department_id === prod0.department_id);
    const myIdx = list.findIndex((x) => x.id === productId);
    let curH = "";
    for (const h of heads) { const ai = list.findIndex((x) => x.id === h.before_product_id); if (ai >= 0 && ai <= myIdx) curH = h.id; }
    if (headingId === curH) return;
    const follower = list[myIdx + 1];
    const anchored = heads.filter((h) => h.before_product_id === productId);
    const rest = list.filter((x) => x.id !== productId);
    let at = 0;
    if (headingId) {
      const h = heads.find((x) => x.id === headingId)!;
      let ai = rest.findIndex((x) => x.id === h.before_product_id);
      if (ai < 0) ai = follower ? rest.findIndex((x) => x.id === follower.id) : 0;
      if (ai < 0) ai = 0;
      let end = rest.length;
      for (const o of heads) { if (o.id === h.id || o.before_product_id === productId) continue; const oi = rest.findIndex((x) => x.id === o.before_product_id); if (oi > ai && oi < end) end = oi; }
      at = end;
    }
    await saveOrder([...rest.slice(0, at), prod0, ...rest.slice(at)]);
    for (const h of anchored) {
      if (follower) await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: follower.id } });
    }
  };

  const nm = (id: string, base: string) => viewLoc === "de-DE" ? base : d?.tr.get(id)?.[viewLoc]?.name ?? base;
  /** Wählbare Kategorien für „Alias-Kategorie": ohne die offene Kategorie, ihre Unter- und Oberkategorien und bereits verlinkte. */
  const deptAliasOptions = useMemo(() => {
    if (!cur || !d) return [];
    const blocked = new Set<string>([cur]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const x of d.depts) {
        if (x.parent_id && blocked.has(x.parent_id) && !blocked.has(x.id)) { blocked.add(x.id); grew = true; }
        if (x.parent_id && blocked.has(x.id) && !blocked.has(x.parent_id)) { blocked.add(x.parent_id); grew = true; }
      }
    }
    for (const x of d.depts) if (x.parent_id === cur) blocked.add(x.id);
    for (const a of deptAliasQ.data ?? []) if (a.parent_id === cur) blocked.add(a.department_id);
    return d.depts.filter((x) => !blocked.has(x.id))
      .map((x) => ({ id: x.id, label: `${path(x.parent_id).map((p) => nm(p.id, p.name)).join(" › ")}${x.parent_id ? " › " : ""}${nm(x.id, x.name)}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [d, cur, deptAliasQ.data]);
  /** Wählbare Produkte für „Alias-Produkt": ohne Produkte, die bereits in der offenen Kategorie liegen (eigene oder verlinkte). */
  const productAliasOptions = useMemo(() => {
    if (!cur || !d) return [];
    const blocked = new Set<string>(d.prods.filter((x) => x.department_id === cur).map((x) => x.id));
    for (const a of aliasQ.data ?? []) if (a.department_id === cur) blocked.add(a.product_id);
    return d.prods.filter((x) => !blocked.has(x.id))
      .map((x) => ({ id: x.id, label: `${nm(x.id, x.name)} · ${nm(x.department_id, deptById.get(x.department_id)?.name ?? "")}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [d, cur, aliasQ.data]);
  const pathText = () => path(cur).map((p) => p.name).join(" › ");
  /** Produkte aus Nachbarkategorien (gleiche Oberkategorie), damit nichts doppelt vorgeschlagen wird. */
  const siblingNames = () => {
    const parent = cur ? deptById.get(cur)?.parent_id : null;
    const sib = new Set((d?.depts ?? []).filter((x) => x.parent_id === parent && x.id !== cur).map((x) => x.id));
    return (d?.prods ?? []).filter((x) => sib.has(x.department_id)).map((x) => x.name);
  };
  const loadSuggestions = async (typed: string[], mode: "web" | "ai", count: number) => {
    const r = await suggest({ data: { mode, count, path: pathText(), existing: products.map((p) => p.name).slice(0, 400), exclude: [...typed, ...siblingNames()].slice(0, 400), ...(mk ? { market: mk } : {}) } });
    if (r.webFailed) toast.info(T("adm.suggestWebFailed"));
    return r.items;
  };

  /** Produkte nach Kriterium sortieren; Überschriften-Gruppen bleiben erhalten. */
  const sortProducts = (crit?: typeof sortBy) => {
    const c = crit ?? sortBy;
    if (!cur || products.length < 2) return;
    const label = T(`adm.crit.${c}` as MessageKey);
    if (!confirm(T("adm.sortConfirm", { label }))) return;
    const anchors = new Set(headings.map((h) => h.before_product_id));
    const groups: (typeof products)[] = [];
    products.forEach((p, i) => { if (i === 0 || anchors.has(p.id)) groups.push([]); groups[groups.length - 1]!.push(p); });
    run(async () => {
      let ordered: (typeof products)[];
      if (c === "alphabetical") {
        ordered = groups.map((g) => [...g].sort((a, b) => a.name.localeCompare(b.name, "de")));
      } else {
        const r = await rank({ data: { path: pathText(), criterion: c === "marketRelevance" ? "popularity" : c, groups: groups.map((g) => g.map((p) => p.name)), ...(mk ? { market: mk } : {}) } });
        ordered = groups.map((g, gi) => {
          const pool = [...g];
          return r.groups[gi]!.map((n) => pool.splice(pool.findIndex((p) => p.name === n), 1)[0]!).concat(pool);
        });
      }
      const flat = ordered.flat();
      await saveOrder(flat);
      if (mk) return;
      // Überschriften an das neue erste Produkt ihrer Gruppe hängen
      await Promise.all(groups.map((g, gi) => {
        const h = headings.find((x) => x.before_product_id === g[0]!.id);
        const first = ordered[gi]![0]!;
        return h && first.id !== h.before_product_id ? saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: first.id } }) : null;
      }));
    }, T("adm.sorted", { label }));
  };

  /** Nur die Einträge unterhalb einer Überschrift nach dem gewählten Kriterium sortieren. */
  const sortHeadingGroup = (headingId: string, c: "similarity" | "relevance" | "alphabetical" | "price") => {
    setSortDlg(null);
    const h = headings.find((x) => x.id === headingId);
    if (!h || products.length < 2) return;
    const label = T(`adm.crit.${c === "relevance" ? "popularity" : c}` as MessageKey);
    const ai = c === "similarity" || c === "relevance";
    if (ai && !confirm(T("adm.sortConfirm", { label }))) return;
    const anchors = new Set(headings.map((x) => x.before_product_id));
    const start = products.findIndex((p) => p.id === h.before_product_id);
    if (start < 0) return;
    let end = products.length;
    for (let i = start + 1; i < products.length; i++) if (anchors.has(products[i]!.id)) { end = i; break; }
    const group = products.slice(start, end);
    if (group.length < 2) return;
    run(async () => {
      let orderedGroup: typeof group;
      if (c === "alphabetical") {
        orderedGroup = [...group].sort((a, b) => a.name.localeCompare(b.name, "de"));
      } else if (c === "price") {
        const priceOf = (x: (typeof group)[number]) => refPrices.data?.get((x as Prod & { product_id?: string }).product_id ?? x.id)?.price;
        orderedGroup = [...group].sort((a, b) => {
          const pa = priceOf(a); const pb = priceOf(b);
          if (pa == null && pb == null) return a.name.localeCompare(b.name, "de");
          if (pa == null) return 1;
          if (pb == null) return -1;
          return Number(pa) - Number(pb);
        });
      } else {
        const r = await rank({ data: { path: pathText(), criterion: c === "relevance" ? "popularity" : c, groups: [group.map((p) => p.name)], ...(mk ? { market: mk } : {}) } });
        const pool = [...group];
        orderedGroup = r.groups[0]!.map((n) => pool.splice(pool.findIndex((p) => p.name === n), 1)[0]!).concat(pool);
      }
      await saveOrder([...products.slice(0, start), ...orderedGroup, ...products.slice(end)]);
      if (mk) return;
      const first = orderedGroup[0]!;
      if (first.id !== h.before_product_id) await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: first.id } });
    }, T("adm.sorted", { label }));
  };

  /** Überschriften der aktuellen Abteilung in Unterkategorien umwandeln; Produkte darunter werden verschoben. */
  const headingsToSubcategories = () => {
    if (!cur || !d) return;
    type P = (typeof products)[number];
    const byAnchor = new Map(headings.map((h) => [h.before_product_id, h]));
    const groups: { h: Head; items: P[] }[] = [];
    let curG: { h: Head; items: P[] } | null = null;
    for (const p of products) {
      const h = byAnchor.get(p.id);
      if (h) { curG = { h, items: [] }; groups.push(curG); }
      if (curG && !p.id.startsWith("alias:")) curG.items.push(p);
    }
    // Überschriften ohne gefundenen Anker trotzdem als (leere) Unterkategorie übernehmen
    for (const h of headings) if (!groups.some((g) => g.h.id === h.id)) groups.push({ h, items: [] });
    const n = groups.reduce((s, g) => s + g.items.length, 0);
    if (!confirm(T("adm.headingsToSubConfirm", { cats: groups.length, n }))) return;

    run(async () => {
      const children = d.depts.filter((x) => x.parent_id === cur);
      let order = children.reduce((m, x) => Math.max(m, x.sort_order), 0);
      const newIds: string[] = [];
      for (const g of groups) {
        const name = g.h.name.trim();
        let target = children.find((x) => x.name.trim().toLowerCase() === name.toLowerCase());
        let start = 0;
        if (target) {
          start = d.prods.filter((x) => x.department_id === target!.id).reduce((m, x) => Math.max(m, x.sort_order), 0);
        } else {
          const r = await supabase.from("departments").insert({ name, parent_id: cur, sort_order: ++order }).select("id, name, emoji, parent_id, sort_order, image_path").single();
          if (r.error) throw new Error(r.error.message);
          target = r.data as Dept;
          children.push(target);
          newIds.push(target.id);
        }
        const tid = target.id;
        await Promise.all(g.items.map((p, i) => must(supabase.from("products").update({ department_id: tid, sort_order: start + i + 1 }).eq("id", p.id))));
        await delH({ data: { id: g.h.id } });
      }
      if (newIds.length) await translateIds(newIds);
    }, T("adm.headingsToSubDone", { cats: groups.length, n }));
  };

  const createTree = (blocks: TreeBlock[]) => {
    if (!d) return;
    const n = blocks.reduce((s, b) => s + b.items.length, 0);
    run(async () => {
      const children = d.depts.filter((x) => x.parent_id === cur);
      let order = children.reduce((m, x) => Math.max(m, x.sort_order), 0);
      const newIds: string[] = [];
      for (const b of blocks) {
        let target = children.find((x) => x.name.trim().toLowerCase() === b.name.toLowerCase());
        let start = 0;
        if (target) {
          start = d.prods.filter((x) => x.department_id === target!.id).reduce((m, x) => Math.max(m, x.sort_order), 0);
        } else {
          const r = await supabase.from("departments").insert({ name: b.name, parent_id: cur, sort_order: ++order }).select("id, name, emoji, parent_id, sort_order, image_path").single();
          if (r.error) throw new Error(r.error.message);
          target = r.data as Dept;
          children.push(target);
          newIds.push(target.id);
        }
        if (b.items.length) {
          const tid = target.id;
          const r = await supabase.from("products").insert(b.items.map((name, i) => ({ department_id: tid, name, sort_order: start + i + 1 }))).select("id");
          if (r.error) throw new Error(r.error.message);
          newIds.push(...(r.data ?? []).map((x) => x.id as string));
        }
      }
      if (newIds.length) await translateIds(newIds);
      setBulkTree(false);
    }, T("adm.bulkTreeDone", { cats: blocks.length, n }));
  };

  const remove = (s: NonNullable<Sel>, name: string) => {
    if (!confirm(T("adm.deleteConfirm", { name }))) return;
    run(async () => {
      if (s.kind === "heading") { await delH({ data: { id: s.id } }); }
      else if (s.kind === "product") {
        await must(supabase.from("product_headings").delete().eq("before_product_id", s.id));
        await must(supabase.from("products").delete().eq("id", s.id));
        await must(supabase.from("catalog_translations").delete().eq("entity_id", s.id));
      } else {
        if (d?.depts.some((x) => x.parent_id === s.id) || d?.prods.some((x) => x.department_id === s.id))
          throw new Error(T("adm.notEmpty"));
        await must(supabase.from("product_headings").delete().eq("department_id", s.id));
        await must(supabase.from("departments").delete().eq("id", s.id));
        await must(supabase.from("catalog_translations").delete().eq("entity_id", s.id));
      }
      setSel(null);
    }, T("adm.deleted"));
  };

  const createBackupFn = useServerFn(createBulkBackup);
  const undoBackupFn = useServerFn(undoBulkBackup);
  const [headingAi, setHeadingAi] = useState(false);
  /** KI-Gruppen übernehmen: Produkte umsortieren, alte Überschriften (mit Sicherung) ersetzen. */
  const applyHeadingGroups = async (groups: HeadingGroup[]) => {
    if (!cur) return;
    const deptId = cur;
    const oldOrder = products.map((x) => ({ id: x.id }));
    const oldIds = headings.map((h) => h.id);
    await run(async () => {
      const backupId = oldIds.length ? await createBackupFn({ data: { label: T("adm.headingAi.title"), deletes: [
        { table: "product_headings", filterColumn: "id", filterIds: oldIds },
        { table: "catalog_translations", filterColumn: "entity_id", filterIds: oldIds },
      ] } }) : null;
      const grouped = new Set(groups.flatMap((g) => g.productIds));
      const next = [...groups.flatMap((g) => g.productIds.map((id) => ({ id }))), ...products.filter((x) => !grouped.has(x.id)).map((x) => ({ id: x.id }))];
      await saveOrder(next);
      for (const id of oldIds) await delH({ data: { id } });
      const created: string[] = [];
      for (const g of groups) {
        const anchor = g.productIds.find((id) => !id.startsWith("alias:"));
        if (anchor) created.push((await saveH({ data: { departmentId: deptId, beforeProductId: anchor, name: g.name.trim() } })).id);
      }
      await qc.invalidateQueries({ queryKey: ALIAS_KEY });
      toast.success(T("adm.headingAi.done", { n: created.length }), {
        action: { label: T("adm.undo"), onClick: () => { void run(async () => {
          for (const id of created) await delH({ data: { id } });
          await saveOrder(oldOrder);
          if (backupId) await undoBackupFn({ data: { id: backupId } });
        }, T("adm.undone")); } },
      });
    }, null);
  };

  const deleteSelected = (sel: { productIds: string[]; productAliasIds: string[] }) => {
    const n = sel.productIds.length + sel.productAliasIds.length;
    if (!n || !confirm(T("adm.deleteSelectedConfirm", { n }))) return;
    run(async () => {
      // Vor der Löschung Sicherungspunkt anlegen, damit sich die Aktion zurücknehmen lässt
      const backupId = await createBackupFn({ data: {
        label: T("adm.bulkDeleteLabel"),
        deletes: [
          ...(sel.productAliasIds.length ? [{ table: "product_aliases", filterColumn: "id", filterIds: sel.productAliasIds }] : []),
          ...(sel.productIds.length ? [
            { table: "products", filterColumn: "id", filterIds: sel.productIds },
            { table: "product_headings", filterColumn: "before_product_id", filterIds: sel.productIds },
            { table: "catalog_translations", filterColumn: "entity_id", filterIds: sel.productIds },
          ] : []),
        ],
      } });
      for (const id of sel.productAliasIds) await must(supabase.from("product_aliases").delete().eq("id", id));
      for (const id of sel.productIds) {
        await must(supabase.from("product_headings").delete().eq("before_product_id", id));
        await must(supabase.from("products").delete().eq("id", id));
        await must(supabase.from("catalog_translations").delete().eq("entity_id", id));
      }
      await qc.invalidateQueries({ queryKey: ALIAS_KEY });
      if (backupId) {
        toast.success(T("adm.deleted"), {
          action: { label: T("adm.undo"), onClick: () => { void undoBackupFn({ data: { id: backupId } }).then(() => { toast.success(T("adm.undone")); void refresh(); }); } },
        });
      } else {
        toast.success(T("adm.deleted"));
      }
    }, null);
  };

  /** Löscht markierte Kategorien rekursiv (mit Sicherungspunkt): inkl. Unterkategorien, Produkte, Überschriften, Aliase und Übersetzungen. */
  const deleteSelectedDepts = (sel: { deptIds: string[]; deptAliasIds: string[] }) => {
    const n = sel.deptIds.length + sel.deptAliasIds.length;
    if (!n || !confirm(T("adm.deleteSelectedDeptsConfirm", { n }))) return;
    run(async () => {
      // Alle Nachfahren der markierten Kategorien rekursiv einsammeln
      const deptIds = new Set(sel.deptIds);
      let grew = true;
      while (grew) {
        grew = false;
        for (const x of d?.depts ?? []) {
          if (x.parent_id && deptIds.has(x.parent_id) && !deptIds.has(x.id)) { deptIds.add(x.id); grew = true; }
        }
      }
      const deptIdList = [...deptIds];
      const prodIds = (d?.prods ?? []).filter((x) => deptIds.has(x.department_id)).map((x) => x.id);
      // Aliase, die auf betroffene Kategorien/Produkte zeigen oder in ihnen liegen
      const prodAliasIds = (aliasQ.data ?? []).filter((a) => deptIds.has(a.department_id) || prodIds.includes(a.product_id)).map((a) => a.id);
      const deptAliasIds = new Set(sel.deptAliasIds);
      for (const a of deptAliasQ.data ?? []) {
        if (deptIds.has(a.department_id) || deptIds.has(a.parent_id)) deptAliasIds.add(a.id);
      }
      const entityIds = [...deptIdList, ...prodIds];
      const backupId = (deptIdList.length || deptAliasIds.size) ? await createBackupFn({ data: {
        label: T("adm.bulkDeleteLabel"),
        // Reihenfolge beachten: Rückgängig stellt in dieser Reihenfolge wieder her (Eltern vor Kindern)
        deletes: [
          ...(deptIdList.length ? [{ table: "departments", filterColumn: "id", filterIds: deptIdList }] : []),
          ...(prodIds.length ? [{ table: "products", filterColumn: "id", filterIds: prodIds }] : []),
          ...(deptIdList.length ? [{ table: "product_headings", filterColumn: "department_id", filterIds: deptIdList }] : []),
          ...(prodIds.length ? [{ table: "product_headings", filterColumn: "before_product_id", filterIds: prodIds }] : []),
          ...(deptAliasIds.size ? [{ table: "department_aliases", filterColumn: "id", filterIds: [...deptAliasIds] }] : []),
          ...(prodAliasIds.length ? [{ table: "product_aliases", filterColumn: "id", filterIds: prodAliasIds }] : []),
          ...(entityIds.length ? [{ table: "catalog_translations", filterColumn: "entity_id", filterIds: entityIds }] : []),
        ],
      } }) : null;
      for (const id of deptAliasIds) await must(supabase.from("department_aliases").delete().eq("id", id));
      for (const id of prodAliasIds) await must(supabase.from("product_aliases").delete().eq("id", id));
      for (const id of deptIdList) await must(supabase.from("product_headings").delete().eq("department_id", id));
      for (const id of prodIds) {
        await must(supabase.from("product_headings").delete().eq("before_product_id", id));
        await must(supabase.from("products").delete().eq("id", id));
      }
      // Kategorien tiefste zuerst löschen
      const depth = (id: string): number => { let n = 0, cur = id; while (true) { const p = d?.depts.find((x) => x.id === cur)?.parent_id; if (!p || !deptIds.has(p) || n > 50) return n; cur = p; n++; } };
      for (const id of deptIdList.sort((a, b) => depth(b) - depth(a))) {
        await must(supabase.from("departments").delete().eq("id", id));
      }
      for (const id of entityIds) await must(supabase.from("catalog_translations").delete().eq("entity_id", id));
      await qc.invalidateQueries({ queryKey: ALIAS_KEY });
      await qc.invalidateQueries({ queryKey: DEPT_ALIAS_KEY });
      await refresh();
      if (backupId) {
        toast.success(T("adm.deleted"), {
          action: { label: T("adm.undo"), onClick: () => { void undoBackupFn({ data: { id: backupId } }).then(() => { toast.success(T("adm.undone")); void refresh(); }); } },
        });
      } else {
        toast.success(T("adm.deleted"));
      }
    }, null);
  };

  const results = useMemo(() => {
    const n = search.trim().toLowerCase();
    if (!n || !d) return null;
    const hit = (id: string, name: string) => name.toLowerCase().includes(n) || Object.values(d.tr.get(id) ?? {}).some((t) => t.name.toLowerCase().includes(n));
    return [
      ...d.depts.filter((x) => hit(x.id, x.name)).map((x) => ({ kind: "department" as const, id: x.id, name: x.name, emoji: x.emoji, parent: x.parent_id })),
      ...d.prods.filter((x) => hit(x.id, x.name)).map((x) => ({ kind: "product" as const, id: x.id, name: x.name, emoji: x.emoji, parent: x.department_id })),
      ...d.heads.filter((x) => hit(x.id, x.name)).map((x) => ({ kind: "heading" as const, id: x.id, name: x.name, emoji: null, parent: x.department_id })),
    ].slice(0, 60);
  }, [search, d]);

  if (admin.isLoading) return <p className="pt-6 text-sm text-muted-foreground">{T("adm.loading")}</p>;
  if (!admin.data?.isAdmin && admin.data?.markets?.length)
    return (
      <div className="space-y-4 pb-10">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-foreground">{T("adm.title")}</h1>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>{T("adm.signOut")}</Button>
        </div>
        <MarketAdmin markets={admin.data.markets} />
      </div>
    );
  if (!admin.data?.isAdmin)
    return (
      <div className="space-y-3 pt-6">
        <h1 className="text-2xl font-bold text-foreground">{T("adm.title")}</h1>
        <p className="text-sm text-muted-foreground">{T("adm.noAccess")}</p>
        <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>{T("adm.signOut")}</Button>
      </div>
    );

  const selName = sel ? (sel.kind === "department" ? deptById.get(sel.id)?.name : sel.kind === "product" ? d?.prods.find((p) => p.id === sel.id)?.name : d?.heads.find((h) => h.id === sel.id)?.name) ?? "" : "";

  /** Creates AI images one after another; stops at the first failure (e.g. credits used up). */
  const generateNewImages = async (ids: string[], ai: { hint: string; opts: AiImageOpts }) => {
    const tid = toast.loading(T("adm.aiImagesProgress", { i: 1, n: ids.length }));
    let done = 0;
    try {
      for (const id of ids) {
        toast.loading(T("adm.aiImagesProgress", { i: done + 1, n: ids.length }), { id: tid });
        const g = await genImgFor({ data: { id, kind: "product", hint: ai.hint || undefined, opts: ai.opts } });
        await saveProductIconFromPath(id, g.path);
        done++;
      }
      toast.success(T("tile.imgDone"), { id: tid });
    } catch (e) {
      toast.error((e as Error).message, { id: tid });
    } finally {
      if (done > 0) await refresh();
    }
  };
  const handleBulkSubmit = (names: string[], emoji: string, qty: number, unit: string, mkOnly: Set<string>, pos: string, deptId: string, ai?: { hint: string; opts: AiImageOpts }) => {
    if (ai && !window.confirm(T("adm.aiImagesConfirm", { n: names.length }))) return;
    let newIds: string[] = [];
    return run(async () => {
    const target = deptId || cur;
    if (!target) return;
    if (target !== cur) {
      // Fremde Kategorie gewählt: immer ans Ende dieser Kategorie (höchster sort_order + 1)
      const { data: maxRow } = await supabase.from("products").select("sort_order").eq("department_id", target).order("sort_order", { ascending: false }).limit(1);
      const start = ((maxRow?.[0] as { sort_order: number } | undefined)?.sort_order ?? 0) + 1;
      const rows = names.map((name, i) => ({ department_id: target, name, markets: mk && mkOnly.has(name) ? [mk] : [], emoji: emoji || null, default_quantity: qty, default_unit: unit as never, sort_order: start + i }));
      const r = await supabase.from("products").insert(rows).select("id");
      if (r.error) throw new Error(r.error.message);
      newIds = (r.data ?? []).map((x) => x.id as string);
      await translateIds(newIds);
      setBulk(false);
      return;
    }
    // Einfügeposition bestimmen: "end" = ans Ende, "top" = ganz oben, sonst Überschriften-ID = ans Ende ihrer Gruppe
    let insertAt = products.length;
    if (pos === "top") insertAt = 0;
    else if (pos !== "end") {
      const h = headings.find((x) => x.id === pos);
      const a = h ? products.findIndex((x) => x.id === h.before_product_id) : -1;
      if (a >= 0) {
        const nextAnchor = headings
          .map((x) => products.findIndex((p) => p.id === x.before_product_id))
          .filter((i) => i > a)
          .sort((x, y) => x - y)[0];
        insertAt = nextAnchor ?? products.length;
      }
    }
    // Bestehende Produkte ab der Einfügestelle nach hinten schieben
    const shifted = products.slice(insertAt).filter((x) => !x.id.startsWith("alias:"));
    await Promise.all(shifted.map((x, i) => must(supabase.from("products").update({ sort_order: insertAt + names.length + i + 1 }).eq("id", x.id))));
    const rows = names.map((name, i) => ({ department_id: target, name, markets: mk && mkOnly.has(name) ? [mk] : [], emoji: emoji || null, default_quantity: qty, default_unit: unit as never, sort_order: insertAt + i + 1 }));
    const r = await supabase.from("products").insert(rows).select("id");
    if (r.error) throw new Error(r.error.message);
    newIds = (r.data ?? []).map((x) => x.id as string);
    await translateIds(newIds);
    setBulk(false);
  }, T("adm.created")).then(() => { if (ai && newIds.length) void generateNewImages(newIds, ai); });
  };

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">{T("adm.title")}</h1>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>{T("adm.signOut")}</Button>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={T("adm.title")}>
        {([["catalog", "adm.tab.catalog"], ["media", "adm.tab.media"], ["recipes", "adm.tab.recipes"], ["cuisines", "adm.tab.cuisines"], ["languages", "adm.tab.languages"], ["markets", "adm.tab.markets"], ["prices", "adm.tab.prices"], ["import", "adm.tab.import"], ["health", "adm.tab.health"], ["speech", "stx.title"], ["units", "adm.tab.units"]] as const).map(([id, key]) => (
          <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
            {id === "speech" ? "🔊 " : ""}{T(key)}
          </button>
        ))}
        <button type="button" onClick={() => setPreview(true)}
          className="whitespace-nowrap rounded-full border border-primary px-3.5 py-1.5 text-sm font-semibold text-primary">
          👁 {T("tile.preview")}
        </button>
      </div>

      <Suspense fallback={<p className="pt-2 text-sm text-muted-foreground">{T("adm.loading")}</p>}>
      {tab === "catalog" && (<>
      <div className="grid grid-cols-4 gap-2 text-center md:max-w-xl">
        <Stat label={T("adm.categories")} value={d?.depts.length} />
        <Stat label={T("adm.products")} value={d?.prods.length} />
        <Stat label={T("adm.headings")} value={d?.heads.length} />
        <Stat label={T("adm.tab.media")} value={d ? new Set([...d.depts, ...d.prods].flatMap((item) => [item.image_path, item.icon_path]).filter((path): path is string => Boolean(path))).size : undefined} />
      </div>

      <div className="flex flex-wrap gap-2">
        {cur && (
          <select value={mk} onChange={(e) => { setMk(e.target.value); if (!e.target.value && sortBy === "marketRelevance") setSortBy("popularity"); }} aria-label={T("adm.marketChoice")}
            className="h-11 min-w-[10rem] flex-1 rounded-xl border border-input bg-background px-3 text-sm">
            <optgroup label={T("adm.marketChoice")}>
              <option value="">{T("adm.marketGlobal")}</option>
              {MARKETS.map((m) => <option key={m} value={m}>{flagOf(m)} {m}</option>)}
            </optgroup>
          </select>
        )}
        <select aria-label={T("adm.viewLocale")} value={viewLoc} onChange={(e) => setViewLoc(e.target.value)} className="h-11 min-w-[10rem] flex-1 rounded-xl border border-input bg-background px-3 text-sm">
          <optgroup label={T("adm.viewLocale")}>
            {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.flag} {l.label}</option>)}
          </optgroup>
        </select>
        {products.length > 1 && (
          <div className="flex min-w-[10rem] flex-1 gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} aria-label={T("adm.sortBy")}
              className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="popularity">{T("adm.opt.popularity")}</option>
              {mk && <option value="marketRelevance">{T("adm.opt.marketRelevance")}</option>}
              <option value="price">{T("adm.opt.price")}</option>
              <option value="alphabetical">{T("adm.opt.alphabetical")}</option>
              <option value="similarity">{T("adm.opt.similarity")}</option>
            </select>
            <Button variant="outline" className="h-11 shrink-0 rounded-xl" disabled={busy} onClick={() => sortProducts()}>↕ {busy ? T("adm.working") : T("adm.sort")}</Button>
            {cur && <Button variant="outline" className="h-11 shrink-0 rounded-xl" disabled={busy} onClick={() => setHeadingAi(true)} title={T("adm.headingAi.title")}>✨ {T("adm.headingAi.btn")}</Button>}
            {cur && headingAi && <HeadingAiDialog open={headingAi} onOpenChange={setHeadingAi} nm={nm} hasHeadings={headings.length > 0}
              path={path(cur).map((p) => p.name).join(" › ")}
              products={products.filter((x) => !x.id.startsWith("alias:")).map((x) => ({ id: x.id, name: x.name, emoji: x.emoji }))}
              onApply={applyHeadingGroups} />}
          </div>
        )}
        <select value={cur ?? ""} onChange={(e) => { setCur(e.target.value || null); setSel(null); setSearch(""); }} aria-label={T("adm.categories")}
          className="h-11 min-w-[10rem] flex-1 rounded-xl border border-input bg-background px-3 text-sm">
          <option value="">{T("adm.noImg.cat")}</option>
          {(d ? deptTreeOrder(d.depts) : []).map((x) => (
            <option key={x.id} value={x.id}>{path(x.id).map((p) => nm(p.id, p.name)).join(" › ")}</option>
          ))}
        </select>
        <Input placeholder={T("adm.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 min-w-[10rem] flex-1 rounded-xl" />
      </div>
      {cur && mk && <p className="text-xs text-muted-foreground">{T("adm.marketOrderHint", { m: `${flagOf(mk)} ${mk}` })}</p>}

      {q.isLoading && <p className="text-sm text-muted-foreground">{T("adm.loadingCatalog")}</p>}

      {results ? (
        <div className="space-y-1">
          {results.length === 0 && <p className="text-sm text-muted-foreground">{T("adm.noHits")}</p>}
          {results.map((r) => (
            <button key={r.kind + r.id} onClick={() => { setCur(r.kind === "department" ? r.id : r.parent); setSel({ kind: r.kind, id: r.id }); setSearch(""); }}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm">
              <span>{r.kind === "heading" ? "𝐇" : r.emoji ?? (r.kind === "department" ? "📁" : "•")}</span>
              <span className={r.kind === "heading" ? "font-bold" : ""}>{nm(r.id, r.name)}</span>
              <span className="ml-auto truncate text-xs text-muted-foreground">{path(r.parent).map((p) => nm(p.id, p.name)).join(" › ")}</span>
            </button>
          ))}
        </div>
      ) : d ? (
        <>
          <CatalogTileEditor depts={d.depts} cur={cur} setCur={(id) => { setCur(id); setSel(null); }} children={children} products={products}
            imageEditor={imageEditor} imageEditorProduct={imageEditor ? d.prods.find((x) => x.id === imageEditor.id) : undefined} onCloseImageEditor={() => setImageEditor(null)}
            path={path(cur)} nm={nm} unavailable={(x) => unavailable(x as Prod)} prices={refPrices.data} run={run} must={must} translateIds={translateIds}
            reorder={reorder} remove={(kind, id, name) => remove({ kind, id }, name)}
            busy={busy}
            headings={headings}
            onAddHeading={(name, insertAt) => { const anchor = products.slice(insertAt).find((x) => !x.id.startsWith("alias:")); if (cur && anchor) void run(() => saveH({ data: { departmentId: cur, beforeProductId: anchor.id, name } }), T("adm.created")); else toast.error(T("adm.headingMoveNoTarget")); }}
            onRemoveAlias={(aliasId, name) => { if (confirm(T("adm.aliasRemove", { name }))) void run(async () => { await must(supabase.from("product_aliases").delete().eq("id", aliasId)); await qc.invalidateQueries({ queryKey: ALIAS_KEY }); }, T("adm.deleted")); }}
            productAliasOptions={productAliasOptions}
            onAddProductAlias={(productId) => { if (!cur) return; void run(async () => {
              const n = products.length;
              await must(supabase.from("product_aliases").insert({ product_id: productId, department_id: cur, sort_order: n + 1 }));
              await qc.invalidateQueries({ queryKey: ALIAS_KEY });
            }, T("adm.created")); }}
            deptAliasOptions={deptAliasOptions}
            onAddDeptAlias={(deptId) => { if (!cur) return; void run(async () => {
              const n = children.length;
              await must(supabase.from("department_aliases").insert({ department_id: deptId, parent_id: cur, sort_order: n + 1 }));
              await qc.invalidateQueries({ queryKey: DEPT_ALIAS_KEY });
            }, T("adm.created")); }}
            onRemoveDeptAlias={(aliasId, name) => { if (confirm(T("adm.aliasRemove", { name }))) void run(async () => { await must(supabase.from("department_aliases").delete().eq("id", aliasId)); await qc.invalidateQueries({ queryKey: DEPT_ALIAS_KEY }); }, T("adm.deleted")); }}
            onMoveHeading={moveHeading}
            onMoveProduct={(id, to, headingId) => moveProduct(products, id, to, headingId)}
            onAssignHeading={(productId, headingId) => run(() => assignHeading(productId, headingId), T("adm.saved"))}
            onRenameHeading={(id, name) => { const h = headings.find((x) => x.id === id); if (h) void run(() => saveH({ data: { id, departmentId: h.department_id, beforeProductId: h.before_product_id, name } }), T("adm.saved")); }}
            onDeleteHeading={(id, name) => { if (confirm(`${T("adm.delete")}: ${name}?`)) void run(() => delH({ data: { id } }), T("adm.deleted")); }}
            onSortHeading={(id) => setSortDlg(id)}
            onBulkAdd={cur ? () => setBulk("plain") : undefined}
            onBulkTree={() => setBulkTree(true)}
            onHeadingsToSub={cur && headings.length > 0 && !mk ? headingsToSubcategories : undefined}
            onTranslateMissing={() => run(async () => toast.info(T("adm.trAdded", { n: await translateIds() })), T("adm.trDone"))}
            onDeleteSelected={deleteSelected}
            onDeleteSelectedDepts={deleteSelectedDepts}
            onAdvanced={(kind, id) => setSel({ kind, id })} />
          {bulk && (
            <BulkAddForm key={bulk} autoSuggest={bulk === "suggest"} onSuggest={loadSuggestions} market={mk} onCancel={() => setBulk(false)}
              headings={headings} products={products}
              curDept={cur ?? undefined}
              deptOptions={d.depts.map((x) => ({ id: x.id, label: path(x.id).map((p) => p.name).join(" › ") })).sort((a, b) => a.label.localeCompare(b.label, "de"))}
              onSubmit={handleBulkSubmit} />
          )}
          {bulkTree && (
            <BulkTreeForm existing={d.depts.filter((x) => x.parent_id === cur).map((x) => x.name)}
              onCancel={() => setBulkTree(false)} onSubmit={createTree} />
          )}
        </>
      ) : null}

      </>)}

      {sortDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSortDlg(null)}>
          <div className="w-full max-w-xs rounded-2xl bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-sm font-bold text-foreground">{T("adm.sortGroupTitle")}</p>
            <div className="flex flex-col gap-2">
              {(["similarity", "relevance", "alphabetical", "price"] as const).map((c) => (
                <Button key={c} variant="outline" className="justify-start" onClick={() => sortHeadingGroup(sortDlg, c)}>
                  {T(`adm.crit.${c === "relevance" ? "popularity" : c}` as MessageKey)}
                </Button>
              ))}
              <Button variant="ghost" onClick={() => setSortDlg(null)}>{T("adm.cancel")}</Button>
            </div>
          </div>
        </div>
      )}

      {sel && d && (
        <Editor key={sel.kind + sel.id} sel={sel} name={selName} data={d} products={(d.prods).filter((p) => p.department_id === (sel.kind === "heading" ? d.heads.find((h) => h.id === sel.id)?.department_id : undefined))}
          busy={busy} onClose={() => setSel(null)} onDelete={() => remove(sel, selName)}
          onEditImage={() => { if (sel.kind === "product") { setSearch(""); setTab("catalog"); setImageEditor({ kind: "product", id: sel.id }); } }}
          onSave={(patch) => run(async () => {
            if (sel.kind === "heading") {
              const h = d.heads.find((x) => x.id === sel.id)!;
              await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: patch.before ?? h.before_product_id, ...(patch.name && patch.name !== h.name ? { name: patch.name } : {}) } });
            } else {
              const upd: Record<string, unknown> = {};
              if (patch.name) upd['name'] = patch.name;
              if (patch.emoji !== undefined) upd['emoji'] = patch.emoji || null;
              if (patch.parent !== undefined) upd[sel.kind === "product" ? "department_id" : "parent_id"] = patch.parent || null;
              if (patch.qty !== undefined) upd['default_quantity'] = patch.qty;
              if (patch.unit) upd['default_unit'] = patch.unit;
              if (patch.diets) upd['excluded_diets'] = patch.diets;
              if (patch.variants) upd['variants'] = patch.variants;
              await must(supabase.from(TABLE[sel.kind]).update(upd as never).eq("id", sel.id));
              if (sel.kind === "product" && patch.variants) void trVariants({ data: { productId: sel.id } }).catch(() => {});
              if (sel.kind === "product" && patch.heading !== undefined) await assignHeading(sel.id, patch.heading);
            }
            if (sel.kind === "product") setSel(null);
          })}
          onTr={(locale, value, prev) => {
            if ((prev ?? "") === value.trim()) return;
            run(() => must(value.trim()
              ? supabase.from("catalog_translations").upsert({ entity_type: sel.kind, entity_id: sel.id, locale, name: value.trim(), is_manual: true }, { onConflict: "entity_type,entity_id,locale" })
              : supabase.from("catalog_translations").delete().eq("entity_id", sel.id).eq("locale", locale)));
          }}
          onRetranslate={() => run(async () => {
            await must(supabase.from("catalog_translations").delete().eq("entity_id", sel.id).eq("is_manual", false));
            if (sel.kind === "heading") {
              const h = d.heads.find((x) => x.id === sel.id)!;
              await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: h.before_product_id, name: h.name } });
            } else await translateIds([sel.id]);
          }, T("adm.retranslated"))}
          deptOptions={d.depts.map((x) => ({ id: x.id, label: path(x.id).map((p) => p.name).join(" › ") })).sort((a, b) => a.label.localeCompare(b.label, "de"))}
          onImageChanged={() => { void qc.invalidateQueries({ queryKey: ["admin-catalog"] }); void qc.invalidateQueries({ queryKey: ["catalog"] }); }}
        />
      )}

      {tab === "media" && <LoadingGate d={d}><CatalogMediaPanel section="images" depts={d?.depts ?? []} prods={d?.prods ?? []} onEdit={(id) => setSel({ kind: "product", id })} /></LoadingGate>}
      {tab === "prices" && <LoadingGate d={d}><div className="space-y-4"><CatalogMediaPanel section="prices" depts={d?.depts ?? []} prods={d?.prods ?? []} onEdit={(id) => setSel({ kind: "product", id })} />{d && <MarketDataImport prods={d.prods.map((p) => ({ id: p.id, name: p.name }))} />}</div></LoadingGate>}
      {tab === "import" && (d ? <ImportPanel depts={d.depts} prods={d.prods} /> : <LoadingGate d={d}>{null}</LoadingGate>)}


{tab === "recipes" && (d ? <><RecipeAdmin depts={d.depts} prods={d.prods} /><RecipeAssignAdmin depts={d.depts} prods={d.prods} /><RecipeTraitsAdmin /></> : <LoadingGate d={d}>{null}</LoadingGate>)}
      {tab === "cuisines" && (d ? <CuisineAdmin depts={d.depts} prods={d.prods} /> : <LoadingGate d={d}>{null}</LoadingGate>)}
      {tab === "languages" && <LoadingGate d={d}><LocaleAdminPanel /></LoadingGate>}
      {tab === "health" && (d ? <CatalogHealthPanel depts={d.depts} prods={d.prods} tr={d.tr} onEdit={(id) => setSel({ kind: "product", id })}
        onOpenDept={(id) => { setSearch(""); setSel(null); setCur(id); setTab("catalog"); }} /> : <LoadingGate d={d}>{null}</LoadingGate>)}
      {tab === "speech" && <SpeechTextsPanel />}
      {tab === "units" && <UnitsPanel />}

      {tab === "markets" && (<div className="space-y-4">
        <MarketsManager />
        <MarketAdminsManager />
      </div>)}

      {preview && <CatalogPreview onClose={() => setPreview(false)} />}
      </Suspense>
    </div>
  );
}

/** Zeigt den Bereich erst, wenn der Katalog geladen ist; vorher einen Ladetext. */
function LoadingGate({ d, children }: { d: AdminData | undefined; children: React.ReactNode }) {
  if (!d) return <p className="pt-2 text-sm text-muted-foreground">{T("adm.loadingCatalog")}</p>;
  return <>{children}</>;
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-card p-2">
      <div className="text-lg font-bold text-foreground">{value ?? "–"}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

type Suggestion = { name: string; emoji: string; reason: string; scope: "global" | "market"; source?: string | undefined };

function BulkAddForm({ onSubmit, onCancel, onSuggest, autoSuggest, market, path, deptOptions, curDept, headings = [], products = [] }: {
  onSubmit: (names: string[], emoji: string, qty: number, unit: string, mkOnly: Set<string>, pos: string, deptId: string, ai?: { hint: string; opts: AiImageOpts }) => void; onCancel: () => void;
  onSuggest: (typed: string[], mode: "web" | "ai", count: number) => Promise<Suggestion[]>; autoSuggest?: boolean; market?: string; path?: string;
  deptOptions: { id: string; label: string }[]; curDept?: string | undefined;
  headings?: Head[]; products?: { id: string }[];
}) {
  const [pos, setPos] = useState("end");
  const [deptId, setDeptId] = useState("");
  const [mkOnly, setMkOnly] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [sugs, setSugs] = useState<Suggestion[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loadingS, setLoadingS] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(!!autoSuggest);
  const [mode, setMode] = useState<"web" | "ai">("web");
  const [count, setCount] = useState(15);
  const fetchS = async () => {
    setConfirmOpen(false);
    setLoadingS(true);
    try {
      const typed = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const r = await onSuggest(typed, mode, count);
      setSugs(r); setPicked(new Set(r.map((x) => x.name)));
      setMkOnly((s) => { const n = new Set(s); r.forEach((x) => { if (x.scope === "market") n.add(x.name); }); return n; });
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoadingS(false); }
  };
  const takeOver = () => {
    const add = (sugs ?? []).filter((x) => picked.has(x.name)).map((x) => x.name);
    setText((t) => [...t.split("\n").map((l) => l.trim()).filter(Boolean), ...add].join("\n"));
    setSugs(null);
  };
  const [emoji, setEmoji] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("stueck");
  const [aiOn, setAiOn] = useState(false);
  const [aiHint, setAiHint] = useState("");
  const [aiOpts, setAiOpts] = useState<AiImageOpts>(DEFAULT_AI_IMAGE_OPTS);
  const names = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-primary/50 p-3">
      <p className="text-sm font-semibold text-primary">{T("adm.multiTitle")}</p>
      <textarea
        autoFocus
        rows={8}
        placeholder={"Zuckerstreusel\nZuckerperlen\nZuckerschrift\n…"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="space-y-2 rounded-lg bg-muted/50 p-2">
        <Button type="button" size="sm" variant="outline" className="w-full" disabled={loadingS} onClick={() => setConfirmOpen(true)}>
          {loadingS ? T("adm.searchingMissing") : "✨ " + T("adm.suggestMissing")}
        </Button>
        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={() => setConfirmOpen(false)}>
            <div role="dialog" aria-modal="true" className="w-full max-w-sm space-y-3 rounded-xl bg-background p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-semibold">{T("adm.suggestConfirmTitle")}</p>
              {path && <p className="text-xs text-muted-foreground">{path}{market ? ` · ${flagOf(market)} ${market}` : ""}</p>}
              <div className="space-y-1.5 text-sm">
                <label className="flex items-start gap-2"><input type="radio" checked={mode === "web"} onChange={() => setMode("web")} className="mt-1" /><span>{T("adm.suggestModeWeb")}</span></label>
                <label className="flex items-start gap-2"><input type="radio" checked={mode === "ai"} onChange={() => setMode("ai")} className="mt-1" /><span>{T("adm.suggestModeAi")}</span></label>
              </div>
              <p className="text-xs text-muted-foreground">{mode === "web" ? T("adm.suggestCostWeb") : T("adm.suggestCostAi")}</p>
              <label className="flex items-center justify-between gap-2 text-sm">
                <span>{T("adm.suggestCount")}</span>
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-lg border border-input bg-background px-2 py-1 text-sm">
                  {[5, 10, 15, 20, 25].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => void fetchS()}>{T("adm.suggestStart")}</Button>
                <Button variant="ghost" onClick={() => setConfirmOpen(false)}>{T("adm.cancel")}</Button>
              </div>
            </div>
          </div>
        )}
        {sugs && sugs.length === 0 && <p className="text-xs text-muted-foreground">{T("adm.noMore")}</p>}
        {sugs && sugs.length > 0 && (
          <>
            <ul className="space-y-1">
              {sugs.map((x) => (
                <li key={x.name}>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={picked.has(x.name)}
                      onChange={(e) => setPicked((s) => { const n = new Set(s); if (e.target.checked) n.add(x.name); else n.delete(x.name); return n; })} />
                    <span>{x.emoji}</span><span>{x.name}</span>
                    <span className="ml-auto truncate text-xs text-muted-foreground">{x.source ? `${x.source} · ` : ""}{x.reason}</span>
                    {market && (
                      <button type="button" className="shrink-0 rounded-full border px-2 text-xs"
                        onClick={(e) => { e.preventDefault(); setMkOnly((s) => { const n = new Set(s); if (n.has(x.name)) n.delete(x.name); else n.add(x.name); return n; }); }}>
                        {mkOnly.has(x.name) ? T("adm.scopeMarket", { m: `${flagOf(market)} ${market}` }) : T("adm.scopeGlobal")}
                      </button>
                    )}
                  </label>
                </li>
              ))}
            </ul>
            <Button type="button" size="sm" className="w-full" disabled={picked.size === 0} onClick={takeOver}>{T("adm.takeOver", { n: picked.size })}</Button>
          </>
        )}
      </div>
      <div className="grid grid-cols-[4rem_1fr_1fr] gap-2">
        <Input placeholder="🙂" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        <Input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        <UnitSelect value={unit} onChange={setUnit} />
      </div>
      <p className="text-xs text-muted-foreground">{T("adm.detected", { n: names.length })}</p>
      <label className="flex items-center gap-2 text-sm">
        <span className="shrink-0 text-muted-foreground">{T("adm.category")}</span>
        <select aria-label={T("adm.category")} value={deptId || curDept || ""} onChange={(e) => setDeptId(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm">
          {deptOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </label>
      {headings.length > 0 && (!deptId || deptId === curDept) && (
        <label className="flex items-center gap-2 text-sm">
          <span className="shrink-0 text-muted-foreground">{T("adm.posLabel")}</span>
          <select value={pos} onChange={(e) => setPos(e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2 text-sm">
            <option value="end">{T("adm.posEnd")}</option>
            <option value="top">{T("adm.posTop")}</option>
            {headings.map((h) => (
              <option key={h.id} value={h.id}>{T("adm.posUnder", { name: h.name })}</option>
            ))}
          </select>
        </label>
      )}
      <div className="space-y-2 rounded-lg border border-border p-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={aiOn} onChange={(e) => setAiOn(e.target.checked)} />
          <span>✨ {T("adm.aiImagesNew")}</span>
        </label>
        {aiOn && (
          <>
            <Input aria-label={T("tile.aiHint")} placeholder={T("tile.aiHint")} value={aiHint} onChange={(e) => setAiHint(e.target.value)} />
            <AiImageOptionSelects value={aiOpts} onChange={setAiOpts} />
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" disabled={names.length === 0} onClick={() => onSubmit(names, emoji, Number(qty.replace(",", ".")) || 1, unit, mkOnly, pos, deptId || curDept || "", aiOn ? { hint: aiHint.trim(), opts: aiOpts } : undefined)}>
          {T("adm.createN", { n: names.length })}
        </Button>
        <Button variant="ghost" onClick={onCancel}>{T("adm.cancel")}</Button>
      </div>
    </div>
  );
}

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-input bg-background px-2 text-sm">
      {getUnits(getLocale()).map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
    </select>
  );
}

type Patch = { name?: string; emoji?: string; parent?: string; qty?: number; unit?: string; before?: string; diets?: string[]; variants?: string[]; heading?: string };

const COMMON_VARIANTS = ["Bio", "Vollkorn", "vegan", "laktosefrei", "glutenfrei", "zuckerfrei", "light", "groß", "klein", "mild", "scharf"];


function Editor(p: {
  sel: NonNullable<Sel>; name: string; data: Awaited<ReturnType<typeof loadAll>>; products: Prod[]; busy: boolean;
  deptOptions: { id: string; label: string }[];
  onClose: () => void; onDelete: () => void; onSave: (patch: Patch) => void;
  onTr: (locale: string, v: string, prev?: string) => void; onRetranslate: () => void;
  onImageChanged: () => void;
  onEditImage: () => void;
}) {
  const { sel, data } = p;
  const dept = sel.kind === "department" ? data.depts.find((x) => x.id === sel.id) : undefined;
  const prod = sel.kind === "product" ? data.prods.find((x) => x.id === sel.id) : undefined;
  const head = sel.kind === "heading" ? data.heads.find((x) => x.id === sel.id) : undefined;
  // Non-Food-Produkte (Wurzelkategorie ohne Lebensmittel): Länderküchen-Auswahl ausblenden
  const prodNonFood = (() => {
    if (!prod) return false;
    const byId = new Map(data.depts.map((x) => [x.id, x]));
    let cur = byId.get(prod.department_id);
    let guard = 0;
    while (cur?.parent_id && guard++ < 20) cur = byId.get(cur.parent_id);
    return cur ? isNonFoodRootName(cur.name) : false;
  })();
  const [name, setName] = useState(p.name);
  const [emoji, setEmoji] = useState(dept?.emoji ?? prod?.emoji ?? "");
  const [parent, setParent] = useState(dept?.parent_id ?? prod?.department_id ?? "");
  const [qty, setQty] = useState(String(prod?.default_quantity ?? 1));
  const [unit, setUnit] = useState(prod?.default_unit ?? "stueck");
  const [before, setBefore] = useState(head?.before_product_id ?? "");
  const deptProds = prod ? data.prods.filter((x) => x.department_id === prod.department_id).slice().sort((a, b) => a.sort_order - b.sort_order) : [];
  const deptHeads = prod ? data.heads.filter((h) => h.department_id === prod.department_id) : [];
  const curHeadingId = (() => {
    if (!prod) return "";
    const idx = deptProds.findIndex((x) => x.id === prod.id);
    let curH = "";
    for (const h of deptHeads) { const ai = deptProds.findIndex((x) => x.id === h.before_product_id); if (ai >= 0 && ai <= idx) curH = h.id; }
    return curH;
  })();
  const [headingSel, setHeadingSel] = useState(curHeadingId);
  const [diets, setDiets] = useState<string[]>(prod?.excluded_diets ?? []);
  const [variants, setVariants] = useState<string[]>(prod?.variants ?? []);
  const [variantInput, setVariantInput] = useState("");
  const [vDrag, setVDrag] = useState<number | null>(null);
  const [vOver, setVOver] = useState<number | null>(null);
  const suggestFn = useServerFn(suggestVariants);
  const [askAi, setAskAi] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiCount, setAiCount] = useState(10);
  const [sug, setSug] = useState<string[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const runSuggest = async () => {
    if (!prod) return;
    setAskAi(false); setAiBusy(true);
    try {
      const r = await suggestFn({ data: { productId: prod.id, count: aiCount } });
      setSug(r.items); setPicked(r.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setAiBusy(false); }
  };
  const applySug = () => {
    setVariants((x) => {
      const next = [...x];
      for (const s of picked) if (!next.some((y) => y.toLowerCase() === s.toLowerCase())) next.push(s);
      return next;
    });
    setSug(null);
  };
  const addVariant = (v: string) => {
    const vals = v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    setVariants((x) => {
      const next = [...x];
      for (const val of vals) if (!next.some((y) => y.toLowerCase() === val.toLowerCase())) next.push(val);
      return next;
    });
    setVariantInput("");
  };
  const tr = data.tr.get(sel.id) ?? {};
  const title = T(`adm.edit.${sel.kind}` as MessageKey);
  const [prodImgUrl, setProdImgUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setProdImgUrl(null);
    if (!prod?.image_path) return;
    signedCategoryImageUrl(prod.image_path).then((u) => { if (alive) setProdImgUrl(u); });
    return () => { alive = false; };
  }, [prod?.image_path]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/30" onClick={p.onClose}>
      <div className="max-h-[88dvh] w-full max-w-[440px] space-y-3 overflow-y-auto rounded-t-3xl bg-background p-5 pb-[calc(5rem+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button onClick={p.onClose} className="text-muted-foreground" aria-label={T("adm.close")}>✕</button>
        </div>

        <div className={sel.kind === "heading" ? "" : "grid grid-cols-[1fr_4rem] gap-2"}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={T("adm.nameDe")} />
          {sel.kind !== "heading" && <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🙂" />}
        </div>
        {sel.kind !== "heading" && (
          <select value={parent} onChange={(e) => setParent(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
            {sel.kind === "department" && <option value="">{T("adm.topLevel")}</option>}
            {p.deptOptions.filter((o) => o.id !== sel.id).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        )}
        {prod && <div className="flex flex-wrap items-center gap-3">
          {prodImgUrl && <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
            <ZoomableImage src={prodImgUrl} className="h-full w-full object-contain" />
          </div>}
          <Button type="button" variant="outline" onClick={p.onEditImage}>🖼️ {T("adm.previewImage")}</Button>
        </div>}
        {prod && (
          <div className="grid grid-cols-2 gap-2">
            <Input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
            <UnitSelect value={unit} onChange={setUnit} />
          </div>
        )}
        {prod && deptHeads.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">{T("adm.headingAssign")}</h3>
            <select value={headingSel} onChange={(e) => setHeadingSel(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
              <option value="">{T("adm.noHeading")}</option>
              {deptHeads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        {prod && (
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-foreground">{T("adm.diets")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {DIETS.map((diet) => {
                const on = diets.includes(diet);
                return (
                  <button
                    key={diet}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDiets((x) => (on ? x.filter((v) => v !== diet) : [...x, diet]))}
                    className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground"}`}
                  >
                    {DIET_EMOJI[diet]} {T(`diet.${diet}` as MessageKey)}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">{T("adm.dietsHint")}</p>
          </div>
        )}
        {prod && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{T("adm.variants")}</h3>
              <VariantAiBulkButton productId={prod.id} productName={prod.name} variants={prod.variants ?? []} />
            </div>
            {variants.length > 0 && (
              <div className="divide-y divide-border rounded-lg border border-border">
                {variants.map((v, vi) => (
                  <div
                    key={v}
                    draggable
                    onDragStart={() => setVDrag(vi)}
                    onDragOver={(e) => { e.preventDefault(); setVOver(vi); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (vDrag === null || vDrag === vi) { setVDrag(null); setVOver(null); return; }
                      setVariants((x) => { const next = [...x]; const movedV = next[vDrag]!; next.splice(vDrag, 1); next.splice(vi, 0, movedV); return next; });
                      setVDrag(null); setVOver(null);
                    }}
                    onDragEnd={() => { setVDrag(null); setVOver(null); }}
                    className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm ${vDrag === vi ? "opacity-40" : ""} ${vOver === vi && vDrag !== null && vDrag !== vi ? "bg-primary-soft" : ""}`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className="cursor-grab select-none text-muted-foreground">⠿</span>
                      <span className="truncate">{v}</span>
                    </span>
                    {(prod.variants ?? []).includes(v) && <VariantImageButton productId={prod.id} productName={prod.name} variant={v} />}
                    <button
                      type="button"
                      aria-label={`${v} entfernen`}
                      onClick={() => setVariants((x) => x.filter((y) => y !== v))}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </button>
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
                  <button
                    key={cv}
                    type="button"
                    disabled={on}
                    onClick={() => addVariant(cv)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/15 text-muted-foreground line-through" : "border-border bg-background text-muted-foreground"}`}
                  >
                    {on ? "✓ " : "+ "}{cv}
                  </button>
                );
              })}
            </div>
            {!sug && !askAi && (
              <Button type="button" variant="outline" size="sm" disabled={aiBusy} onClick={() => setAskAi(true)}>
                {aiBusy ? T("adm.working") : `✨ ${T("adm.variantSuggest")}`}
              </Button>
            )}
            {askAi && (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
                <p>{T("adm.variantSuggestConfirm")}</p>
                <label className="flex items-center gap-2">
                  <span>{T("adm.suggestCount")}</span>
                  <select value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} className="rounded-lg border border-input bg-background px-2 py-1">
                    {[5, 10, 15].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setAskAi(false)}>{T("adm.cancel")}</Button>
                  <Button size="sm" className="flex-1" onClick={() => void runSuggest()}>✨ {T("adm.variantSuggest")}</Button>
                </div>
              </div>
            )}
            {sug && (
              <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
                {sug.length === 0 ? <p className="text-sm text-muted-foreground">{T("adm.variantSuggestNone")}</p> : (
                  <div className="flex flex-wrap gap-1.5">
                    {sug.map((s) => {
                      const on = picked.includes(s);
                      return (
                        <button key={s} type="button" aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== s) : [...picked, s])}
                          className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}>{s}</button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setSug(null)}>{T("adm.cancel")}</Button>
                  <Button size="sm" className="flex-1" disabled={!picked.length} onClick={applySug}>{T("adm.variantSuggestApply")}</Button>
                </div>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">{T("adm.variantsHint")}</p>
          </div>
        )}
        {head && (
          <select value={before} onChange={(e) => setBefore(e.target.value)} className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm">
            {p.products.map((x) => <option key={x.id} value={x.id}>{T("adm.above", { name: x.name })}</option>)}
          </select>
        )}
        <div className="flex gap-2">
          <Button className="flex-1" disabled={p.busy || !name.trim()} onClick={() => p.onSave({
            name: name.trim(), emoji, before,
            ...(sel.kind !== "heading" ? { parent } : {}),
            ...(prod ? { qty: Number(qty.replace(",", ".")) || 1, unit, diets, variants, heading: headingSel } : {}),
          })}>{T("adm.save")}</Button>
          <Button variant="destructive" disabled={p.busy} onClick={p.onDelete}>{T("adm.delete")}</Button>
        </div>
        {dept && <DeptImageEditor deptId={dept.id} imagePath={dept.image_path} onChanged={p.onImageChanged} />}
        {dept && <DeptAliasEditor dept={dept} depts={data.depts} options={p.deptOptions} />}
        {prod && <ProductAliasEditor product={prod} prods={data.prods} options={p.deptOptions} />}
        {prod && !prodNonFood && <ProductCuisinePicker productId={prod.id} />}
        {prod && <ProductSynonymEditor key={`syn-${prod.id}`} productId={prod.id} />}
        {prod && <ProductBrandEditor key={prod.id} productId={prod.id} productName={prod.name} path={data.depts.find((x) => x.id === prod.department_id)?.name ?? ""} />}

        <div className="flex items-center justify-between pt-2">
          <h3 className="text-sm font-semibold text-foreground">{T("adm.languages")}</h3>
          <Button size="sm" variant="outline" disabled={p.busy} onClick={p.onRetranslate}>{T("adm.retranslate")}</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">{T("adm.trHint")}</p>
        <div className="space-y-1.5">
          {LOCALES.filter((l) => l.id !== "de-DE").map((l) => (
            <TrField key={l.id + (tr[l.id]?.name ?? "")} label={`${l.flag} ${l.id}`} value={tr[l.id]?.name ?? ""} manual={tr[l.id]?.is_manual}
              onSave={(v) => p.onTr(l.id, v, tr[l.id]?.name)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrField({ label, value, manual, onSave }: { label: string; value: string; manual?: boolean | undefined; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <label className="grid grid-cols-[5.5rem_1fr] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input value={v} onChange={(e) => setV(e.target.value)} onBlur={() => onSave(v)}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`rounded-lg border px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary ${manual ? "border-primary bg-primary-soft/30" : "border-input bg-background"}`} />
    </label>
  );
}
