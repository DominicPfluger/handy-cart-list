import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useT } from "../i18n";
import { RECIPE_TEMPLATES } from "../lib/recipe-templates";
import { fetchFeed, type FeedOrder, type FeedRecipe } from "../lib/recipes-api";
import { useShoppingList } from "../hooks/use-shopping-list";
import type { MessageKey } from "../i18n/de";

function Card({ r, badge }: { r: FeedRecipe; badge: string }) {
  const tpl = RECIPE_TEMPLATES.find((x) => x.id === r.template_id);
  return (
    <Link
      to="/rezept/$slug"
      params={{ slug: r.share_slug ?? "" }}
      className="flex w-44 shrink-0 snap-start flex-col gap-2 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.98]"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl text-xl" style={{ background: tpl?.color }}>{tpl?.emoji ?? "🍽️"}</span>
      <span className="line-clamp-2 text-sm font-semibold text-foreground">{r.title}</span>
      <span className="mt-auto text-xs text-muted-foreground">{badge}</span>
    </Link>
  );
}

function Row({ title, order, ids, empty }: { title: string; order: FeedOrder; ids?: string[]; empty: string }) {
  const { t } = useT();
  const { data, isLoading } = useQuery({
    queryKey: ["recipe-feed", order, ids?.slice().sort().join(",") ?? ""],
    queryFn: () => fetchFeed(order, ids),
    staleTime: 60_000,
  });
  const list = (data ?? []).filter((r) => r.share_slug);
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {isLoading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-muted" role="status" aria-label={t("rs.loading")} />
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {list.map((r) => (
            <Card
              key={r.id}
              r={r}
              badge={
                order === "saves" ? t("rs.savesN", { n: r.save_count })
                : order === "favorites" ? t("rs.favMatchN", { n: r.match_count })
                : r.rating_count ? `★ ${r.avg_rating.toFixed(1)} (${r.rating_count})` : t("rs.noRatings")
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function RecipeFeed() {
  const { t } = useT();
  const { favorites } = useShoppingList();
  const favIds = favorites.map((f) => f.productId);
  return (
    <div className="space-y-5">
      <Row title={`★ ${t("rs.topRated")}`} order="rating" empty={t("rs.emptyFeed")} />
      <Row title={`📁 ${t("rs.mostSaved")}`} order="saves" empty={t("rs.emptyFeed")} />
      <Row
        title={`♥ ${t("rs.withFavorites")}`}
        order="favorites"
        ids={favIds}
        empty={favIds.length ? t("rs.emptyFeed") : t("rs.noFavorites")}
      />
    </div>
  );
}

export const templateLabelKey = (id: string) => `rk.cat.${id}` as MessageKey;
