import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useT, useLocale, setLocale, useAllLocales, type Locale } from "../../i18n";
import type { MessageKey } from "../../i18n/de";
import { RECIPE_TEMPLATES } from "../../lib/recipe-templates";
import { fetchFeed, fetchCommunity } from "../../lib/recipes-api";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "../../lib/app-version";
import { RecipePhoto } from "../recipe-photo";
import appIcon from "@/assets/app-icon.png.asset.json";
import mockupList from "@/assets/landing/mockup-list.png";
import mockupDepartments from "@/assets/landing/mockup-departments.png";
import mockupRecipes from "@/assets/landing/mockup-recipes.png";

const FEATURES: Array<[MessageKey, MessageKey, string]> = [
  ["land.f1t", "land.f1d", "🤝"],
  ["land.f2t", "land.f2d", "🧺"],
  ["land.f3t", "land.f3d", "🍳"],
  ["land.f4t", "land.f4d", "🏷️"],
];

const FAQ: Array<[MessageKey, MessageKey]> = [
  ["land.faq1q", "land.faq1a"],
  ["land.faq2q", "land.faq2a"],
  ["land.faq3q", "land.faq3a"],
  ["land.faq4q", "land.faq4a"],
  ["land.faq5q", "land.faq5a"],
];

const NEWS: Array<[MessageKey, MessageKey, string]> = [
  ["land.news1t", "land.news1d", "🚀"],
  ["land.news2t", "land.news2d", "🍽️"],
  ["land.news3t", "land.news3d", "✨"],
];

type RowRecipe = {
  title: string; share_slug: string | null; image_path: string | null;
  template_id: string; author_name: string | null; created_at: string;
};

export function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const allLocs = useAllLocales();
  const { t } = useT();
  const locale = useLocale();
  const [installEvt, setInstallEvt] = useState<{ prompt: () => Promise<unknown> } | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as unknown as { prompt: () => Promise<unknown> });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const popular = useQuery({ queryKey: ["landing-popular"], queryFn: () => fetchFeed("rating", undefined, 4) });
  const newest = useQuery({ queryKey: ["landing-new"], queryFn: async () => (await fetchCommunity()).slice(0, 4) });

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-background">
      {/* Kopfzeile mit Sprachumschalter */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-4">
        <img src={appIcon.url} alt="Shoppi" className="h-9 w-9 rounded-xl" />
        <label className="flex items-center gap-2 text-xs">
          <span aria-hidden="true">🌐</span>
          <span className="sr-only">Sprache / Language</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground outline-none"
          >
            {allLocs.map((l) => (
              <option key={l.id} value={l.id}>{l.flag} {l.label}</option>
            ))}
          </select>
        </label>
      </header>

      {/* Hero */}
      <section className="bg-primary-soft/30 px-5 py-14 text-center">
        <div className="mx-auto max-w-3xl">
          <img src={appIcon.url} alt="Shoppi App-Icon" width={96} height={96} className="mx-auto h-24 w-24 rounded-3xl shadow-lg shadow-primary/30" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Shoppi</h1>
          <p className="mt-2 text-lg font-semibold text-primary">Gemeinsam.Einfach.Einkaufen.</p>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">{t("land.heroSub")}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onEnterApp}
              className="w-full max-w-xs rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 active:scale-[0.98] sm:w-auto"
            >
              {t("land.ctaOpen")}
            </button>
            <Link
              to="/rezepte"
              className="w-full max-w-xs rounded-2xl border border-primary/40 px-8 py-4 text-base font-semibold text-primary transition hover:bg-primary-soft/30 sm:w-auto"
            >
              {t("land.ctaRecipes")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-5 py-14">
        <SectionTitle title={t("land.featuresTitle")} sub={t("land.featuresSub")} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([tk, dk, icon]) => (
            <div key={tk} className="rounded-3xl border border-border bg-card p-5">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/40 text-2xl" aria-hidden="true">{icon}</span>
              <h3 className="mt-3 text-base font-semibold text-foreground">{t(tk)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(dk)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section className="bg-primary-soft/20 px-5 py-14">
        <div className="mx-auto w-full max-w-5xl">
          <SectionTitle title={t("land.shotsTitle")} sub={t("land.shotsSub")} />
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <img src={mockupList} alt="Shoppi Einkaufsliste" width={1024} height={1024} loading="lazy" className="mx-auto w-full max-w-xs rounded-3xl border border-border shadow-xl" />
            <img src={mockupDepartments} alt="Shoppi Kategorien" width={1024} height={1024} loading="lazy" className="mx-auto w-full max-w-xs rounded-3xl border border-border shadow-xl" />
            <img src={mockupRecipes} alt="Shoppi Rezept-Generator" width={1024} height={1024} loading="lazy" className="mx-auto w-full max-w-xs rounded-3xl border border-border shadow-xl" />
          </div>
        </div>
      </section>

      {/* Installieren */}
      <section className="mx-auto w-full max-w-5xl px-5 py-14">
        <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-6 text-center">
          <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl bg-primary-soft/40 text-2xl" aria-hidden="true">📲</span>
          <h2 className="mt-3 text-xl font-bold text-foreground">{t("land.installTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("land.installDesc")}</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <StoreButton
              href={APP_STORE_URL}
              label={t("land.storeAppStore")}
              soon={t("land.storeSoon")}
              icon={<AppleIcon />}
            />
            <StoreButton
              href={GOOGLE_PLAY_URL}
              label={t("land.storeGooglePlay")}
              soon={t("land.storeSoon")}
              icon={<PlayIcon />}
            />
          </div>
          <ol className="mx-auto mt-5 max-w-md space-y-2 text-left text-sm text-muted-foreground">
            <li className="flex gap-2"><span aria-hidden="true"></span><span>{t("land.installIos")}</span></li>
            <li className="flex gap-2"><span aria-hidden="true"></span><span>{t("land.installAndroid")}</span></li>
          </ol>
          {installEvt && (
            <button
              onClick={() => { void installEvt.prompt(); setInstallEvt(null); }}
              className="mt-5 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
            >
              {t("land.installBtn")}
            </button>
          )}
        </div>
      </section>

      {/* Rezepte: beliebt + neu */}
      <section className="bg-primary-soft/20 px-5 py-14">
        <div className="mx-auto w-full max-w-5xl">
          <SectionTitle title={t("land.popularTitle")} sub={t("land.recipesSub")} />
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">{t("land.popularTitle")}</h3>
              <RecipeRows q={popular} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">{t("land.newTitle")}</h3>
              <RecipeRows q={newest} />
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link to="/rezepte/inspirationen" className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-2 hover:underline">
              {t("land.viewAll")} <span aria-hidden="true">›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Rezept-Generator */}
      <section className="mx-auto w-full max-w-5xl px-5 py-14 text-center">
        <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl bg-primary-soft/40 text-2xl" aria-hidden="true">🧑‍🍳</span>
        <h2 className="mt-3 text-2xl font-bold text-foreground">{t("land.genTitle")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{t("land.genDesc")}</p>
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {RECIPE_TEMPLATES.map((tp) => (
            <span key={tp.id} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
              {tp.emoji} {t(`rk.cat.${tp.id}` as MessageKey)}
            </span>
          ))}
        </div>
        <Link
          to="/rezepte/generator"
          search={{ cat: undefined, recipe: undefined }}
          className="mt-8 inline-flex rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 active:scale-[0.98]"
        >
          {t("land.genCta")}
        </Link>
      </section>

      {/* Community + Angebote */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-14">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/40 text-2xl" aria-hidden="true">🌍</span>
            <h2 className="mt-3 text-lg font-bold text-foreground">{t("land.commTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("land.commDesc")}</p>
            <Link to="/rezepte/inspirationen" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-2 hover:underline">
              {t("land.commCta")} <span aria-hidden="true">›</span>
            </Link>
          </div>
          <Link to="/angebote" className="rounded-3xl border border-border bg-card p-6 transition hover:border-primary/50">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/40 text-2xl" aria-hidden="true">🏷️</span>
            <h2 className="mt-3 text-lg font-bold text-foreground">{t("land.offersTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("land.offersDesc")}</p>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-primary-soft/20 px-5 py-14">
        <div className="mx-auto w-full max-w-3xl">
          <SectionTitle title={t("land.faqTitle")} />
          <div className="mt-8 space-y-3">
            {FAQ.map(([qk, ak]) => (
              <details key={qk} className="group rounded-2xl border border-border bg-card px-4 py-3">
                <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:hidden">
                  <span className="mr-2 inline-block text-primary transition group-open:rotate-90" aria-hidden="true">▸</span>
                  {t(qk)}
                </summary>
                <p className="mt-2 pl-5 text-sm text-muted-foreground">{t(ak)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Kontakt + Newsletter */}
      <section className="mx-auto w-full max-w-5xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 text-center">
            <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl bg-primary-soft/40 text-2xl" aria-hidden="true">💬</span>
            <h2 className="mt-3 text-lg font-bold text-foreground">{t("land.contactTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("land.contactDesc")}</p>
            <Link
              to="/feedback"
              className="mt-4 inline-flex rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
            >
              {t("more.feedback")}
            </Link>
          </div>
          <NewsletterCard />
        </div>
      </section>

      {/* Neuigkeiten */}
      <section className="bg-primary-soft/20 px-5 py-14">
        <div className="mx-auto w-full max-w-5xl">
          <SectionTitle title={t("land.newsTitle")} />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {NEWS.map(([tk, dk, icon]) => (
              <article key={tk} className="rounded-3xl border border-border bg-card p-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft/40 text-2xl" aria-hidden="true">{icon}</span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{t(tk)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(dk)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-5 py-10 text-center">
        <img src={appIcon.url} alt="Shoppi App-Icon" className="mx-auto h-14 w-14 rounded-2xl shadow-sm" />
        <p className="mt-2 text-base font-semibold text-foreground">Shoppi</p>
        <p className="text-sm text-muted-foreground">Gemeinsam.Einfach.Einkaufen.</p>
        <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-xs">
          <Link to="/impressum" className="text-primary underline-offset-2 hover:underline">{t("more.imprint")}</Link>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <Link to="/datenschutz" className="text-primary underline-offset-2 hover:underline">{t("more.privacy")}</Link>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <Link to="/feedback" className="text-primary underline-offset-2 hover:underline">{t("more.feedback")}</Link>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <button onClick={onEnterApp} className="text-primary underline-offset-2 hover:underline">{t("land.ctaOpen")}</button>
        </nav>
        <p className="mt-4 text-xs text-muted-foreground">{t("more.copyright")}</p>
      </footer>
    </div>
  );
}

function StoreButton({ href, label, soon, icon }: { href: string; label: string; soon: string; icon: React.ReactNode }) {
  const inner = (
    <>
      <span aria-hidden="true">{icon}</span>
      <span className="flex flex-col items-center leading-tight">
        <span>{label}</span>
        {!href && <span className="text-xs font-normal text-muted-foreground">{soon}</span>}
      </span>
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/50 active:scale-[0.98]"
      >
        {inner}
      </a>
    );
  }
  return (
    <span
      aria-disabled="true"
      title={soon}
      className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-muted-foreground opacity-70"
    >
      {inner}
    </span>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3.6 1.8c-.36.2-.6.6-.6 1.1v18.2c0 .5.24.9.6 1.1l10.1-10.2L3.6 1.8Zm11.5 8.9 2.9-2.9-11-6.2 8.1 9.1Zm0 2.6-8.1 9.1 11-6.2-2.9-2.9Zm4.6-3.9-2.6-1.5-3.1 3.1 3.1 3.1 2.6-1.5c1.1-.7 1.1-2.4 0-3.1Z" />
    </svg>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      {sub && <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RecipeRows({ q }: { q: { isLoading: boolean; data?: RowRecipe[] | undefined; error: unknown } }) {
  const { t } = useT();
  if (q.isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-muted" />)}
      </div>
    );
  }
  const list = (q.data ?? []).filter((r) => r.share_slug);
  if (list.length === 0) {
    return <p className="rounded-2xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">{t("land.recipesEmpty")}</p>;
  }
  return (
    <div className="space-y-2">
      {list.map((r) => <RecipeRow key={r.share_slug} r={r} />)}
    </div>
  );
}

function RecipeRow({ r }: { r: RowRecipe }) {
  const { locale } = useT();
  const tpl = RECIPE_TEMPLATES.find((x) => x.id === r.template_id);
  const date = new Date(r.created_at).toLocaleDateString(locale);
  return (
    <Link
      to="/rezept/$slug"
      params={{ slug: r.share_slug! }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/50"
    >
      <RecipePhoto path={r.image_path} emoji={tpl?.emoji} color={tpl?.color} className="h-14 w-14 shrink-0 rounded-xl" />
      <span className="min-w-0 flex-1 text-left">
        <span className="line-clamp-1 block text-sm font-semibold text-foreground">{r.title}</span>
        <span className="block text-xs text-muted-foreground">
          {date}{r.author_name ? ` · ${r.author_name}` : ""}
        </span>
      </span>
      <span aria-hidden="true" className="text-muted-foreground">›</span>
    </Link>
  );
}

function NewsletterCard() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setState(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? "ok" : "err");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center">
      <span className="grid mx-auto h-12 w-12 place-items-center rounded-2xl bg-primary-soft/40 text-2xl" aria-hidden="true">✉️</span>
      <h2 className="mt-3 text-lg font-bold text-foreground">{t("land.nlTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("land.nlDesc")}</p>
      {state === "ok" ? (
        <p className="mt-4 rounded-2xl bg-primary-soft/40 px-4 py-3 text-sm font-semibold text-primary">{t("land.nlOk")}</p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-2" noValidate>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (state === "err") setState("idle"); }}
            placeholder={t("land.nlPh")}
            aria-label={t("land.nlTitle")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
          {state === "err" && <p className="text-xs font-semibold text-coral">{t("land.nlErr")}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
          >
            {t("land.nlBtn")}
          </button>
        </form>
      )}
    </div>
  );
}
