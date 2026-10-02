import splashLogo from "@/assets/splash-logo.png.asset.json";
import { useT } from "../i18n";

/** Branded start screen with loading bar, shown while the app loads. */
export function SplashScreen() {
  const { t } = useT();
  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-8"
      role="status"
      aria-busy="true"
      aria-label={t("splash.loading")}
    >
      <div className="flex flex-col items-center gap-3">
        <img
          src={splashLogo.url}
          alt="Shoppi"
          className="h-24 w-24 rounded-3xl shadow-lg shadow-primary/30"
        />
        <div className="text-center">
          <p className="text-2xl font-bold tracking-tight text-foreground">Shoppi</p>
          <p className="text-sm font-semibold text-foreground">{t("splash.slogan")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("splash.subtitle")}</p>
        </div>
      </div>
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-[splash-load_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <span className="sr-only">{t("splash.loading")}</span>
    </div>
  );
}
