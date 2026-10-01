import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { getLocale, useT } from "../i18n";
import { RecipeBuilder } from "../components/recipe-builder";
import { RecipeFeed, FavoritesRow } from "../components/recipe-feed";
import { CommunitySection } from "../components/community-section";
import { catalogQueryOptions } from "../lib/catalog-query";

const searchSchema = z.object({
  tab: fallback(z.string(), "all").default("all"),
  author: fallback(z.string(), "").default(""),
  name: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/rezepte/inspirationen")({
  ssr: false,
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Shoppi — Rezept-Inspirationen" },
      { name: "description", content: "Beliebte und hoch bewertete Rezepte aus der Community — durchsuchen, filtern und eigene Rezepte teilen." },
      { property: "og:title", content: "Shoppi — Rezept-Inspirationen" },
      { property: "og:description", content: "Beliebte und hoch bewertete Rezepte aus der Community — durchsuchen, filtern und eigene Rezepte teilen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions(getLocale())),
  component: Page,
});

function Page() {
  const { t } = useT();
  return (
    <div className="space-y-5">
      <div>
        <Link to="/rezepte" className="text-xs font-semibold text-primary">← {t("nav.recipes")}</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t("rec.entryInspTitle")}</h1>
      </div>
      <FavoritesRow />
      <RecipeFeed />
      <RecipeBuilder mode="inspiration" />
      <div className="space-y-1 border-t border-border pt-5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">🌍 {t("cm.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("cm.subtitle")}</p>
      </div>
      <CommunitySection />
    </div>
  );
}
