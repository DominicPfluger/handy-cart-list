import { createFileRoute } from "@tanstack/react-router";
import { LeafIcon } from "../components/icons";
import { useState } from "react";
import { useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { RecipeBuilder } from "../components/recipe-builder";
import { catalogQueryOptions } from "../lib/catalog-query";

export const Route = createFileRoute("/rezepte")({
  head: () => ({
    meta: [
      { title: "Shoppi — Rezept-Kreator" },
      { name: "description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Rezept-Kreator" },
      { property: "og:description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
  component: RecipesPage,
});

const RECIPES = [
  { id: 1, time: 20, servings: 4, emoji: "🍝", color: "oklch(0.92 0.06 75)" },
  { id: 2, time: 15, servings: 2, emoji: "🥗", color: "oklch(0.92 0.06 144)" },
  { id: 3, time: 25, servings: 4, emoji: "🥞", color: "oklch(0.92 0.04 75)" },
  { id: 4, time: 35, servings: 4, emoji: "🧀", color: "oklch(0.92 0.06 20)" },
  { id: 5, time: 30, servings: 4, emoji: "🍛", color: "oklch(0.92 0.06 50)" },
  { id: 6, time: 10, servings: 2, emoji: "🍓", color: "oklch(0.92 0.08 0)" },
];

function RecipesPage() {
  const { t } = useT();
  const [inTemplate, setInTemplate] = useState(false);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("nav.recipes")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("rec.subtitle")}
        </p>
      </div>

      <RecipeBuilder onTemplateChange={(id) => setInTemplate(!!id)} />

      {!inTemplate && (<>

      {/* Saisonal banner */}
      <div className="flex items-center gap-3 rounded-2xl bg-primary-soft/40 p-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft">
          <LeafIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{t("rec.season")}</p>
          <p className="text-xs text-muted-foreground">{t("rec.seasonSub")}</p>
        </div>
      </div>

      <div className="space-y-3">
        {RECIPES.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.99]"
          >
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-3xl"
              style={{ background: r.color }}
            >
              {r.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-soft/60 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {t(`rec.b${r.id}` as MessageKey)}
                </span>
              </div>
              <h3 className="mt-1 truncate text-sm font-semibold text-foreground">{t(`rec.r${r.id}` as MessageKey)}</h3>
              <p className="text-xs text-muted-foreground">⏱ {r.time} min · 🍽 {t("rec.servings", { n: r.servings })}</p>
            </div>
            <button className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition active:scale-95">
              {t("rec.ingredients")}
            </button>
          </div>
        ))}
      </div>
      </>)}
    </div>
  );
}
