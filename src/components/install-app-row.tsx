import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useT } from "../i18n";

type InstallPromptEvent = Event & { prompt: () => Promise<unknown> };

/** Zeile «App installieren» in den Einstellungen; zeigt den Browser-Installationsdialog. */
export function InstallAppRow() {
  const { t } = useT();
  const [evt, setEvt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!evt) {
      toast.info(t("install.manualHint"));
      return;
    }
    await evt.prompt();
    setEvt(null);
  };

  return (
    <button type="button" onClick={() => void install()} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
        <span className="text-lg" aria-hidden="true">📲</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{t("install.title")}</p>
        <p className="truncate text-xs text-muted-foreground">{t("install.desc")}</p>
      </div>
      <span className="text-muted-foreground">›</span>
    </button>
  );
}
