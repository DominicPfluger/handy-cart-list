import { createFileRoute, Link } from "@tanstack/react-router";
import { getLocale, useT } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { ensureCatalog, catalogQueryOptions } from "../lib/catalog-query";
import { useRecipeTemplates, templateLabel } from "../lib/use-recipe-templates";
import imgGenerator from "../assets/recipes/generator.png";
import imgSearch from "../assets/recipes/search.png";
import imgLists from "../assets/recipes/lists.png";
import imgInspiration from "../assets/recipes/inspiration.png";

export const Route = createFileRoute("/rezepte/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Rezepte" },
      { name: "description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:title", content: "Shoppi — Rezepte" },
      { property: "og:description", content: "Rezepte entdecken und Zutaten direkt zur Einkaufsliste hinzufügen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => ensureCatalog(context.queryClient, getLocale()),
  component: RecipesPage,
});

type RecipeEntry = { id: string; to: "/rezepte/generator" | "/rezepte/inspirationen" | "/rezepte/listen" | "/rezepte/suchen"; icon: string; image?: string; bg: string; titleKey: MessageKey; descKey: MessageKey };

const RECIPE_ENTRIES: RecipeEntry[] = [
  { id: "rk-inspiration", to: "/rezepte/inspirationen", icon: "✨", image: imgInspiration, bg: "#FFF3D6", titleKey: "rec.entryInspTitle", descKey: "rec.entryInspDesc" },
  { id: "rk-search", to: "/rezepte/suchen", icon: "🔍", image: imgSearch, bg: "#F0E7F7", titleKey: "rec.entrySearchTitle", descKey: "rec.entrySearchDesc" },
  { id: "rk-lists", to: "/rezepte/listen", icon: "📁", image: imgLists, bg: "#E3EEF9", titleKey: "rec.entryListsTitle", descKey: "rec.entryListsDesc" },
];

const GENERATOR_ENTRY: RecipeEntry = { id: "rk-generator", to: "/rezepte/generator", icon: "🧑‍🍳", image: imgGenerator, bg: "#E4F3E6", titleKey: "rec.entryGenTitle", descKey: "rec.entryGenDesc" };

function RecipesPage() {
  const { t } = useT();
  const templates = useRecipeTemplates();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("nav.recipes")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("rec.subtitle")}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <Link
          to={GENERATOR_ENTRY.to}
          search={{ cat: undefined, recipe: undefined }}
          className="flex w-full items-start gap-3 text-left transition active:scale-[0.98]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: GENERATOR_ENTRY.bg }} aria-hidden="true">
            {GENERATOR_ENTRY.image ? <img src={GENERATOR_ENTRY.image} alt="" width={48} height={48} className="h-10 w-10 object-contain" /> : GENERATOR_ENTRY.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">{t(GENERATOR_ENTRY.titleKey)}</span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t(GENERATOR_ENTRY.descKey)}</span>
          </span>
        </Link>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {templates.map((x) => (
            <Link
              key={x.id}
              to="/rezepte/generator"
              search={{ cat: x.id, recipe: undefined }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-background p-4 text-center transition active:scale-[0.96]"
            >
              <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl text-4xl" style={{ background: x.color }} aria-hidden="true">
                {x.image ? <img src={x.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : x.emoji}
              </span>
              <span className="text-[13px] font-semibold leading-tight text-foreground">{templateLabel(x, t)}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {RECIPE_ENTRIES.map((e) => (
          <Link
            key={e.id}
            to={e.to}
            className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition active:scale-[0.98]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: e.bg }} aria-hidden="true">
              {e.image ? <img src={e.image} alt="" loading="lazy" width={48} height={48} className="h-10 w-10 object-contain" /> : e.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">{t(e.titleKey)}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{t(e.descKey)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
