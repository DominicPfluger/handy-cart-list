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

export const Route = createFileRoute("/mehr")({
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

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Minuten`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Stunde${h > 1 ? "n" : ""}`;
  const d = Math.floor(h / 24);
  return `vor ${d} Tag${d > 1 ? "en" : ""}`;
}

const AVATAR_COLORS = [
  "oklch(0.52 0.155 144)",
  "oklch(0.75 0.16 47)",
  "oklch(0.62 0.18 280)",
  "oklch(0.55 0.13 210)",
];

function MorePage() {
  const { members, activity } = useShoppingList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mehr</h1>
      </div>

      {/* Gemeinsam section */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <PeopleIcon className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Gemeinsam</h2>
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
            <span className="text-xs text-muted-foreground">Einladen</span>
          </div>
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]">
          <ShareIcon className="h-4 w-4" /> Personen einladen
        </button>
      </section>

      {/* Activity feed */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Aktivitäten</h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {activity.slice(0, 10).map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-card"
                style={{ background: AVATAR_COLORS[members.indexOf(a.user) % AVATAR_COLORS.length] }}
              >
                {a.user[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{a.user}</span> {a.action}{" "}
                  <span className="font-medium">{a.item}</span>
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo(a.at)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Settings menu */}
      <section className="divide-y divide-border rounded-2xl border border-border bg-card">
        <Link to="/angebote" className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-muted">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/50 text-primary">
            <span className="text-lg" aria-hidden="true">%</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Angebote</p>
            <p className="truncate text-xs text-muted-foreground">Aktuelle Deals in deiner Nähe</p>
          </div>
          <span className="text-muted-foreground">›</span>
        </Link>
        {[
          { Icon: BellIcon, label: "Erinnerungen", sub: "Benachrichtigungen verwalten" },
          { Icon: ScanIcon, label: "Barcode-Scanner", sub: "Produkte per Scan hinzufügen" },
          { Icon: LeafIcon, label: "Nachhaltig einkaufen", sub: "Saisonale Tipps & Tipps" },
          { Icon: GearIcon, label: "Einstellungen", sub: "Profil, Sprache & mehr" },
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

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Shoppi · Gemeinsam. Einfach. Einkaufen.
      </p>
    </div>
  );
}
