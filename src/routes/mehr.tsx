import { createFileRoute, Link } from "@tanstack/react-router";
import { useShoppingList } from "../hooks/use-shopping-list";
import {
  PeopleIcon,
  BellIcon,
  GearIcon,
  LeafIcon,
  ScanIcon,
  ShareIcon,
  PlusIcon,
} from "../components/icons";
import { LOCALES, getExplicitLocale, setLocale, useT, type Locale } from "../i18n";
import { useEffect, useState } from "react";
import { useHiddenDepartments, restoreDepartment } from "../hooks/use-hidden-departments";
import { catalogQueryOptions, useCatalog } from "../lib/catalog-query";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/mehr")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQueryOptions),
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


const AVATAR_COLORS = [
  "oklch(0.52 0.155 144)",
  "oklch(0.75 0.16 47)",
  "oklch(0.62 0.18 280)",
  "oklch(0.55 0.13 210)",
];

function MorePage() {
  const { members } = useShoppingList();
  const { t, locale } = useT();
  const [choice, setChoice] = useState<string>("auto");
  const hiddenIds = useHiddenDepartments();
  const catalog = useCatalog();
  const hiddenCategories = catalog.departments.filter((department) => hiddenIds.includes(department.id));
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
              <div
                className="grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-card"
                style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {m[0]}
              </div>
              <span className="text-xs font-medium text-foreground">{m}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1.5">
            <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-primary/40 text-primary">
              <PlusIcon className="h-6 w-6" />
            </div>
            <span className="text-xs text-muted-foreground">{t("more.invite")}</span>
          </div>
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]">
          <ShareIcon className="h-4 w-4" /> {t("more.invitePeople")}
        </button>
      </section>


      {/* Sprache & Admin */}
      <section className="divide-y divide-border rounded-2xl border border-border bg-card">
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
              {LOCALES.map((l) => (
                <option key={l.id} value={l.id}>{l.flag} {l.label}</option>
              ))}
            </select>
          </div>
        </label>
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
      </section>

      {/* Settings menu */}
      <section className="divide-y divide-border rounded-2xl border border-border bg-card">
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
        <Link to="/scanner" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
            <ScanIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{t("more.scanner")}</p>
            <p className="truncate text-xs text-muted-foreground">{t("more.scannerSub")}</p>
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
        {[
          { Icon: BellIcon, label: t("more.reminders"), sub: t("more.remindersSub") },
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

      <p className="pb-2 text-center text-xs text-muted-foreground">
        {t("more.tagline")}
      </p>
    </div>
  );
}
