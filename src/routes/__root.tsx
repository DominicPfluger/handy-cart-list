import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import {
  ListIcon,
  ListIconFilled,
  RecipeIcon,
  OffersIcon,
  MoreIcon,
  ShoppiLogo,
} from "../components/icons";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Seite nicht gefunden</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Zurück zur Liste
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Etwas ist schiefgelaufen
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Erneut versuchen
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
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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
      <body className="bg-[oklch(0.88_0.01_90)]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Liste", Icon: ListIcon, ActiveIcon: ListIconFilled },
  { to: "/rezepte", label: "Rezepte", Icon: RecipeIcon, ActiveIcon: RecipeIcon },
  { to: "/angebote", label: "Angebote", Icon: OffersIcon, ActiveIcon: OffersIcon },
  { to: "/mehr", label: "Mehr", Icon: MoreIcon, ActiveIcon: MoreIcon },
] as const;

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="tab-active-indicator flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition active:scale-95"
            activeProps={{ className: "text-primary" }}
            activeOptions={{ exact: item.to === "/" }}
          >
            {({ isActive }) => (
              <>
                <item.Icon className="h-6 w-6" />
                <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                  {item.label}
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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative mx-auto min-h-screen w-full max-w-[440px] bg-background shadow-xl">
        {/* App header with logo */}
        <header className="sticky top-0 z-40 flex items-center justify-between bg-background/90 px-5 py-3 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2">
            <ShoppiLogo className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">Shoppi</span>
          </Link>
          <div className="flex items-center -space-x-2">
            {["D", "J", "M", "P"].map((initial, i) => (
              <div
                key={i}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-background text-[11px] font-semibold text-card"
                style={{
                  background: ["oklch(0.52 0.155 144)", "oklch(0.75 0.16 47)", "oklch(0.62 0.18 280)", "oklch(0.55 0.13 210)"][i],
                }}
              >
                {initial}
              </div>
            ))}
          </div>
        </header>

        <main className="px-5 pb-28 pt-2">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </QueryClientProvider>
  );
}
