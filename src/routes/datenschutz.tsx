import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "../i18n";
import { FEEDBACK_EMAIL } from "../lib/app-version";

export const Route = createFileRoute("/datenschutz")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Datenschutz" },
      { name: "description", content: "Datenschutzhinweise der App Shoppi: welche Daten gespeichert werden und wie sie behandelt werden." },
      { property: "og:title", content: "Shoppi — Datenschutz" },
      { property: "og:description", content: "Datenschutzhinweise der App Shoppi: welche Daten gespeichert werden und wie sie behandelt werden." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DatenschutzPage,
});

function DatenschutzPage() {
  const { t } = useT();
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Link to="/mehr" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
        ← {t("nav.more")}
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("more.privacy")}</h1>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
        <div>
          <p className="font-semibold">Welche Daten speichert Shoppi?</p>
          <p className="text-muted-foreground">
            Deine Einkaufslisten, Favoriten und Rezepte werden in deinem Shoppi-Konto gespeichert, wenn du angemeldet bist. Listen, die du mit
            anderen teilst, sehen auch die Mitglieder dieser Liste.
          </p>
        </div>
        <div>
          <p className="font-semibold">Persönliche Einstellungen</p>
          <p className="text-muted-foreground">
            Einstellungen wie versteckte Produkte, deine bevorzugten Mengen, Sprach- und Vorleseoptionen sowie der Einkauf-Verlauf bleiben
            ausschliesslich auf deinem Gerät gespeichert und werden nicht an andere weitergegeben.
          </p>
        </div>
        <div>
          <p className="font-semibold">Keine Werbung, kein Tracking</p>
          <p className="text-muted-foreground">
            Shoppi verwendet keine Werbe-Tracker und verkauft keine Daten. Es werden nur die Daten erhoben, die für den Betrieb der App
            notwendig sind.
          </p>
        </div>
        <div>
          <p className="font-semibold">Deine Rechte</p>
          <p className="text-muted-foreground">
            Du kannst dein Konto und die zugehörigen Daten jederzeit löschen. Für Fragen oder Auskunftsanfragen erreichst du uns unter:
          </p>
          <a href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("Shoppi Datenschutz")}`} className="text-primary underline-offset-2 hover:underline">
            {FEEDBACK_EMAIL}
          </a>
        </div>
        <p className="text-xs text-muted-foreground">{t("more.copyright")}</p>
      </section>
    </div>
  );
}
