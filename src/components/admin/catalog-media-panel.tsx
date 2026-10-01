import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { catalogMediaStatus, generateProductImages, generateReferencePrices } from "@/lib/product-media.functions";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { Button } from "@/components/ui/button";
import { MARKETS } from "@/components/market-admin";
import { flagOf } from "@/lib/catalog-query";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

/** KI-Bilder und KI-Richtpreise für den Katalog erzeugen (stapelweise). */
export function CatalogMediaPanel() {
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
    <section className="mt-8 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">{T("media.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{T("media.hint")}</p>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{T("media.market")}</span>
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        >
          {MARKETS.map((m) => (
            <option key={m} value={m}>
              {flagOf(m)} {m}
            </option>
          ))}
        </select>
      </div>

      {s && (
        <p className="mt-3 text-sm text-muted-foreground">
          {T("media.status", { total: s.total, noImage: s.noImage, priced: s.priced })}
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
        <Button size="sm" variant="secondary" disabled={busy !== null} onClick={runPrices}>
          {busy === "price" ? T("media.working") : T("media.genPrices")}
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
    </section>
  );
}
