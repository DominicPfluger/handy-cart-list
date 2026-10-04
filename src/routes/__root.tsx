import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { initLocale, useT } from "../i18n";
import { initFontSize } from "../hooks/use-font-size";
import { loadUnits, useUnitsVersion } from "../lib/units";
import type { MessageKey } from "../i18n/de";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { ShareSheet } from "@/components/share-sheet";
import {
  ListIcon,
  ListIconFilled,
  RecipeIcon,
  MoreIcon,
  DepartmentIcon,
  HeartIcon,
} from "../components/icons";

function NotFoundComponent() {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("common.notFound")}</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("common.backToList")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const { t } = useT();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("common.error")}
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("common.retry")}
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#2E7D32" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV_ITEMS = [
  { to: "/abteilungen", label: "nav.departments", Icon: DepartmentIcon, ActiveIcon: DepartmentIcon },
  { to: "/favoriten", label: "nav.favorites", Icon: HeartIcon, ActiveIcon: HeartIcon },
  { to: "/", label: "nav.lists", Icon: ListIcon, ActiveIcon: ListIconFilled },
  { to: "/rezepte", label: "nav.recipes", Icon: RecipeIcon, ActiveIcon: RecipeIcon },
  { to: "/mehr", label: "nav.more", Icon: MoreIcon, ActiveIcon: MoreIcon },
] as const;

function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { t } = useT();
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onTiles = (e: Event) => setHidden((e as CustomEvent<boolean>).detail === true);
    window.addEventListener("shoppi:admin-tiles", onTiles);
    return () => window.removeEventListener("shoppi:admin-tiles", onTiles);
  }, []);

  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition active:scale-95"
            activeProps={{ className: "text-primary" }}
            activeOptions={{ exact: item.to === "/" }}
            onClick={() => {
              if (item.to === "/abteilungen" && pathname === "/abteilungen") {
                window.dispatchEvent(new Event("shoppi:abteilungen-reset"));
              }
            }}
          >
            {({ isActive }) => (
              <>
                {isActive ? <item.ActiveIcon className="h-6 w-6" /> : <item.Icon className="h-6 w-6" />}
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                  {t(item.label as MessageKey)}
                </span>
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => { initLocale(); initFontSize(); void loadUnits(); }, []);
  useUnitsVersion();
  // Offline-Fähigkeit: Service Worker im Browser registrieren
  useEffect(() => {
    import("virtual:pwa-register")
      .then(({ registerSW }) => registerSW({ immediate: true }))
      .catch(() => {});
  }, []);

  const isAdmin = useRouterState({ select: (s) => s.location.pathname.startsWith("/admin") });
  return (
    <QueryClientProvider client={queryClient}>
      <div className={`relative mx-auto min-h-screen w-full bg-background ${isAdmin ? "max-w-[440px] md:max-w-5xl xl:max-w-7xl md:px-4" : "max-w-[440px]"}`}>
        <main className="px-5 pb-36 pt-5">
          <Outlet />
          <Toaster position="top-center" />
          <ShareSheet />
        </main>

        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
