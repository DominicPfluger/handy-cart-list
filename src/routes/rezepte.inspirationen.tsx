import { createFileRoute, Link } from "@tanstack/react-router";
import { getLocale, useT } from "../i18n";
import { RecipeBuilder } from "../components/recipe-builder";
import { RecipeFeed } from "../components/recipe-feed";
import { catalogQueryOptions } from "../lib/catalog-query";

export const Route = createFileRoute("/rezepte/inspirationen")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Rezept-Inspirationen" },
      { name: "description", content: "Beliebte und hoch bewertete Rezepte aus der Community." },
      { property: "og:title", content: "Shoppi — Rezept-Inspirationen" },
      { property: "og:description", content: "Beliebte und hoch bewertete Rezepte aus der Community." },
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
      <RecipeFeed />
      <RecipeBuilder mode="inspiration" />
    </div>
  );
}
