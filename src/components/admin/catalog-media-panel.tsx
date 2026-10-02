import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { catalogMediaStatus, generateProductImages, generateReferencePrices, listProductImages, listReferencePrices } from "@/lib/product-media.functions";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketCodes } from "@/hooks/use-markets";
import { flagOf } from "@/lib/catalog-query";
import { formatRefPrice } from "@/hooks/use-reference-prices";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

/** KI-Bilder und KI-Richtpreise für den Katalog erzeugen (stapelweise); section wählt den Tab-Inhalt. */
export function CatalogMediaPanel({ section }: { section: "images" | "prices" }) {
  const MARKETS = useMarketCodes();
  const qc = useQueryClient();
  const statusFn = useServerFn(catalogMediaStatus);
  const genImages = useServerFn(generateProductImages);
  const genPrices = useServerFn(generateReferencePrices);
  const [market, setMarket] = useState(getLocale().split("-")[1] ?? "CH");
  const [busy, setBusy] = useState<"img" | "price" | "allImg" | null>(null);
  const [allProgress, setAllProgress] = useState<{ done: number; total: number } | null>(null);
  const [generated, setGenerated] = useState<Array<{ id: string; name: string; url: string | null }>>([]);

  const status = useQuery({
    queryKey: ["catalog-media-status", market],
    queryFn: () => statusFn({ data: { market } }),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["catalog-media-status"] });

  const runImages = async () => {
    setBusy("img");
    try {
      const r = await genImages({ data: { limit: 5 } });
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

  const runPrices = async () => {
    setBusy("price");
    try {
      const r = await genPrices({ data: { market, limit: 50 } });
      toast.success(T("media.priceDone", { n: r.done }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      refresh();
    }
  };

  const s = status.data;
  return (
    <>
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
            const active = m === market;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMarket(m)}
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
            {busy === "price" ? T("media.working") : T("media.genPrices")}
          </Button>
        </div>

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
