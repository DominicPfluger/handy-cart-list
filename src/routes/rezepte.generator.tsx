import { createFileRoute, Link } from "@tanstack/react-router";
import { getLocale, useT } from "../i18n";
import { RecipeBuilder } from "../components/recipe-builder";
import { catalogQueryOptions } from "../lib/catalog-query";

export const Route = createFileRoute("/rezepte/generator")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Rezept-Generator" },
      { name: "description", content: "Stelle dein Rezept intuitiv aus deinen Lieblingszutaten zusammen." },
      { property: "og:title", content: "Shoppi — Rezept-Generator" },
      { property: "og:description", content: "Stelle dein Rezept intuitiv aus deinen Lieblingszutaten zusammen." },
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
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t("rec.entryGenTitle")}</h1>
      </div>
      <RecipeBuilder mode="generator" />
    </div>
  );
}
