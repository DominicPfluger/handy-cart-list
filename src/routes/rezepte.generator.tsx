import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
    recipe: z.string().optional().catch(undefined).parse(s["recipe"]),
    cat: z.string().optional().catch(undefined).parse(s["cat"]),
  }),
  beforeLoad: ({ search }) => {
    const s = search as { recipe?: string; cat?: string };
    if (!s.cat && !s.recipe) throw redirect({ to: "/rezepte" });
  },
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
  const { recipe, cat } = Route.useSearch();
  const initialTpl = cat ? RECIPE_TEMPLATES.find((x) => x.id === cat)?.id : undefined;
  const [tplId, setTplId] = useState<string | null>(null);
  const shownTpl = tplId ?? initialTpl ?? null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {shownTpl
            ? `${RECIPE_TEMPLATES.find((x) => x.id === shownTpl)?.emoji ?? ""} ${t(`rk.cat.${shownTpl}` as MessageKey)}`.trim()
            : t("rec.entryGenTitle")}
        </h1>
      </div>
      <RecipeBuilder mode="generator" onTemplateChange={setTplId} loadRecipeId={recipe} initialTemplateId={initialTpl} />
    </div>
  );
}

