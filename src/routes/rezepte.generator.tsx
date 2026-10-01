import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { getLocale, useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { RecipeBuilder } from "../components/recipe-builder";
import { RECIPE_TEMPLATES } from "../lib/recipe-templates";
import { catalogQueryOptions } from "../lib/catalog-query";

export const Route = createFileRoute("/rezepte/generator")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    recipe: z.string().optional().catch(undefined).parse(s.recipe),
  }),
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
  const { recipe } = Route.useSearch();
  const [tplId, setTplId] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <div>
        <Link to="/rezepte" className="text-xs font-semibold text-primary">← {t("nav.recipes")}</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {tplId
            ? `${RECIPE_TEMPLATES.find((x) => x.id === tplId)?.emoji ?? ""} ${t(`rk.cat.${tplId}` as MessageKey)}`.trim()
            : t("rec.entryGenTitle")}
        </h1>
      </div>
      <RecipeBuilder mode="generator" onTemplateChange={setTplId} loadRecipeId={recipe} />
    </div>
  );
}

