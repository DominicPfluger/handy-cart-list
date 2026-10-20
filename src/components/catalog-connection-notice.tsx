import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, WifiOff } from "lucide-react";
import { useT } from "@/i18n";
import { useCatalogUnavailable } from "@/lib/catalog-availability";
import { catalogQueryOptions } from "@/lib/catalog-query";
import { Button } from "@/components/ui/button";

export function CatalogConnectionNotice() {
  const { t, locale } = useT();
  const unavailable = useCatalogUnavailable(locale);
  const queryClient = useQueryClient();
  const fetching = useIsFetching({ queryKey: ["catalog", "core", locale] }) > 0;
  if (!unavailable) return null;
  return (
    <section role="status" aria-live="polite" className="mb-4 border-b border-border pb-4 text-sm">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <WifiOff className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {t("offline.catalogUnavailable")}
      </div>
      <p className="mt-1 text-muted-foreground">{t("offline.localListsAvailable")}</p>
      <Button
        variant="outline" size="sm" className="mt-2" disabled={fetching}
        onClick={() => {
          void queryClient.fetchQuery({ ...catalogQueryOptions(locale), staleTime: 0 });
          void queryClient.invalidateQueries({ queryKey: ["catalog", "details", locale] });
          void queryClient.invalidateQueries({ queryKey: ["catalog-images"] });
        }}
      >
        <RefreshCw className={fetching ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />
        {t(fetching ? "offline.retrying" : "common.retry")}
      </Button>
    </section>
  );
}