import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin, translateMissing, saveHeading, deleteHeading, suggestProducts, rankProducts, translateVariants } from "@/lib/admin.functions";
import { LOCALES, getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);
import { getUnits } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CuisineAdmin, ProductCuisinePicker } from "@/components/cuisine-admin";
import { RecipeAdmin } from "@/components/recipe-admin";
import { DeptAliasEditor, DeptAliasRows } from "@/components/dept-alias-admin";
import { ProductBrandEditor } from "@/components/brand-admin";
import { ProductAliasEditor, ProductAliasRows } from "@/components/product-alias-admin";
import { DeptImageEditor } from "@/components/dept-image-admin";
import { ZoomableImage } from "@/components/admin/zoomable-image";
import { signedCategoryImageUrl } from "@/lib/image-upload";
import { MarketAdmin, MarketAdminsManager } from "@/components/market-admin";
import { useMarketCodes } from "@/hooks/use-markets";
import { MarketsManager } from "@/components/admin/markets-manager";
import { flagOf } from "@/lib/catalog-query";
import { DIETS, DIET_EMOJI } from "@/hooks/use-diet-filter";
import { ImportPanel } from "@/components/admin/import-panel";
import { CatalogMediaPanel } from "@/components/admin/catalog-media-panel";
import { CatalogTileEditor } from "@/components/admin/catalog-tile-editor";
import { LocaleAdminPanel } from "@/components/admin/locale-admin-panel";
import { useReferencePrices } from "@/hooks/use-reference-prices";

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
type Dept = { id: string; name: string; emoji: string | null; parent_id: string | null; sort_order: number; image_path: string | null };
type Prod = { id: string; name: string; emoji: string | null; department_id: string; sort_order: number; default_quantity: number; default_unit: string; excluded_diets: string[]; variants: string[]; markets: string[]; image_path: string | null };
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
    paged<Dept>((a, b) => supabase.from("departments").select("id, name, emoji, parent_id, sort_order, image_path").order("sort_order").order("id").range(a, b)),
    paged<Prod>((a, b) => supabase.from("products").select("id, name, emoji, department_id, sort_order, default_quantity, default_unit, excluded_diets, variants, markets, image_path").order("sort_order").order("id").range(a, b) as never),
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
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [bulk, setBulk] = useState<false | "plain" | "suggest">(false);
  /** Aktiver Admin-Bereich (Tabs). */
  const [tab, setTab] = useState<"catalog" | "media" | "prices" | "import" | "recipes" | "languages" | "more">("catalog");
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
  const children = (d?.depts ?? []).filter((x) => x.parent_id === cur);
  const products = useMemo(() => {
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
  const unavailable = (p: Prod) => Boolean(mk && d && ((p.markets.length > 0 && !p.markets.includes(mk)) || d.excl.has(`${p.id}|${mk}`)));
  const headings = (d?.heads ?? []).filter((x) => x.department_id === cur);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    await qc.invalidateQueries({ queryKey: ["catalog"] });
  };
  const run = async (fn: () => Promise<unknown>, ok = T("adm.saved")) => {
    setBusy(true);
    try { await fn(); toast.success(ok); await refresh(); }
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
    run(() => kind === "product" ? saveOrder(next) : Promise.all(next.map((x, i) => must(supabase.from(TABLE[kind]).update({ sort_order: i + 1 }).eq("id", x.id)))), T("adm.orderSaved"));
  };

  /** Produkt-Reihenfolge speichern: global in products, sonst pro Markt in product_market_order. */
  const saveOrder = async (list: { id: string }[]) => {
    if (!mk) {
      await Promise.all(list.map((x, i) => must(supabase.from("products").update({ sort_order: i + 1 }).eq("id", x.id))));
      return;
    }
    await must(supabase.from("product_market_order").upsert(
      list.map((x, i) => ({ product_id: x.id, market: mk, sort_order: i + 1 })),
      { onConflict: "product_id,market" },
    ));
  };

  /** Überschrift verschieben: die ganze Gruppe (Überschrift + ihre Produkte bis zur nächsten Überschrift) wandert mit. */
  const moveHeading = (headingId: string, beforeProductId: string) => {
    const h = d?.heads.find((x) => x.id === headingId);
    if (!h || h.before_product_id === beforeProductId) return;
    const anchors = new Set(d?.heads.filter((x) => x.id !== headingId).map((x) => x.before_product_id) ?? []);
    const start = products.findIndex((p) => p.id === h.before_product_id);
    if (start < 0) { // leere Gruppe: nur der Titel wandert
      run(() => saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId } }), T("adm.headingMoved"));
      return;
    }
    let end = start + 1;
    while (end < products.length && !anchors.has(products[end]!.id)) end++;
    const group = products.slice(start, end);
    if (group.some((p) => p.id === beforeProductId)) return; // Ziel liegt in der eigenen Gruppe
    if (!confirm(T("adm.headingMoveConfirm", { name: h.name, n: group.length }))) return;
    const rest = products.filter((p) => !group.includes(p));
    const at = rest.findIndex((p) => p.id === beforeProductId);
    const next = at < 0 ? [...rest, ...group] : [...rest.slice(0, at), ...group, ...rest.slice(at)];
    run(async () => {
      await saveOrder(next);
      await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: group[0]!.id } });
    }, T("adm.headingMoved"));
  };

  const nm = (id: string, base: string) => viewLoc === "de-DE" ? base : d?.tr.get(id)?.[viewLoc]?.name ?? base;
  const pathText = () => path(cur).map((p) => p.name).join(" › ");
  /** Produkte aus Nachbarkategorien (gleiche Oberkategorie), damit nichts doppelt vorgeschlagen wird. */
  const siblingNames = () => {
    const parent = cur ? deptById.get(cur)?.parent_id : null;
    const sib = new Set((d?.depts ?? []).filter((x) => x.parent_id === parent && x.id !== cur).map((x) => x.id));
    return (d?.prods ?? []).filter((x) => sib.has(x.department_id)).map((x) => x.name);
  };
  const loadSuggestions = async (typed: string[]) => {
    const r = await suggest({ data: { path: pathText(), existing: products.map((p) => p.name).slice(0, 400), exclude: [...typed, ...siblingNames()].slice(0, 400), ...(mk ? { market: mk } : {}) } });
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

  const handleBulkSubmit = (names: string[], emoji: string, qty: number, unit: string, mkOnly: Set<string>) => run(async () => {
    if (!cur) return;
    const rows = names.map((name, i) => ({ department_id: cur, name, markets: mk && mkOnly.has(name) ? [mk] : [], emoji: emoji || null, default_quantity: qty, default_unit: unit as never, sort_order: products.length + i + 1 }));
    const r = await supabase.from("products").insert(rows).select("id");
    if (r.error) throw new Error(r.error.message);
    await translateIds((r.data ?? []).map((x) => x.id as string));
    setBulk(false);
  }, T("adm.created"));

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">{T("adm.title")}</h1>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>{T("adm.signOut")}</Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" role="tablist" aria-label={T("adm.title")}>
        {([["catalog", "adm.tab.catalog"], ["recipes", "adm.tab.recipes"], ["languages", "adm.tab.languages"], ["media", "adm.tab.media"], ["prices", "adm.tab.prices"], ["import", "adm.tab.import"], ["more", "adm.tab.more"]] as const).map(([id, key]) => (
          <button key={id} role="tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
            {T(key)}
          </button>
        ))}
      </div>

      {tab === "catalog" && (<>
      <div className="grid grid-cols-3 gap-2 text-center md:max-w-xl">
        <Stat label={T("adm.categories")} value={d?.depts.length} />
        <Stat label={T("adm.products")} value={d?.prods.length} />
        <Stat label={T("adm.headings")} value={d?.heads.length} />
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
          </div>
        )}
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
            path={path(cur)} nm={nm} unavailable={(x) => unavailable(x as Prod)} prices={refPrices.data} run={run} must={must} translateIds={translateIds}
            reorder={reorder} remove={(kind, id, name) => remove({ kind, id }, name)}
            busy={busy}
            headings={headings}
            onAddHeading={(name) => { if (cur && products[0]) void run(() => saveH({ data: { departmentId: cur, beforeProductId: products[0]!.id, name } }), T("adm.created")); }}
            onMoveHeading={moveHeading}
            onRenameHeading={(id, name) => { const h = headings.find((x) => x.id === id); if (h) void run(() => saveH({ data: { id, departmentId: h.department_id, beforeProductId: h.before_product_id, name } }), T("adm.saved")); }}
            onDeleteHeading={(id, name) => { if (confirm(`${T("adm.delete")}: ${name}?`)) void run(() => delH({ data: { id } }), T("adm.deleted")); }}
            onBulkAdd={cur ? () => setBulk("plain") : undefined}
            onTranslateMissing={() => run(async () => toast.info(T("adm.trAdded", { n: await translateIds() })), T("adm.trDone"))}
            onAdvanced={(kind, id) => setSel({ kind, id })}
            below={cur ? (
              <>
                <DeptAliasRows parentId={cur} depts={d.depts} onEdit={(id) => setSel({ kind: "department", id })} />
                <ProductAliasRows departmentId={cur} prods={d.prods} onEdit={(id) => setSel({ kind: "product", id })} />
              </>
            ) : null} />
          {bulk && (
            <BulkAddForm key={bulk} autoSuggest={bulk === "suggest"} onSuggest={loadSuggestions} market={mk} onCancel={() => setBulk(false)}
              onSubmit={handleBulkSubmit} />
          )}
        </>
      ) : null}

      {sel && d && (
        <Editor key={sel.kind + sel.id} sel={sel} name={selName} data={d} products={(d.prods).filter((p) => p.department_id === (sel.kind === "heading" ? d.heads.find((h) => h.id === sel.id)?.department_id : undefined))}
          busy={busy} onClose={() => setSel(null)} onDelete={() => remove(sel, selName)}
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
              if (sel.kind === "product" && patch.heading !== undefined) {
                const prod0 = d.prods.find((x) => x.id === sel.id)!;
                const list = d.prods.filter((x) => x.department_id === prod0.department_id).slice().sort((a, b) => a.sort_order - b.sort_order);
                const heads = d.heads.filter((h) => h.department_id === prod0.department_id);
                const myIdx = list.findIndex((x) => x.id === sel.id);
                let curH = "";
                for (const h of heads) { const ai = list.findIndex((x) => x.id === h.before_product_id); if (ai >= 0 && ai <= myIdx) curH = h.id; }
                if (patch.heading !== curH) {
                  const follower = list[myIdx + 1];
                  const anchored = heads.filter((h) => h.before_product_id === sel.id);
                  const rest = list.filter((x) => x.id !== sel.id);
                  let at = 0;
                  if (patch.heading) {
                    const h = heads.find((x) => x.id === patch.heading)!;
                    let ai = rest.findIndex((x) => x.id === h.before_product_id);
                    if (ai < 0) ai = follower ? rest.findIndex((x) => x.id === follower.id) : 0;
                    if (ai < 0) ai = 0;
                    let end = rest.length;
                    for (const o of heads) { if (o.id === h.id || o.before_product_id === sel.id) continue; const oi = rest.findIndex((x) => x.id === o.before_product_id); if (oi > ai && oi < end) end = oi; }
                    at = end;
                  }
                  await saveOrder([...rest.slice(0, at), prod0, ...rest.slice(at)]);
                  for (const h of anchored) {
                    if (follower) await saveH({ data: { id: h.id, departmentId: h.department_id, beforeProductId: follower.id } });
                  }
                }
              }
            }
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

      </>)}

      {tab === "media" && <LoadingGate d={d}><CatalogMediaPanel section="images" /></LoadingGate>}
      {tab === "prices" && <LoadingGate d={d}><CatalogMediaPanel section="prices" /></LoadingGate>}
      {tab === "import" && (d ? <ImportPanel depts={d.depts} prods={d.prods} /> : <LoadingGate d={d}>{null}</LoadingGate>)}


      {tab === "recipes" && (d ? <><RecipeAdmin depts={d.depts} prods={d.prods} /><CuisineAdmin depts={d.depts} prods={d.prods} /></> : <LoadingGate d={d}>{null}</LoadingGate>)}
      {tab === "languages" && <LoadingGate d={d}><LocaleAdminPanel /></LoadingGate>}

      {tab === "more" && (<div className="space-y-4">
        <MarketsManager />
        <MarketAdminsManager />
        <Link to="/vorlese-texte" className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground">

          <span>🔊 {T("stx.title")}</span><span className="text-muted-foreground">›</span>
        </Link>
      </div>)}
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

type Suggestion = { name: string; emoji: string; reason: string; scope: "global" | "market" };

function BulkAddForm({ onSubmit, onCancel, onSuggest, autoSuggest, market }: {
  onSubmit: (names: string[], emoji: string, qty: number, unit: string, mkOnly: Set<string>) => void; onCancel: () => void;
  onSuggest: (typed: string[]) => Promise<Suggestion[]>; autoSuggest?: boolean; market?: string;
}) {
  const [mkOnly, setMkOnly] = useState<Set<string>>(new Set());
  const [text, setText] = useState("");
  const [sugs, setSugs] = useState<Suggestion[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [loadingS, setLoadingS] = useState(false);
  const fetchS = async () => {
    setLoadingS(true);
    try {
      const typed = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const r = await onSuggest(typed);
      setSugs(r); setPicked(new Set(r.map((x) => x.name)));
      setMkOnly((s) => { const n = new Set(s); r.forEach((x) => { if (x.scope === "market") n.add(x.name); }); return n; });
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoadingS(false); }
  };
  useEffect(() => { if (autoSuggest) void fetchS(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const takeOver = () => {
    const add = (sugs ?? []).filter((x) => picked.has(x.name)).map((x) => x.name);
    setText((t) => [...t.split("\n").map((l) => l.trim()).filter(Boolean), ...add].join("\n"));
    setSugs(null);
  };
  const [emoji, setEmoji] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("stueck");
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
        <Button type="button" size="sm" variant="outline" className="w-full" disabled={loadingS} onClick={fetchS}>
          {loadingS ? T("adm.searchingMissing") : "✨ " + T("adm.suggestMissing")}
        </Button>
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
                    <span className="ml-auto truncate text-xs text-muted-foreground">{x.reason}</span>
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
      <div className="flex gap-2">
        <Button className="flex-1" disabled={names.length === 0} onClick={() => onSubmit(names, emoji, Number(qty.replace(",", ".")) || 1, unit, mkOnly)}>
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
}) {
  const { sel, data } = p;
  const dept = sel.kind === "department" ? data.depts.find((x) => x.id === sel.id) : undefined;
  const prod = sel.kind === "product" ? data.prods.find((x) => x.id === sel.id) : undefined;
  const head = sel.kind === "heading" ? data.heads.find((x) => x.id === sel.id) : undefined;
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
        {prod && prodImgUrl && (
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
              <ZoomableImage src={prodImgUrl} className="h-full w-full object-contain" />
            </div>
            <p className="text-[11px] text-muted-foreground">{T("adm.imgDblHint")}</p>
          </div>
        )}
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
            <h3 className="text-sm font-semibold text-foreground">{T("adm.variants")}</h3>
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
        {prod && <ProductCuisinePicker productId={prod.id} />}
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
