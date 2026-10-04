import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { catalogMediaStatus, estimateAndSaveProductPrice, estimateCategoryPrices, generateProductImages, generateReferencePrices, listCategoryPrices, listProductImages, listProductsMissingIcons, listReferencePrices } from "@/lib/product-media.functions";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketCodes } from "@/hooks/use-markets";
import { flagOf } from "@/lib/catalog-query";
import { formatRefPrice } from "@/hooks/use-reference-prices";
import { saveProductIconFromPath } from "@/lib/product-icon";
import { ChevronDown, ChevronRight, Pencil, Sparkles } from "lucide-react";
import { MissingImagesPanel } from "./missing-images-panel";
import { CategoryImageGallery } from "./category-image-gallery";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

/** KI-Bilder und KI-Richtpreise für den Katalog erzeugen (stapelweise); section wählt den Tab-Inhalt. */
export function CatalogMediaPanel({ section, depts = [], prods = [], onEdit }: { section: "images" | "prices"; depts?: Array<{ id: string; name: string; parent_id: string | null }>; prods?: Array<{ id: string; name: string; emoji: string | null; department_id: string; image_path: string | null; icon_path?: string | null; variants?: string[] }>; onEdit?: ((id: string) => void) | undefined }) {
  const MARKETS = useMarketCodes();
  const qc = useQueryClient();
  const statusFn = useServerFn(catalogMediaStatus);
  const genImages = useServerFn(generateProductImages);
  const genPrices = useServerFn(generateReferencePrices);
  const estCat = useServerFn(estimateCategoryPrices);
  const [markets, setMarkets] = useState<Set<string>>(() => new Set([getLocale().split("-")[1] ?? "CH"]));
  const market = [...markets][0] ?? "CH";
  const marketList = [...markets].join(", ");
  const toggleMarket = (m: string) => setMarkets((cur) => {
    const next = new Set(cur);
    if (next.has(m)) { if (next.size > 1) next.delete(m); } else next.add(m);
    return next;
  });
  const [busy, setBusy] = useState<"img" | "price" | "allImg" | "catPrice" | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set());
  const [allProgress, setAllProgress] = useState<{ done: number; total: number } | null>(null);
  const [generated, setGenerated] = useState<Array<{ id: string; name: string; path: string; url: string | null }>>([]);
  const [iconProgress, setIconProgress] = useState<{ done: number; total: number } | null>(null);
  const [iconBusy, setIconBusy] = useState(false);
  const iconBatch = useServerFn(listProductsMissingIcons);

  const finishIcons = async (items: Array<{ id: string; path: string }>) => {
    for (const item of items) await saveProductIconFromPath(item.id, item.path);
    void qc.invalidateQueries({ queryKey: ["catalog"] });
    void qc.invalidateQueries({ queryKey: ["catalog-images"] });
  };

  const backfillIcons = async () => {
    setIconBusy(true);
    let done = 0;
    const total = status.data?.missingIcons ?? 0;
    setIconProgress({ done, total });
    try {
      while (true) {
        const batch = await iconBatch({ data: { limit: 10 } });
        if (!batch.length) break;
        for (const item of batch) {
          await finishIcons([item]);
          setIconProgress({ done: ++done, total });
        }
      }
      toast.success(T("media.iconsDone", { n: done }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIconBusy(false);
      setIconProgress(null);
      refresh();
    }
  };

  /** Kategorien in der gelieferten Katalogreihenfolge, jeweils unter ihrer Oberkategorie. */
  const deptChildren = (() => {
    const byParent = new Map<string | null, typeof depts>();
    for (const d of depts) byParent.set(d.parent_id, [...(byParent.get(d.parent_id) ?? []), d]);
    return byParent;
  })();

  const toggleCategory = (id: string) => {
    setOpenCategories((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runCategoryPrices = async (dept: (typeof depts)[number]) => {
    if (!window.confirm(T("price.catConfirm", { name: dept.name, market: marketList }))) return;
    setBusy("catPrice");
    try {
      let done = 0, total = 0;
      for (const m of markets) {
        const r = await estCat({ data: { market: m, departmentId: dept.id, onlyMissing: true } });
        done += r.done; total += r.total;
      }
      toast.success(T("price.catDone", { done, total }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      refresh();
      void qc.invalidateQueries({ queryKey: ["ref-price-list"] });
    }
  };

  const status = useQuery({
    queryKey: ["catalog-media-status", market],
    queryFn: () => statusFn({ data: { market } }),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["catalog-media-status"] });

  const runImages = async () => {
    setBusy("img");
    try {
      const r = await genImages({ data: { limit: 5 } });
      await finishIcons(r.items);
      if (r.errors.length > 0) toast.error(r.errors[0]!);
      setGenerated((g) => [...r.items, ...g].slice(0, 60));
      toast.success(T("media.imgDone", { n: r.done }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const runAllImages = async () => {
    setBusy("allImg");
    let totalDone = 0;
    const total = status.data?.noImage ?? 0;
    setAllProgress({ done: 0, total });
    try {
      for (;;) {
        const r = await genImages({ data: { limit: 5 } });
        await finishIcons(r.items);
        totalDone += r.done;
        setAllProgress({ done: totalDone, total });
        setGenerated((g) => [...r.items, ...g].slice(0, 60));
        if (r.errors.length > 0) {
          toast.error(r.errors[0]!);
          break;
        }
        if (r.done === 0 || r.attempted === 0) break;
        refresh();
      }
      toast.success(T("media.allDone", { n: totalDone }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setAllProgress(null);
      refresh();
    }
  };

  const [priceProg, setPriceProg] = useState<{ market: string; done: number; total: number } | null>(null);
  const runPrices = async () => {
    setBusy("price");
    try {
      let done = 0, i = 0;
      for (const m of markets) {
        setPriceProg({ market: m, done: ++i, total: markets.size });
        const r = await genPrices({ data: { market: m, limit: 50 } });
        done += r.done;
      }
      toast.success(T("media.priceDone", { n: done }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setPriceProg(null);
      refresh();
    }
  };

  const s = status.data;
  const [openProducts, setOpenProducts] = useState<Set<string>>(() => new Set());
  const toggleProducts = (id: string) => {
    setOpenProducts((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const categoryRows = (parent: string | null): React.ReactNode =>
    (deptChildren.get(parent) ?? []).map((dept) => {
      const hasChildren = (deptChildren.get(dept.id)?.length ?? 0) > 0;
      const open = openCategories.has(dept.id);
      const productsOpen = openProducts.has(dept.id);
      return (
        <div key={dept.id}>
          <div className="flex min-h-11 items-center gap-1.5 border-b border-border/50 py-1 last:border-0">
            {hasChildren ? (
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => toggleCategory(dept.id)} aria-label={dept.name} aria-expanded={open} title={dept.name}>
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            ) : <span className="w-8 shrink-0" />}
            <button type="button" onClick={() => toggleProducts(dept.id)} aria-expanded={productsOpen} title={T("price.catProducts")} className="flex min-w-0 flex-1 items-center gap-1 text-left text-sm hover:text-primary">
              <span className="min-w-0 flex-1 truncate">{dept.name}</span>
              {productsOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            </button>
            <Button size="sm" variant="secondary" className="h-8 w-8 shrink-0 p-0 sm:w-auto sm:px-3" disabled={busy !== null} onClick={() => void runCategoryPrices(dept)} aria-label={`${T("price.catRun")}: ${dept.name}`} title={`${T("price.catRun")}: ${dept.name}`}>
              <Sparkles className="h-4 w-4 sm:hidden" aria-hidden="true" />
              <span className="hidden sm:inline">{busy === "catPrice" ? T("media.working") : T("price.catRun")}</span>
            </Button>
          </div>
          {productsOpen && <CategoryProducts departmentId={dept.id} markets={[...markets]} onEdit={onEdit} />}
          {hasChildren && open && <div className="pl-4">{categoryRows(dept.id)}</div>}
        </div>
      );
    });
  return (
    <>
      {section === "images" && onEdit && <MissingImagesPanel depts={depts} prods={prods} onEdit={onEdit} />}
      {section === "images" && onEdit && <CategoryImageGallery depts={depts} prods={prods} onEdit={onEdit} />}
      {section === "images" && (
      <section className="mt-8 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold">{T("media.imgTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{T("media.imgHint")}</p>

        {s && (
          <p className="mt-3 text-sm text-muted-foreground">
            {T("media.imgStatus", { total: s.total, noImage: s.noImage })}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={busy !== null || !s || s.noImage === 0} onClick={runImages}>
            {busy === "img" ? T("media.working") : T("media.genImages")}
          </Button>
          <Button size="sm" variant="secondary" disabled={busy !== null || !s || s.noImage === 0} onClick={runAllImages}>
            {busy === "allImg"
              ? T("media.allProgress", { done: allProgress?.done ?? 0, total: allProgress?.total ?? 0 })
              : T("media.genAllImages")}
          </Button>
        </div>
        {(s?.missingIcons ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Button size="sm" variant="outline" disabled={busy !== null || iconBusy} onClick={() => void backfillIcons()}>
              {iconBusy ? T("media.iconsProgress", { done: iconProgress?.done ?? 0, total: iconProgress?.total ?? 0 }) : T("media.iconsBackfill", { n: s?.missingIcons ?? 0 })}
            </Button>
          </div>
        )}
        {generated.length > 0 && (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {generated.map((g) => (
              <figure key={g.id} className="overflow-hidden rounded-xl border border-border bg-background">
                {g.url ? (
                  <img src={g.url} alt={g.name} className="aspect-square w-full object-cover" loading="lazy" />
                ) : (
                  <div className="aspect-square w-full bg-muted" />
                )}
                <figcaption className="truncate px-1.5 py-1 text-center text-[11px] text-muted-foreground">{g.name}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <ImageGallery />
      </section>
      )}

      {section === "prices" && (
      <section className="mt-8 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold">{T("media.priceTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{T("media.priceHint")}</p>

        <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {MARKETS.map((m) => {
            const priced = s?.markets?.[m] ?? 0;
            const active = markets.has(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMarket(m)}
                aria-pressed={active}
                className={`flex flex-col items-center rounded-xl border px-1 py-1.5 text-center transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <span className="text-base leading-none">{flagOf(m)}</span>
                <span className={`text-[11px] font-semibold leading-tight ${active ? "text-primary" : ""}`}>{m}</span>
                <span className="text-[10px] leading-tight text-muted-foreground">{priced}</span>
              </button>
            );
          })}
        </div>

        {s && (
          <p className="mt-3 text-sm text-muted-foreground">
            {T("media.priceStatus", { market, priced: s.priced })}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={busy !== null} onClick={runPrices}>
            {busy === "price"
              ? (priceProg ? T("media.priceProgress", priceProg) : T("media.working"))
              : markets.size > 1 ? T("media.genPricesMulti", { n: markets.size }) : T("media.genPrices")}
          </Button>
        </div>

        {(deptChildren.get(null)?.length ?? 0) > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-background p-3">
            <h3 className="text-sm font-semibold">{T("price.catTitle")}</h3>
            <div className="mt-2 max-h-[32rem] overflow-y-auto border-t border-border">
              {categoryRows(null)}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-sm font-semibold">{T("price.listTitle")}</h3>
          <div className="mt-2 divide-y divide-border rounded-xl border border-border">
            {MARKETS.map((m) => (
              <MarketPriceList key={m} market={m} count={s?.markets?.[m] ?? 0} />
            ))}
          </div>
        </div>
      </section>
      )}
    </>
  );
}

/** Aufklappbare Produktliste einer Kategorie im Preise-Tab: zeigt Preis-Status, Einzelschätzung und Bearbeiten. */
function CategoryProducts({ departmentId, markets, onEdit }: { departmentId: string; markets: string[]; onEdit?: ((id: string) => void) | undefined }) {
  const fn = useServerFn(listCategoryPrices);
  const estOne = useServerFn(estimateAndSaveProductPrice);
  const qc = useQueryClient();
  const market = markets[0] ?? "CH";
  const per = 20;
  const [estimating, setEstimating] = useState<string | null>(null);
  const query = useInfiniteQuery({
    queryKey: ["cat-price-products", departmentId, market],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fn({ data: { market, departmentId, offset: pageParam, limit: per } }),
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length * per : undefined),
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const estimate = async (productId: string) => {
    setEstimating(productId);
    try {
      const r = await estOne({ data: { productId, markets } });
      if (r.errors.length > 0) toast.error(r.errors[0]!);
      else toast.success(T("price.estimated", { n: r.saved }));
      void qc.invalidateQueries({ queryKey: ["cat-price-products", departmentId] });
      void qc.invalidateQueries({ queryKey: ["ref-price-list"] });
      void qc.invalidateQueries({ queryKey: ["catalog-media-status"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setEstimating(null);
    }
  };

  return (
    <div className="mb-1 ml-9 rounded-xl border border-border bg-background p-2">
      {query.isLoading && <p className="px-1 py-1 text-sm text-muted-foreground">{T("media.working")}</p>}
      {!query.isLoading && items.length === 0 && <p className="px-1 py-1 text-sm text-muted-foreground">{T("price.catEmpty")}</p>}
      <ul className="max-h-80 overflow-y-auto">
        {items.map((p) => (
          <li key={p.product_id} className="flex items-center gap-2 border-b border-border/50 py-1.5 text-sm last:border-0">
            {p.iconUrl ? (
              <img src={p.iconUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" loading="lazy" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-base">{p.emoji ?? "🛒"}</span>
            )}
            <span className="min-w-0 flex-1 truncate">
              {p.name}
              {p.pack_size ? <span className="text-muted-foreground"> · {p.pack_size} {p.pack_unit ?? ""}</span> : null}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {p.price != null && p.currency
                ? formatRefPrice({ product_id: p.product_id, price: p.price, currency: p.currency, unit_price: p.unit_price, unit_basis: p.unit_basis, observed_at: p.observed_at ?? "" })
                : "–"}
            </span>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" disabled={estimating !== null} onClick={() => void estimate(p.product_id)} aria-label={`${T("price.estimateOne")}: ${p.name}`} title={T("price.estimateOne")}>
              <Sparkles className={`h-4 w-4 ${estimating === p.product_id ? "animate-pulse text-primary" : ""}`} />
            </Button>
            {onEdit && (
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => onEdit(p.product_id)} aria-label={`${T("adm.health.open")}: ${p.name}`} title={T("adm.health.open")}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <Button size="sm" variant="secondary" className="mt-2" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          {query.isFetchingNextPage ? T("media.working") : T("price.listMore")}
        </Button>
      )}
    </div>
  );
}

/** Dauerhafte Galerie aller Produkte mit Bild — durchsuchbar, seitenweise. */
function ImageGallery() {
  const galleryFn = useServerFn(listProductImages);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 30;

  const gallery = useQuery({
    queryKey: ["catalog-image-gallery", q, page],
    queryFn: () => galleryFn({ data: { q, page, perPage } }),
    placeholderData: keepPreviousData,
  });

  const g = gallery.data;
  const pages = g ? Math.max(1, Math.ceil(g.total / perPage)) : 1;

  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">{T("media.galleryTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{T("media.galleryHint")}</p>

      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(0);
        }}
        placeholder={T("media.gallerySearch")}
        className="mt-3"
      />

      {g && (
        <p className="mt-3 text-sm text-muted-foreground">
          {T("media.galleryCount", { n: g.total })}
        </p>
      )}

      {g && g.items.length > 0 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {g.items.map((it) => (
            <figure key={it.id} className="overflow-hidden rounded-xl border border-border bg-background">
              {it.url ? (
                <img src={it.url} alt={it.name} className="aspect-square w-full object-cover" loading="lazy" />
              ) : (
                <div className="aspect-square w-full bg-muted" />
              )}
              <figcaption className="truncate px-1.5 py-1 text-center text-[11px] text-muted-foreground">{it.name}</figcaption>
            </figure>
          ))}
        </div>
      )}

      {g && g.total === 0 && <p className="mt-3 text-sm text-muted-foreground">{T("media.galleryEmpty")}</p>}

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <Button size="sm" variant="secondary" disabled={page === 0 || gallery.isFetching} onClick={() => setPage((p) => p - 1)}>
            {T("media.galleryPrev")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {pages}
          </span>
          <Button size="sm" variant="secondary" disabled={page >= pages - 1 || gallery.isFetching} onClick={() => setPage((p) => p + 1)}>
            {T("media.galleryNext")}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Aufklappbare Richtpreis-Liste eines Markts; lädt erst beim Öffnen und dann seitenweise nach. */
function MarketPriceList({ market, count }: { market: string; count: number }) {
  const fn = useServerFn(listReferencePrices);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const per = 30;
  const query = useInfiniteQuery({
    queryKey: ["ref-price-list", market, q],
    enabled: open,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fn({ data: { market, q, offset: pageParam, limit: per } }),
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length * per : undefined),
  });
  useEffect(() => {
    const el = sentinel.current;
    if (!open || !el) return;
    const io = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [open, query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const groups = [...items.reduce((m, r) => { const k = r.dept || "—"; const arr = m.get(k) ?? []; arr.push(r); m.set(k, arr); return m; }, new Map<string, typeof items>())].sort((a, b) => a[0].localeCompare(b[0]));
  for (const g of groups) g[1].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted/50">
        <span>{flagOf(market)}</span>
        <span className="font-semibold">{market}</span>
        <span className="text-muted-foreground">· {count}</span>
        <span className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("price.listSearch")} className="mb-2" />
          {query.isLoading && <p className="text-sm text-muted-foreground">{T("media.working")}</p>}
          {!query.isLoading && items.length === 0 && <p className="text-sm text-muted-foreground">{T("price.listEmpty")}</p>}
          <ul className="max-h-96 overflow-y-auto">
            {groups.map(([dept, rows]) => (
              <li key={dept}>
                <p className="sticky top-0 bg-background px-1 py-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{dept}</p>
                <ul>
                  {rows.map((r) => (
                    <li key={r.id} className="flex items-baseline gap-2 border-b border-border/50 py-1.5 text-sm last:border-0">
                      <span className="min-w-0 flex-1 truncate">{r.name}{r.pack_size ? <span className="text-muted-foreground"> · {r.pack_size} {r.pack_unit ?? ""}</span> : null}</span>
                      <span className="shrink-0 tabular-nums">{formatRefPrice({ product_id: r.id, price: r.price, currency: r.currency, unit_price: r.unit_price, unit_basis: r.unit_basis, observed_at: r.observed_at })}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{new Date(r.observed_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            <div ref={sentinel} />
          </ul>
          {query.hasNextPage && (
            <Button size="sm" variant="secondary" className="mt-2" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
              {query.isFetchingNextPage ? T("media.working") : T("price.listMore")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
