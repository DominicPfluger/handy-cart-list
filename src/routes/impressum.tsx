import { createFileRoute, Link } from "@tanstack/react-router";
import { useT } from "../i18n";
import { APP_VERSION, FEEDBACK_EMAIL } from "../lib/app-version";

export const Route = createFileRoute("/impressum")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Impressum" },
      { name: "description", content: "Impressum und Anbieterkennzeichnung der App Shoppi." },
      { property: "og:title", content: "Shoppi — Impressum" },
      { property: "og:description", content: "Impressum und Anbieterkennzeichnung der App Shoppi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImpressumPage,
});

function ImpressumPage() {
  const { t } = useT();
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <Link to="/mehr" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
        ← {t("nav.more")}
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("more.imprint")}</h1>
      </div>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
        <div>
          <p className="font-semibold">Shoppi</p>
          <p className="text-muted-foreground">Einkaufslisten-App · Version {APP_VERSION}</p>
        </div>
        <div>
          <p className="font-semibold">Anbieterin</p>
          {/* Platzhalter — echte Anbieterangaben hier eintragen */}
          <p className="text-muted-foreground">[Name]</p>
          <p className="text-muted-foreground">[Adresse]</p>
          <p className="text-muted-foreground">[PLZ Ort]</p>
          <p className="text-muted-foreground">[Land]</p>
        </div>
        <div>
          <p className="font-semibold">Kontakt</p>
          <a href={`mailto:${FEEDBACK_EMAIL}`} className="text-primary underline-offset-2 hover:underline">
            {FEEDBACK_EMAIL}
          </a>
        </div>
        <p className="text-xs text-muted-foreground">{t("more.copyright")}</p>
      </section>
    </div>
  );
}
