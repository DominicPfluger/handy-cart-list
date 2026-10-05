import { createFileRoute, Link } from "@tanstack/react-router";
import { getLocale, useT } from "../i18n";
import { RecipeBuilder } from "../components/recipe-builder";
import { ensureCatalog, catalogQueryOptions } from "../lib/catalog-query";

export const Route = createFileRoute("/rezepte/listen")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Rezept-Listen" },
      { name: "description", content: "Deine eigenen und übernommenen Rezepte, übersichtlich sortiert." },
      { property: "og:title", content: "Shoppi — Rezept-Listen" },
      { property: "og:description", content: "Deine eigenen und übernommenen Rezepte, übersichtlich sortiert." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => ensureCatalog(context.queryClient, getLocale()),
  component: Page,
});

function Page() {
  const { t } = useT();
  return (
    <div className="space-y-5">
      <div>
        <Link to="/rezepte" className="text-xs font-semibold text-primary">← {t("nav.recipes")}</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t("rec.entryListsTitle")}</h1>
      </div>
      <RecipeBuilder mode="lists" />
    </div>
  );
}
