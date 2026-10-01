import { createFileRoute } from "@tanstack/react-router";
import { useShoppingList } from "../hooks/use-shopping-list";
import { translate, useT } from "../i18n";
import type { MessageKey } from "../i18n/de";

export const Route = createFileRoute("/aktivitaeten")({
  head: () => ({
    meta: [
      { title: "Shoppi — Aktivitäten" },
      { name: "description", content: "Alle Aktivitäten in deinen gemeinsamen Einkaufslisten." },
      { property: "og:title", content: "Shoppi — Aktivitäten" },
      { property: "og:description", content: "Alle Aktivitäten in deinen gemeinsamen Einkaufslisten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ActivityPage,
});

function timeAgo(ts: number, locale: string): string {
  const t = (k: MessageKey, n?: number) => translate(locale, k, { n: n ?? 0 });
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return t("more.justNow");
  if (min < 60) return t("more.minAgo", min);
  const h = Math.floor(min / 60);
  if (h < 24) return t("more.hAgo", h);
  const d = Math.floor(h / 24);
  return t("more.dAgo", d);
}

const AVATAR_COLORS = [
  "oklch(0.52 0.155 144)",
  "oklch(0.75 0.16 47)",
  "oklch(0.62 0.18 280)",
  "oklch(0.55 0.13 210)",
];

function ActivityPage() {
  const { members, activity } = useShoppingList();
  const { t, locale } = useT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("more.activity")}</h1>
      </div>

      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {activity.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-3">
            <MemberAvatar name={a.user} index={Math.max(0, members.indexOf(a.user))} size={36} textClass="text-xs" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{a.user}</span> {a.action}{" "}
                <span className="font-medium">{a.item}</span>
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo(a.at, locale)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
