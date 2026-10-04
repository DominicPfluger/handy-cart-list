import { useState } from "react";
import { UpdateIcon } from "@radix-ui/react-icons";
import { useI18n } from "../i18n";

/**
 * „App aktualisieren“-Zeile für die Einstellungen:
 * löscht alle gecachten Dateien/Bilder und den Service Worker,
 * lädt die App anschliessend frisch vom Server.
 */
export function AppUpdateRow() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  const updateApp = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch {
      // trotzdem neu laden
    }
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={updateApp}
      disabled={busy}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted disabled:opacity-60"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
        <UpdateIcon className={`h-5 w-5 ${busy ? "animate-spin" : ""}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{t("more.appUpdate")}</p>
        <p className="truncate text-xs text-muted-foreground">
          {busy ? t("more.appUpdating") : t("more.appUpdateSub")}
        </p>
      </div>
      <span className="text-muted-foreground">›</span>
    </button>
  );
}
