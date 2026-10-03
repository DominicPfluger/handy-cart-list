import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { importMarketData } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { useMarketCodes } from "@/hooks/use-markets";
import { flagOf } from "@/lib/catalog-query";

const T = (key: MessageKey, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);

type Prod = { id: string; name: string };
type Row = { raw: string; product: Prod | null; price: number | null; sortOrder: number | null; hidden: boolean };

const CURRENCY_BY_MARKET: Record<string, string> = {
  CH: "CHF", DE: "EUR", AT: "EUR", FR: "EUR", ES: "EUR", MX: "MXN", IT: "EUR", BE: "EUR",
  NL: "EUR", GB: "GBP", US: "USD", CA: "CAD", PT: "EUR", BR: "BRL",
};

/** Eine Zeile «Name;Preis;Reihenfolge;ausgeblendet» zerlegen. */
function parseLine(line: string): Omit<Row, "product"> {
  const parts = line.split(/[;\t]/).map((s) => s.trim());
  const price = parts[1] ? Number(parts[1].replace(",", ".")) : NaN;
  const sort = parts[2] ? parseInt(parts[2], 10) : NaN;
  return {
    raw: parts[0] ?? "",
    price: Number.isFinite(price) && price > 0 ? price : null,
    sortOrder: Number.isFinite(sort) && sort >= 0 ? sort : null,
    hidden: /^(x|j|ja|y|yes|1|true|ausblenden)$/i.test(parts[3] ?? ""),
  };
}

/** Marktdaten (Preise, Reihenfolge, Sichtbarkeit) als Text einfügen und je Markt übernehmen. */
export function MarketDataImport({ prods }: { prods: Prod[] }) {
  const qc = useQueryClient();
  const importData = useServerFn(importMarketData);
  const MARKETS = useMarketCodes();
  const [market, setMarket] = useState(getLocale().split("-")[1] ?? "CH");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const byName = new Map<string, Prod>();
    for (const p of prods) byName.set(p.name.trim().toLowerCase(), p);
    return text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const parsed = parseLine(l);
      return { ...parsed, product: byName.get(parsed.raw.toLowerCase()) ?? null };
    });
  }, [text, prods]);

  const matched = rows.filter((r) => r.product && (r.price != null || r.sortOrder != null || r.hidden));
  const unmatched = rows.filter((r) => !r.product);

  const apply = async () => {
    if (!matched.length || !matched.every((m) => m.product)) return;
    setBusy(true);
    try {
      const r = await importData({
        data: {
          market,
          currency: CURRENCY_BY_MARKET[market] ?? "EUR",
          rows: matched.map((m) => ({ productId: m.product!.id, price: m.price, sortOrder: m.sortOrder, hidden: m.hidden })),
        },
      });
      toast.success(T("mdi.done", { prices: r.prices, orders: r.orders, hidden: r.hidden }));
      setText("");
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-lg font-bold text-foreground">📥 {T("mdi.title")}</h2>
      <p className="text-xs text-muted-foreground">{T("mdi.hint")}</p>
      <div className="flex gap-2">
        <select value={market} onChange={(e) => setMarket(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-2 text-sm">
          {MARKETS.map((m) => <option key={m} value={m}>{flagOf(m)} {m}</option>)}
        </select>
        <span className="self-center text-xs text-muted-foreground">{CURRENCY_BY_MARKET[market] ?? "EUR"}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        spellCheck={false}
        placeholder={T("mdi.placeholder")}
        className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs"
      />
      {rows.length > 0 && (
        <div className="space-y-1.5 text-xs">
          <p>
            <span className="font-semibold text-foreground">{T("mdi.found", { n: matched.length })}</span>
            {unmatched.length > 0 && <span className="text-destructive"> · {T("mdi.unmatched", { n: unmatched.length })}</span>}
          </p>
          {unmatched.slice(0, 8).map((r, i) => (
            <p key={i} className="truncate text-destructive/80">✕ {r.raw}</p>
          ))}
        </div>
      )}
      <Button className="w-full" disabled={busy || !matched.length} onClick={() => void apply()}>
        {busy ? T("adm.working") : T("mdi.apply", { n: matched.length })}
      </Button>
    </section>
  );
}
