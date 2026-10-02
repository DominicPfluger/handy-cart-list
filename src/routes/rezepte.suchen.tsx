import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "../i18n";

export const Route = createFileRoute("/rezepte/suchen")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Rezepte suchen" },
      { name: "description", content: "Rezepte nach spezifischen Kriterien suchen." },
      { property: "og:title", content: "Shoppi — Rezepte suchen" },
      { property: "og:description", content: "Rezepte nach spezifischen Kriterien suchen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecipeSearchPage,
});

function RecipeSearchPage() {
  const { t } = useT();
  return (
    <div className="space-y-5">
      <div>
        <Link to="/rezepte" search={{ cat: undefined, recipe: undefined }} className="text-sm font-medium text-primary">
          ← {t("nav.recipes")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{t("rec.searchTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("rec.searchSoon")}</p>
      </div>
    </div>
  );
}
