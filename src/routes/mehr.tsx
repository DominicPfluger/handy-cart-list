import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useShoppingList } from "../hooks/use-shopping-list";
import {
  PeopleIcon,
  BellIcon,
  GearIcon,
  LeafIcon,
  ShareIcon,
  PlusIcon,
  HistoryIcon,
} from "../components/icons";
import { useAllLocales, getExplicitLocale, getLocale, setLocale, useT, type Locale } from "../i18n";
import { useEffect, useState, type ReactNode } from "react";
import { EyeOff, Images, Download } from "lucide-react";
import { useSyncExternalStore } from "react";
import { preloadCatalogImages, preloadState, subscribePreload } from "../lib/catalog-image-cache";
import { getCatalogImageUrls } from "../lib/catalog.functions";
import { setIconSet, useIconSet, type IconSet } from "../hooks/use-icon-set";
import { setFontSize, useFontSize, type FontSize } from "../hooks/use-font-size";
import { DIETS, DIET_EMOJI, setDiets, toggleDiet, useDietFilter } from "../hooks/use-diet-filter";
import { useHiddenDepartments, restoreDepartment } from "../hooks/use-hidden-departments";
import { useHiddenProducts, restoreProduct } from "../hooks/use-hidden-products";
import { useSpeakRate, DEFAULT_SPEAK_RATE } from "../hooks/use-speak-rate";
import { useSpeakLocale } from "../hooks/use-speak-locale";
import { useNotificationSettings } from "../hooks/use-notification-settings";
import { useIsAdmin } from "../hooks/use-is-admin";
import { setAllMarkets, useAllMarkets } from "../hooks/use-all-markets";
import { setMarketOverride, useMarket, useMarketOverride } from "../hooks/use-market";
import { marketsQuery } from "../hooks/use-markets";
import { catalogQueryOptions, useCatalog } from "../lib/catalog-query";
import { Button } from "../components/ui/button";
import { MemberAvatar } from "../components/member-avatar";
import { openShareSheet } from "../components/share-sheet";
import appIcon from "@/assets/splash-logo.png.asset.json";
import { APP_VERSION } from "../lib/app-version";

export const Route = createFileRoute("/mehr")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions(getLocale())),
  head: () => ({
    meta: [
      { title: "Shoppi — Mehr" },
      { name: "description", content: "Einstellungen, gemeinsame Listen, Aktivitäten und mehr." },
      { property: "og:title", content: "Shoppi — Mehr" },
      { property: "og:description", content: "Einstellungen, gemeinsame Listen, Aktivitäten und mehr." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MorePage,
});



function MorePage() {
  const allLocs = useAllLocales();
  const { members, signedIn, activeList, inviteLinkFor } = useShoppingList();
  const { t, locale } = useT();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const inviteLink = signedIn ? inviteLinkFor(activeList.id) : null;
  const invite = () => {
    if (!signedIn) {
      navigate({ to: "/auth" });
      return;
    }
    if (!inviteLink) {
      toast.error(t("join.needSignIn"));
      return;
    }
    openShareSheet({ title: activeList.name, heading: t("inv.title"), text: inviteText });
  };
  const inviteText = inviteLink ? `„${activeList.name}“ – ${t("lm.inviteHint")}\n${inviteLink}` : "";
  const [choice, setChoice] = useState<string>("auto");
  const hiddenIds = useHiddenDepartments();
  const catalog = useCatalog();
  const hiddenCategories = catalog.departments.filter((department) => hiddenIds.includes(department.id));
  const hiddenProductIds = useHiddenProducts();
  const hiddenProducts = catalog.products.filter((product) => hiddenProductIds.includes(product.id));
  const [hiddenOpen, setHiddenOpen] = useState(false);
  useEffect(() => setChoice(getExplicitLocale() ?? "auto"), [locale]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("nav.more")}</h1>
      </div>

      {/* Gemeinsam section */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <PeopleIcon className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{t("more.together")}</h2>
        </div>

        {/* Member bubbles */}
        <div className="flex flex-wrap gap-3">
          {members.map((m, i) => (
            <div key={m} className="flex flex-col items-center gap-1.5">
              <MemberAvatar name={m} index={i} size={56} />
              <span className="text-xs font-medium text-foreground">{m}</span>
            </div>
          ))}
          <button type="button" onClick={invite} className="flex flex-col items-center gap-1.5">
            <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-primary/40 text-primary">
              <PlusIcon className="h-6 w-6" />
            </div>
            <span className="text-xs text-muted-foreground">{t("more.invite")}</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          {signedIn ? `„${activeList.name}“ – ${t("lm.inviteHint")}` : t("join.needSignIn")}
        </p>

        <button type="button" onClick={invite} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]">
          <ShareIcon className="h-4 w-4" /> {t("more.invitePeople")}
        </button>
      </section>

      {/* Settings menu */}
      <section className="divide-y divide-border rounded-2xl border border-border bg-card">
        <Link to="/vorrat" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
            <span className="text-lg" aria-hidden="true">🏠</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{t("pantry.title")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("pantry.desc")}</p>
          </div>
          <span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/angebote" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
            <span className="text-lg" aria-hidden="true">%</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{t("more.offers")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("more.offersSub")}</p>
          </div>
          <span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/aktivitaeten" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
            <span className="text-lg" aria-hidden="true">🕘</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{t("more.activity")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("more.activitySub")}</p>
          </div>
          <span className="text-muted-foreground">›</span>
        </Link>
        <Link to="/verlauf" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{t("hist.title")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("hist.subtitle")}</p>
          </div>
          <span className="text-muted-foreground">›</span>
        </Link>
        <NotificationSettingsRow />
        <div>
          <button
            type="button"
            onClick={() => setHiddenOpen((open) => !open)}
            aria-expanded={hiddenOpen}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
              <EyeOff className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t("more.hiddenProducts")}</p>
              <p className="truncate text-xs text-muted-foreground">{t("more.hiddenProductsHint")}</p>
            </div>
            {hiddenProducts.length > 0 && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{hiddenProducts.length}</span>}
            <span className="text-muted-foreground" aria-hidden="true">{hiddenOpen ? "▴" : "▾"}</span>
          </button>
          {hiddenOpen && (
            <div className="divide-y divide-border border-t border-border">
              {hiddenProducts.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">{t("more.hiddenProductsEmpty")}</p>
              ) : (
                hiddenProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0 text-sm text-foreground">{product.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => restoreProduct(product.id)} className="shrink-0 text-primary">{t("more.restore")}</Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>



      <section className="divide-y divide-border rounded-2xl border border-border bg-card">
        {[
          { Icon: LeafIcon, label: t("more.sustainable"), sub: t("more.sustainableSub") },
        ].map((row) => (
          <button
            key={row.label}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
              <row.Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{row.label}</p>
              <p className="truncate text-xs text-muted-foreground">{row.sub}</p>
            </div>
            <span className="text-muted-foreground">›</span>
          </button>
        ))}
      </section>

      {/* Sprache & Admin */}
      <section className="divide-y divide-border rounded-2xl border border-border bg-card">
        <DietPreferenceRow />
        <label className="flex w-full items-center gap-3 px-4 py-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
            <GearIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{t("lang.title")}</p>
            <select
              value={choice}
              onChange={(e) => setLocale(e.target.value === "auto" ? null : (e.target.value as Locale))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="auto">{t("lang.auto")}</option>
              {allLocs.map((l) => (
                <option key={l.id} value={l.id}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
        </label>
        <MarketRow />
        <AllMarketsRow />
        <IconSetRow />
        <PreloadImagesRow />
        <FontSizeRow />
        <SpeakLocaleRow />
        <SpeakRateRow />
        {isAdmin && (
          <Link to="/admin" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
              <span className="text-lg" aria-hidden="true">✎</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t("more.admin")}</p>
              <p className="truncate text-xs text-muted-foreground">{t("more.adminSub")}</p>
            </div>
            <span className="text-muted-foreground">›</span>
          </Link>
        )}
        {isAdmin && (
          <Link to="/feedback-admin" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
              <span className="text-lg" aria-hidden="true">✉</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t("fb.inbox")}</p>
              <p className="truncate text-xs text-muted-foreground">{t("fb.inboxSub")}</p>
            </div>
            <FeedbackBadge />
            <span className="text-muted-foreground">›</span>
          </Link>
        )}
      </section>

      {hiddenCategories.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">{t("more.hiddenCategories")}</h2>
          <p className="text-sm text-muted-foreground">{t("more.hiddenCategoriesHint")}</p>
          <div className="divide-y divide-border border-y border-border">
            {hiddenCategories.map((department) => (
              <div key={department.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 text-sm text-foreground">{department.name}</span>
                <Button variant="ghost" size="sm" onClick={() => restoreDepartment(department.id)} className="shrink-0 text-primary">{t("more.restore")}</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="flex flex-col items-center gap-1 pt-4 pb-2 text-center">
        <img src={appIcon.url} alt="Shoppi App-Icon" className="h-16 w-16 rounded-2xl shadow-sm" />
        <p className="mt-2 text-base font-semibold text-foreground">Shoppi</p>
        <p className="text-sm text-muted-foreground">{t("more.tagline").replace("Shoppi · ", "")}</p>
        <p className="text-xs text-muted-foreground">{t("more.version", { version: APP_VERSION })}</p>
        <p className="text-xs text-muted-foreground">{t("more.copyright")}</p>
        <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-2 text-xs">
          <Link to="/impressum" className="text-primary underline-offset-2 hover:underline">{t("more.imprint")}</Link>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <Link to="/datenschutz" className="text-primary underline-offset-2 hover:underline">{t("more.privacy")}</Link>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <Link to="/feedback" className="text-primary underline-offset-2 hover:underline">{t("more.feedback")}</Link>
          <span className="text-muted-foreground" aria-hidden="true">·</span>
          <Link to="/start" className="text-primary underline-offset-2 hover:underline">{t("land.siteLink")}</Link>
        </nav>
      </footer>
    </div>
  );
}

function IconSetRow() {
  const { t } = useT();
  const selected = useIconSet();
  return (
    <div className="flex w-full items-start gap-3 px-4 py-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
        <Images className="h-5 w-5" />
      </div>
      <label className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-foreground">{t("more.iconSet")}</span>
        <select value={selected} onChange={(e) => setIconSet(e.target.value as IconSet)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <option value="images">{t("more.iconImages")}</option>
          <option value="symbols">{t("more.iconSymbols")}</option>
        </select>
      </label>
    </div>
  );
}

function PreloadImagesRow() {
  const { t } = useT();
  const st = useSyncExternalStore(subscribePreload, preloadState, preloadState);
  const start = async () => {
    try { await preloadCatalogImages(await getCatalogImageUrls()); toast.success(t("more.preloadDone")); }
    catch { toast.error(t("more.preloadError")); }
  };
  const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
  return (
    <div className="flex w-full items-start gap-3 px-4 py-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-foreground">{t("more.preload")}</span>
        <p className="text-xs text-muted-foreground">{t("more.preloadHint")}</p>
        {st.running || st.total > 0 ? (
          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{st.done} / {st.total}</p>
          </div>
        ) : null}
        <Button type="button" variant="outline" size="sm" className="mt-2" disabled={st.running} onClick={() => void start()}>
          {st.running ? t("more.preloadRunning") : t("more.preloadStart")}
        </Button>
      </div>
    </div>
  );
}

function FontSizeRow() {
  const { t } = useT();
  const size = useFontSize();
  return (
    <div className="flex w-full items-start gap-3 px-4 py-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
        <span className="text-base font-bold" aria-hidden="true">Aa</span>
      </div>
      <label className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-foreground">{t("more.fontSize")}</span>
        <select value={size} onChange={(e) => setFontSize(e.target.value as FontSize)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <option value="small">{t("more.fontSizeSmall")}</option>
          <option value="normal">{t("more.fontSizeNormal")}</option>
          <option value="large">{t("more.fontSizeLarge")}</option>
        </select>
      </label>
    </div>
  );
}

function DietPreferenceRow() {
  const { t } = useT();
  const diets = useDietFilter();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex h-auto w-full items-center justify-start gap-3 rounded-none px-4 py-3.5 text-left"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-xl" aria-hidden="true">🥗</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("more.dietPreference")}</p>
          <p className="whitespace-normal text-xs font-normal text-muted-foreground">
            {diets.length ? diets.map((diet) => t(`diet.${diet}`)).join(" · ") : t("more.dietNone")}
          </p>
        </div>
        <span className="shrink-0 text-muted-foreground" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </Button>
      {open && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {DIETS.map((diet) => {
              const selected = diets.includes(diet);
              return (
                <Button key={diet} type="button" size="sm" variant={selected ? "default" : "outline"}
                  aria-pressed={selected} onClick={() => toggleDiet(diet, "pref")} className="h-9 gap-1.5 rounded-full text-xs">
                  <span aria-hidden="true">{DIET_EMOJI[diet]}</span>{t(`diet.${diet}`)}
                </Button>
              );
            })}
          </div>
          {diets.length > 0 && <Button type="button" variant="ghost" size="sm" className="mt-2 px-2 text-primary" onClick={() => setDiets([])}>{t("diet.reset")}</Button>}
        </div>
      )}
    </div>
  );
}

function SpeakLocaleRow() {
  const allLocs = useAllLocales();
  const { t } = useT();
  const [, setLoc, loc] = useSpeakLocale();
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
        <span className="text-lg" aria-hidden="true">🗣️</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{t("speak.locale")}</p>
        <p className="truncate text-xs text-muted-foreground">{t("speak.localeSub")}</p>
        <select
          value={loc}
          onChange={(e) => setLoc(e.target.value as Locale | "app")}
          aria-label={t("speak.locale")}
          className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        >
          <option value="app">🌐 {t("speak.followApp")}</option>
          {allLocs.map((l) => <option key={l.id} value={l.id}>{l.flag} {l.label}</option>)}
        </select>
      </div>
    </div>
  );
}

function SpeakRateRow() {
  const { t } = useT();
  const [rate, setRate] = useSpeakRate();
  return (
    <div className="flex w-full items-center gap-3 px-4 py-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
        <span className="text-lg" aria-hidden="true">🔊</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{t("speak.rate")}</p>
        <p className="truncate text-xs text-muted-foreground">{t("speak.rateSub")}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-muted-foreground" aria-hidden="true">🐢</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            aria-label={t("speak.rate")}
            className="w-full accent-primary"
          />
          <span className="text-xs text-muted-foreground" aria-hidden="true">🐇</span>
          <button
            type="button"
            onClick={() => setRate(DEFAULT_SPEAK_RATE)}
            className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground"
          >
            {rate.toFixed(2)}×
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({
  label,
  sub,
  checked,
  disabled,
  icon,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className={`flex w-full items-center gap-3 px-4 py-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      {icon ? (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50">
          <span className="text-lg" aria-hidden="true">{icon}</span>
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-primary"
      />
    </label>
  );
}

function NotificationSettingsRow() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [settings, update] = useNotificationSettings();
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
          <BellIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("notif.title")}</p>
          <p className="truncate text-xs text-muted-foreground">{t("notif.sub")}</p>
        </div>
        <span className={`text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}>›</span>
      </button>
      {open ? (
        <div className="divide-y divide-border border-t border-border pb-1">
          <NotificationToggle
            label={t("notif.enabled")}
            sub={t("notif.enabledSub")}
            checked={settings.enabled}
            onChange={(v) => update({ enabled: v })}
          />
          <NotificationToggle
            label={t("notif.listChanges")}
            sub={t("notif.listChangesSub")}
            checked={settings.listChanges}
            disabled={!settings.enabled}
            onChange={(v) => update({ listChanges: v })}
          />
          <NotificationToggle
            label={t("notif.shoppingTrip")}
            sub={t("notif.shoppingTripSub")}
            checked={settings.shoppingTrip}
            disabled={!settings.enabled}
            onChange={(v) => update({ shoppingTrip: v })}
          />
          <NotificationToggle
            label={t("notif.reminders")}
            sub={t("notif.remindersSub")}
            checked={settings.reminders}
            disabled={!settings.enabled}
            onChange={(v) => update({ reminders: v })}
          />
          <NotificationToggle
            label={t("notif.pantryHistory")}
            sub={t("notif.pantryHistorySub")}
            checked={settings.pantryHistory}
            disabled={!settings.enabled}
            onChange={(v) => update({ pantryHistory: v })}
          />
          <NotificationToggle
            label={t("notif.newFavRecipes")}
            sub={t("notif.newFavRecipesSub")}
            checked={settings.newFavoriteRecipes}
            disabled={!settings.enabled}
            onChange={(v) => update({ newFavoriteRecipes: v })}
          />
          <NotificationToggle
            label={t("notif.recipeComments")}
            sub={t("notif.recipeCommentsSub")}
            checked={settings.recipeComments}
            disabled={!settings.enabled}
            onChange={(v) => update({ recipeComments: v })}
          />
          <p className="px-4 py-2.5 text-xs text-muted-foreground">{t("notif.note")}</p>
        </div>
      ) : null}
    </div>
  );
}

function MarketRow() {
  const { t } = useT();
  const override = useMarketOverride();
  const effective = useMarket();
  const { data: markets = [] } = useQuery(marketsQuery);
  const active = markets.filter((m) => m.enabled);
  return (
    <div className="flex w-full items-start gap-3 px-4 py-3.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-xl" aria-hidden="true">🛒</div>
      <label className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-foreground">{t("more.market")}</span>
        <select
          value={override ?? "auto"}
          onChange={(e) => setMarketOverride(e.target.value === "auto" ? null : e.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="auto">{t("more.marketAuto")} ({effective})</option>
          {active.map((m) => (
            <option key={m.code} value={m.code}>{m.flag} {m.name} · {m.currency}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

function AllMarketsRow() {
  const { t } = useT();
  const on = useAllMarkets();
  return <NotificationToggle icon="🌍" label={t("more.allMarkets")} sub={t("more.allMarketsSub")} checked={on} onChange={setAllMarkets} />;
}

function FeedbackBadge() {
  const { data: count = 0 } = useQuery({
    queryKey: ["feedback-messages", "unread"],
    queryFn: async () => {
      const { count } = await supabase.from("feedback_messages").select("id", { count: "exact", head: true }).eq("status", "neu");
      return count ?? 0;
    },
  });
  if (!count) return null;
  return <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{count}</span>;
}
