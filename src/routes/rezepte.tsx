import { createFileRoute } from "@tanstack/react-router";
import { getLocale, useT } from "../i18n";
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

function RecipesPage() {
  const { t } = useT();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("recipes.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("rec.subtitle")}
        </p>
      </div>

      <RecipeFeed />
      <RecipeBuilder />
    </div>
  );
}
