import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { marketsQuery, MARKETS as FALLBACK_CODES, type MarketRow } from "@/hooks/use-markets";
import { setMarketOverride, useMarket, useMarketOverride } from "@/hooks/use-market";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useT } from "@/i18n";
import { flagOf } from "@/lib/catalog-query";
import { cn } from "@/lib/utils";

type Option = { code: string | null; label: string; flag: string };

function toOptions(markets: MarketRow[], fallbackCodes: string[], effective: string, autoLabel: string): Option[] {
  const active = markets.filter((m) => m.enabled);
  const rest: Option[] = active.length
    ? active.map((m) => ({ code: m.code, label: `${m.name} · ${m.currency}`, flag: m.flag }))
    : fallbackCodes.map((c) => ({ code: c, label: c, flag: flagOf(c) }));
  return [{ code: null, label: `${autoLabel} (${effective})`, flag: "🌐" }, ...rest];
}

/** Bottom-Sheet zur Markt-Wahl (gleiche Wirkung wie die Einstellung unter „Mehr"). */
export function MarketPickerSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useT();
  const override = useMarketOverride();
  const effective = useMarket();
  const { data: markets = [] } = useQuery({ ...marketsQuery, enabled: open });
  const current = override ?? null; // null = automatisch
  const options = toOptions(markets, FALLBACK_CODES, effective, t("more.marketAuto"));

  const pick = (code: string | null) => {
    setMarketOverride(code);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="max-h-[75vh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-2"
      >
        <SheetHeader>
          <SheetTitle className="text-base">{t("more.market")}</SheetTitle>
        </SheetHeader>
        <div className="mt-3 space-y-1" role="listbox" aria-label={t("more.market")}>
          {options.map((option) => {
            const selected = option.code === current;
            return (
              <button
                key={option.code ?? "auto"}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pick(option.code)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition",
                  selected ? "bg-primary-soft/60 font-semibold text-foreground" : "text-foreground active:bg-muted",
                )}
              >
                <span className="w-7 shrink-0 text-center text-lg" aria-hidden="true">{option.flag}</span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
