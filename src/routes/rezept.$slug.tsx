import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useT, translate } from "../i18n";
import { getRecipeBySlug } from "../lib/recipes.functions";
import { RECIPE_TEMPLATES } from "../lib/recipe-templates";
import { useAuthUser } from "../hooks/use-auth-user";
import { useShoppingList } from "../hooks/use-shopping-list";
import { useRecipeCollections, saveToFolder, createCollection } from "../hooks/use-saved-recipes";
import { useIsAdmin } from "../hooks/use-is-admin";
import { useSpeakLocale } from "../hooks/use-speak-locale";
import { useSpeakRate } from "../hooks/use-speak-rate";
import { speakQuantity } from "../lib/speech-units";
import { speakSentences, missingVoice } from "../components/speak-list-button";
import {
  addComment, deleteComment, fetchComments, fetchFeed, myRating, rateRecipe, shareLink,
} from "../lib/recipes-api";
import { supabase } from "@/integrations/supabase/client";
import { RecipePhoto } from "../components/recipe-photo";

export const Route = createFileRoute("/rezept/$slug")({
  loader: async ({ params }) => {
    const r = await getRecipeBySlug({ data: { slug: params.slug } });
    if (!r) throw notFound();
    return r;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — Shoppi Rezept` : "Shoppi Rezept";
    const desc = loaderData
      ? (loaderData.description || `Zutaten: ${loaderData.items.map((i) => i.name).filter(Boolean).slice(0, 8).join(", ")}`)
      : "Geteiltes Rezept auf Shoppi";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="space-y-3 py-10 text-center">
      <p className="text-lg font-semibold text-foreground">Rezept nicht gefunden</p>
      <Link to="/rezepte" className="text-sm font-semibold text-primary">← Rezepte</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="py-10 text-center text-sm text-muted-foreground">Rezept konnte nicht geladen werden.</div>
  ),
  component: RecipePage,
});

function RecipePage() {
  const r = Route.useLoaderData();
  const { t } = useT();
  const qc = useQueryClient();
  const user = useAuthUser();
  const isAdmin = useIsAdmin();
  const collections = useRecipeCollections(user);
  const { addCatalogItem } = useShoppingList();
  const tpl = RECIPE_TEMPLATES.find((x) => x.id === r.templateId);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [added, setAdded] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakRate] = useSpeakRate();
  const [speakLocale] = useSpeakLocale();

  // Namen ggf. aus dem Katalog ergänzen (z. B. bei übernommenen Altrezepten)
  const { data: names } = useQuery({
    queryKey: ["recipe-names", r.id],
    enabled: r.items.some((i) => !i.name),
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, emoji").in("id", r.items.map((i) => i.productId));
      return new Map((data ?? []).map((p) => [p.id, p]));
    },
  });
  const items = r.items.map((i) => ({ ...i, name: i.name || names?.get(i.productId)?.name || "", emoji: i.emoji ?? names?.get(i.productId)?.emoji }));

  const stats = useQuery({
    queryKey: ["recipe-stats", r.id],
    queryFn: async () => {
      const list = await fetchFeed("rating", undefined, 50);
      return list.find((x) => x.id === r.id) ?? null;
    },
  });
  const comments = useQuery({ queryKey: ["recipe-comments", r.id], queryFn: () => fetchComments(r.id) });

  useEffect(() => {
    if (user) void myRating(r.id, user.id).then(setStars);
  }, [user?.id, r.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const toggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error(t("speak.unsupported"));
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    if (missingVoice(speakLocale)) toast.warning(translate(speakLocale, "speak.noVoice"));
    const sentences = [
      `${r.title}.`,
      ...(r.description ? [r.description] : []),
      translate(speakLocale, "rs.speakIngredients"),
      ...items.map((i) => {
        const qty = i.quantity
          ? (i.unit ? `${speakQuantity(i.quantity, i.unit ?? undefined, speakLocale)} ` : `${i.quantity} `)
          : "";
        return `${qty}${i.name}`.trim();
      }),
    ];
    speakSentences(sentences, speakLocale, speakRate, () => setSpeaking(false));
    setSpeaking(true);
  };

  const rate = async (n: number) => {
    if (!user) return;
    setStars(n);
    try { await rateRecipe(r.id, user.id, n); void qc.invalidateQueries({ queryKey: ["recipe-stats", r.id] }); void qc.invalidateQueries({ queryKey: ["recipe-feed"] }); }
    catch { toast.error(t("cloud.error")); }
  };

  const send = async () => {
    if (!user || !comment.trim()) return;
    try { await addComment(r.id, user.id, user.name, comment); setComment(""); void comments.refetch(); }
    catch { toast.error(t("cloud.error")); }
  };

  const addAll = () => {
    for (const i of items) {
      addCatalogItem({ productId: i.productId, name: i.name, quantity: i.quantity || "1", unit: i.unit ?? "stueck", organic: false, emoji: i.emoji ?? undefined });
    }
    setAdded(true);
  };

  const save = async (folderId: string | null) => {
    if (!user) return;
    try {
      const id = folderId ?? (await createCollection(user.id, t("rk.myRecipes")));
      await saveToFolder(user.id, r.id, id);
      setSaveOpen(false);
      toast.success(t("rk.saved"));
      void qc.invalidateQueries({ queryKey: ["recipe-feed"] });
    } catch { toast.error(t("cloud.error")); }
  };

  const avg = stats.data?.avg_rating ?? 0;
  const count = stats.data?.rating_count ?? 0;

  return (
    <div className="space-y-5">
      <Link to="/rezepte" className="text-xs font-semibold text-primary">← {t("nav.recipes")}</Link>
      {r.imagePath && <RecipePhoto path={r.imagePath} className="h-56 w-full rounded-2xl" />}
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ background: tpl?.color }}>{tpl?.emoji ?? "🍽️"}</span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight text-foreground">{r.title}</h1>
          <p className="text-xs text-muted-foreground">
            {r.authorName ? `${t("rs.by")} ${r.authorName} · ` : ""}{new Date(r.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleSpeak}
          aria-label={speaking ? t("rs.speakStop") : t("rs.speak")}
          aria-pressed={speaking}
          title={speaking ? t("rs.speakStop") : t("rs.speak")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-primary active:bg-muted"
        >
          {speaking ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" />
            </svg>
          )}
        </button>
      </div>

      {r.description && <p className="whitespace-pre-wrap text-sm text-foreground">{r.description}</p>}

      <div className="flex items-center gap-3 text-sm">
        <span className="font-semibold text-foreground">★ {count ? avg.toFixed(1) : "–"}</span>
        <span className="text-muted-foreground">{t("rs.ratingsN", { n: count })} · {t("rs.savesN", { n: stats.data?.save_count ?? 0 })}</span>
      </div>

      <section className="rounded-2xl bg-primary-soft/40 p-4">
        <ul className="space-y-1 text-sm text-foreground">
          {items.map((i) => <li key={i.productId}>{i.emoji ? `${i.emoji} ` : "• "}{i.name}{i.quantity ? ` — ${i.quantity}` : ""}</li>)}
        </ul>
        <button onClick={addAll} disabled={added} className="mt-3 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {added ? `✓ ${t("rk.added")}` : t("rk.addAll", { n: items.length })}
        </button>
        <div className="mt-2 flex gap-2">
          {user ? (
            <button onClick={() => setSaveOpen(true)} className="flex-1 rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary">📁 {t("rk.save")}</button>
          ) : (
            <Link to="/auth" className="flex-1 rounded-full border border-primary px-4 py-2.5 text-center text-sm font-semibold text-primary">{t("rs.signInToSave")}</Link>
          )}
          <button
            onClick={() => void shareLink(r.slug, r.title).then((h) => h === "copied" && toast.success(t("rs.linkCopied")))}
            className="rounded-full border border-primary px-4 py-2.5 text-sm font-semibold text-primary"
          >🔗 {t("rs.share")}</button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-bold text-foreground">{t("rs.yourRating")}</h2>
        {user ? (
          <div className="flex gap-1" role="radiogroup" aria-label={t("rs.yourRating")}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n}`} onClick={() => void rate(n)}
                className={`text-3xl transition active:scale-90 ${n <= stars ? "text-primary" : "text-muted-foreground/40"}`}>★</button>
            ))}
          </div>
        ) : (
          <Link to="/auth" className="text-sm font-semibold text-primary">{t("rs.signInToRate")}</Link>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-foreground">💬 {t("rs.comments")} ({comments.data?.length ?? 0})</h2>
        {(comments.data ?? []).map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{c.author_name ?? "—"}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleDateString()}
                {(user?.id === c.user_id || isAdmin) && (
                  <button aria-label={t("rs.deleteComment")} onClick={() => void deleteComment(c.id).then(() => comments.refetch())}>✕</button>
                )}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
          </div>
        ))}
        {user ? (
          <div className="flex gap-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder={t("rs.commentPh")}
              onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
              className="min-w-0 flex-1 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground outline-none focus:border-primary" />
            <button onClick={() => void send()} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{t("rs.send")}</button>
          </div>
        ) : (
          <Link to="/auth" className="text-sm font-semibold text-primary">{t("rs.signInToComment")}</Link>
        )}
      </section>

      {saveOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40" onClick={() => setSaveOpen(false)}>
          <div className="w-full max-w-[440px] space-y-3 rounded-t-3xl bg-background p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-foreground">{t("rk.saveTo")}</h3>
            {collections.map((c) => (
              <button key={c.id} onClick={() => void save(c.id)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground">
                <span>📁 {c.name}</span><span className="text-xs text-muted-foreground">{c.recipes.length}</span>
              </button>
            ))}
            {collections.length === 0 && (
              <button onClick={() => void save(null)} className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">+ {t("rk.newCollection")}</button>
            )}
            <button onClick={() => setSaveOpen(false)} className="w-full py-2 text-sm text-muted-foreground">{t("rk.cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
