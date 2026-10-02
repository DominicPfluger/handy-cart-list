import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { getLocale, useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { RecipeBuilder } from "../components/recipe-builder";
import { useRecipeTemplates, templateLabel } from "../lib/use-recipe-templates";
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
  const templates = useRecipeTemplates();
  const { recipe, cat } = Route.useSearch();
  const initialTpl = cat ? templates.find((x) => x.id === cat)?.id : undefined;
  const [tplId, setTplId] = useState<string | null>(null);
  const shownTpl = tplId ?? initialTpl ?? null;
  const shownTemplate = shownTpl ? templates.find((x) => x.id === shownTpl) : undefined;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          {shownTemplate ? templateLabel(shownTemplate, t) : t("rec.entryGenTitle")}
          {shownTemplate?.image ? (
            <img src={shownTemplate.image} alt="" className="h-9 w-9 rounded-xl object-cover" style={{ background: shownTemplate.color }} />
          ) : shownTemplate ? (
            <span aria-hidden="true">{shownTemplate.emoji}</span>
          ) : null}
        </h1>
      </div>
      <RecipeBuilder mode="generator" onTemplateChange={setTplId} loadRecipeId={recipe} initialTemplateId={initialTpl} />
    </div>
  );
}

