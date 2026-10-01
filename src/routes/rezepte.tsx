import { createFileRoute, Link } from "@tanstack/react-router";
import { getLocale, useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { RecipeBuilder } from "../components/recipe-builder";
import { RecipeFeed } from "../components/recipe-feed";
import { catalogQueryOptions } from "../lib/catalog-query";

export const Route = createFileRoute("/rezepte")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Rezept-Generator" },
      { name: "description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Rezept-Generator" },
      { property: "og:description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions(getLocale())),
  component: RecipesPage,
});

type RecipeEntry = { id: string; icon: string; bg: string; titleKey: MessageKey; descKey: MessageKey };

const RECIPE_ENTRIES: RecipeEntry[] = [
  { id: "rk-generator", icon: "🧑‍🍳", bg: "#E3F0E4", titleKey: "rec.entryGenTitle", descKey: "rec.entryGenDesc" },
  { id: "rk-inspiration", icon: "✨", bg: "#FFF3D6", titleKey: "rec.entryInspTitle", descKey: "rec.entryInspDesc" },
  { id: "rk-lists", icon: "📁", bg: "#E3EEF9", titleKey: "rec.entryListsTitle", descKey: "rec.entryListsDesc" },
];

function RecipesPage() {
  const { t } = useT();

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("rk-entry-flash");
    void (el as HTMLElement).offsetWidth; // Animation neu starten
    el.classList.add("rk-entry-flash");
    window.setTimeout(() => el.classList.remove("rk-entry-flash"), 1700);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("recipes.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("rec.subtitle")}
        </p>
      </div>

      <div className="space-y-3">
        {RECIPE_ENTRIES.map((e) => (
          <button
            key={e.id}
            onClick={() => jump(e.id)}
            className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition active:scale-[0.98]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: e.bg }} aria-hidden="true">
              {e.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">{t(e.titleKey)}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t(e.descKey)}</span>
            </span>
          </button>
        ))}
        <Link to="/community" className="flex w-full items-center gap-3 rounded-2xl border border-primary bg-card p-4 text-left transition active:scale-[0.98]">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: "#FCE4EC" }} aria-hidden="true">🌍</span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">{t("cm.title")}</span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t("cm.subtitle")}</span>
          </span>
        </Link>
      </div>

      <RecipeBuilder />
      <RecipeFeed />
    </div>
  );
}
