import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { usePurchaseHistory } from "../hooks/use-purchase-history";
import { useT, getLocale } from "../i18n";
import { ProductEmoji } from "../components/product-emoji";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export const Route = createFileRoute("/verlauf")({
  head: () => ({
    meta: [
      { title: "Shoppi — Einkaufsverlauf" },
      { name: "description", content: "Was gekauft wurde und wie oft – dein Einkaufsverlauf mit Statistiken." },
      { property: "og:title", content: "Shoppi — Einkaufsverlauf" },
      { property: "og:description", content: "Was gekauft wurde und wie oft." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { t } = useT();
  const { history, hydrated, clearHistory, stats } = usePurchaseHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const locale = getLocale();
  const fmt = (at: number) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(at);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("hist.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("hist.subtitle")}</p>
      </div>

      {hydrated && history.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-5xl">🧾</div>
          <p className="mt-4 text-sm text-muted-foreground">{t("hist.empty")}</p>
        </div>
      )}

      {history.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.purchases}</p>
              <p className="text-xs text-muted-foreground">{t("hist.purchases")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.itemCount}</p>
              <p className="text-xs text-muted-foreground">{t("hist.itemsTotal")}</p>
            </div>
          </div>

          {stats.top.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-base font-semibold text-foreground">{t("hist.topProducts")}</h2>
              <div className="space-y-2">
                {stats.top.slice(0, 10).map((p) => (
                  <div key={p.productId ?? p.name} className="flex items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft/25">
                      <ProductEmoji emoji={p.emoji} className="text-base" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{p.name}</span>
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">{t("hist.times", { n: p.count })}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">{t("hist.recent")}</h2>
            {history.slice(0, 30).map((rec) => (
              <div key={rec.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{rec.listName}</p>
                  <p className="shrink-0 text-xs text-muted-foreground">{fmt(rec.at)}</p>
                </div>
                <p className="break-words text-xs text-muted-foreground">
                  {rec.items.map((i) => i.name).join(", ")}
                </p>
              </div>
            ))}
          </section>

          <Button variant="outline" className="w-full rounded-xl" onClick={() => setConfirmClear(true)}>
            {t("hist.clear")}
          </Button>

          <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("hist.clear")}</AlertDialogTitle>
                <AlertDialogDescription>{t("hist.clearConfirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearHistory();
                    setConfirmClear(false);
                  }}
                >
                  {t("hist.clear")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
