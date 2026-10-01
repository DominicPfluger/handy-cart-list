import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useT } from "../i18n";
import { RECIPE_TEMPLATES } from "../lib/recipe-templates";
import { RecipePhoto } from "./recipe-photo";
import { fetchFeed, type FeedOrder, type FeedRecipe } from "../lib/recipes-api";
import { useShoppingList } from "../hooks/use-shopping-list";
import type { MessageKey } from "../i18n/de";

export function SectionTitle({ emoji, bg, children }: { emoji: string; bg: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-base font-bold text-foreground">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-lg" style={{ background: bg }} aria-hidden="true">
        {emoji}
      </span>
      {children}
    </h2>
  );
}

/** Einheitliche Rezept-Karte (untereinander) für alle Inspirationen-Bereiche. */
export function ListCardBody({ photo, emoji, color, kicker, title, sub, badge }: {
  photo?: string | null | undefined; emoji?: string | undefined; color?: string | undefined; kicker?: string | undefined; title: string; sub?: string | null | undefined; badge?: string | undefined;
}) {
  return (
    <>
      <RecipePhoto path={photo ?? null} emoji={emoji} color={color} className="h-16 w-16 shrink-0 rounded-xl" />
      <span className="min-w-0 flex-1 text-left">
        {kicker ? <span className="block text-xs text-primary">{kicker}</span> : null}
        <span className="line-clamp-2 block text-sm font-semibold text-foreground">{title}</span>
        {sub ? <span className="line-clamp-1 block text-xs text-muted-foreground">{sub}</span> : null}
        {badge ? <span className="block text-xs text-muted-foreground">{badge}</span> : null}
      </span>
    </>
  );
}
export const LIST_CARD_CLASS = "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 transition active:scale-[0.99]";

function Card({ r, badge }: { r: FeedRecipe; badge: string }) {
  const tpl = RECIPE_TEMPLATES.find((x) => x.id === r.template_id);
  return (
    <Link to="/rezept/$slug" params={{ slug: r.share_slug ?? "" }} className={LIST_CARD_CLASS}>
      <ListCardBody photo={r.image_path} emoji={tpl?.emoji} color={tpl?.color} title={r.title} sub={r.description} badge={badge} />
    </Link>
  );
}

export function ShowMoreToggle({ total, all, onToggle }: { total: number; all: boolean; onToggle: () => void }) {
  const { t } = useT();
  if (total <= 5) return null;
  return (
    <button onClick={onToggle} className="w-full py-1 text-sm font-semibold text-primary">
      {all ? t("rk.showLess") : t("rs.showAll", { n: total })}
    </button>
  );
}

function Row({ title, emoji, bg, order, ids, empty }: { title: string; emoji: string; bg: string; order: FeedOrder; ids?: string[]; empty: string }) {
  const { t } = useT();
  const { data, isLoading } = useQuery({
    queryKey: ["recipe-feed", order, ids?.slice().sort().join(",") ?? ""],
    queryFn: () => fetchFeed(order, ids),
    staleTime: 60_000,
  });
  const list = (data ?? []).filter((r) => r.share_slug);
  const [all, setAll] = useState(false);
  return (
    <section className="space-y-2">
      <SectionTitle emoji={emoji} bg={bg}>{title}</SectionTitle>
      {isLoading ? (
        <div className="h-28 animate-pulse rounded-2xl bg-muted" role="status" aria-label={t("rs.loading")} />
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-2">
          {(all ? list : list.slice(0, 5)).map((r) => (
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
      <ShowMoreToggle total={list.length} all={all} onToggle={() => setAll((v) => !v)} />
    </section>
  );
}

export function FavoritesRow() {
  const { t } = useT();
  const { favorites } = useShoppingList();
  const favIds = favorites.map((f) => f.productId);
  return (
    <Row
      title={t("rs.withFavorites")}
      emoji="♥"
      bg="#FBE7EA"
      order="favorites"
      ids={favIds}
      empty={favIds.length ? t("rs.emptyFeed") : t("rs.noFavorites")}
    />
  );
}

export function RecipeFeed() {
  const { t } = useT();
  return (
    <div className="space-y-5" id="rk-inspiration">
      <Row title={t("rs.topRated")} emoji="⭐" bg="#FFF3D6" order="rating" empty={t("rs.emptyFeed")} />
      <Row title={t("rs.mostSaved")} emoji="📁" bg="#E3EEF9" order="saves" empty={t("rs.emptyFeed")} />
    </div>
  );
}

export const templateLabelKey = (id: string) => `rk.cat.${id}` as MessageKey;
