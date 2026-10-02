import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useT } from "../i18n";
import { RECIPE_TRAITS, TRAIT_GROUPS, type TraitGroup } from "../lib/recipe-traits";
import { fetchTraitRecipes } from "../lib/recipes-api";
import { useRecipeTemplates, templateLabel } from "../lib/use-recipe-templates";
import { ListCardBody, LIST_CARD_CLASS } from "../components/recipe-feed";

export const Route = createFileRoute("/rezepte/suchen")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Rezepte suchen" },
      { name: "description", content: "Rezepte nach Sättigung, Schärfe und Preisklasse finden." },
      { property: "og:title", content: "Shoppi — Rezepte suchen" },
      { property: "og:description", content: "Rezepte nach Sättigung, Schärfe und Preisklasse finden." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecipeSearchPage,
});

type Filters = Record<TraitGroup, string | null>;

const EMPTY_FILTERS: Filters = { satiety: null, spiciness: null, price_class: null };

function RecipeSearchPage() {
  const { t } = useT();
  const templates = useRecipeTemplates();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const { data, isLoading } = useQuery({
    queryKey: ["recipe-trait-search"],
    queryFn: fetchTraitRecipes,
    staleTime: 60_000,
  });

  const all = data ?? [];
  const active = TRAIT_GROUPS.some((g) => filters[g]);
  const results = active
    ? all.filter((r) => TRAIT_GROUPS.every((g) => !filters[g] || r[g] === filters[g]))
    : all;

  const setFilter = (g: TraitGroup, v: string | null) =>
    setFilters((prev) => ({ ...prev, [g]: prev[g] === v ? null : v }));

  return (
    <div className="space-y-5">
      <div>
        <Link to="/rezepte" search={{ cat: undefined, recipe: undefined }} className="text-sm font-medium text-primary">
          ← {t("nav.recipes")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t("rec.searchTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("rec.searchIntro")}</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {TRAIT_GROUPS.map((g) => (
          <div key={g} role="radiogroup" aria-label={t(`rk.${g}` as Parameters<typeof t>[0])} className="space-y-1.5">
            <p className="text-xs font-bold text-foreground">{RECIPE_TRAITS[g].emoji} {t(`rk.${g}` as Parameters<typeof t>[0])}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button" role="radio" aria-checked={!filters[g]}
                onClick={() => setFilters((prev) => ({ ...prev, [g]: null }))}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${!filters[g] ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
              >
                {t("rec.searchAll")}
              </button>
              {RECIPE_TRAITS[g].values.map((v) => (
                <button
                  key={v} type="button" role="radio" aria-checked={filters[g] === v}
                  onClick={() => setFilter(g, v)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filters[g] === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}
                >
                  {t(`rk.${g}.${v}` as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
          </div>
        ))}
        {active ? (
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-sm font-semibold text-primary">
            {t("rec.searchClear")}
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2" role="status" aria-label={t("rs.loading")}>
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
          <div className="h-16 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("rec.searchEmpty")}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{t("rec.searchCount", { n: results.length })}</p>
          {results.map((r) => {
            const tpl = templates.find((x) => x.id === r.template_id);
            const traits = TRAIT_GROUPS
              .filter((g) => r[g])
              .map((g) => `${RECIPE_TRAITS[g].emoji} ${t(`rk.${g}.${r[g]}` as Parameters<typeof t>[0])}`)
              .join(" · ");
            return (
              <Link key={r.id} to="/rezept/$slug" params={{ slug: r.share_slug }} className={LIST_CARD_CLASS}>
                <ListCardBody
                  photo={r.image_path} image={tpl?.image} emoji={tpl?.emoji} color={tpl?.color}
                  kicker={tpl ? templateLabel(tpl, t) : undefined}
                  title={r.title} sub={r.description} badge={traits || undefined}
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
