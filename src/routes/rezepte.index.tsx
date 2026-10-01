import { createFileRoute, Link } from "@tanstack/react-router";
import { getLocale, useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { catalogQueryOptions } from "../lib/catalog-query";
import { RecipeBuilder } from "../components/recipe-builder";

export const Route = createFileRoute("/rezepte/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Rezepte" },
      { name: "description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Rezepte" },
      { property: "og:description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions(getLocale())),
  component: RecipesPage,
});

type RecipeEntry = { id: string; to: "/rezepte/generator" | "/rezepte/inspirationen" | "/rezepte/listen"; icon: string; bg: string; titleKey: MessageKey; descKey: MessageKey };

const RECIPE_ENTRIES: RecipeEntry[] = [
  { id: "rk-lists", to: "/rezepte/listen", icon: "📁", bg: "#E3EEF9", titleKey: "rec.entryListsTitle", descKey: "rec.entryListsDesc" },
  { id: "rk-inspiration", to: "/rezepte/inspirationen", icon: "✨", bg: "#FFF3D6", titleKey: "rec.entryInspTitle", descKey: "rec.entryInspDesc" },
];

function RecipesPage() {
  const { t } = useT();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("nav.recipes")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("rec.subtitle")}
        </p>
      </div>

      <RecipeBuilder mode="generator" />

      <div className="space-y-3">
        {RECIPE_ENTRIES.map((e) => (
          <Link
            key={e.id}
            to={e.to}
            className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition active:scale-[0.98]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: e.bg }} aria-hidden="true">
              {e.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">{t(e.titleKey)}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t(e.descKey)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
