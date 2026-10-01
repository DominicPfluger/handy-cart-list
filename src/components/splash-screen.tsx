import appIcon from "@/assets/app-icon.png.asset.json";

/** Branded start screen with loading bar, shown while the app loads. */
export function SplashScreen() {
  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-8"
      role="status"
      aria-busy="true"
      aria-label="Shoppi lädt …"
    >
      <div className="flex flex-col items-center gap-3">
        <img
          src={appIcon.url}
          alt="Shoppi"
          className="h-24 w-24 rounded-3xl shadow-lg shadow-primary/30"
        />
        <div className="text-center">
          <p className="text-2xl font-bold tracking-tight text-foreground">Shoppi</p>
          <p className="text-sm text-muted-foreground">Einfach.Gemeinsam.Einkaufen.</p>
        </div>
      </div>
      <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-[splash-load_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <span className="sr-only">Lädt …</span>
    </div>
  );
}
