import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/landing-page";
import { markLandingDone } from "@/lib/landing";

export const Route = createFileRoute("/start")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shoppi — Gemeinsam. Einfach. Einkaufen." },
      { name: "description", content: "Die smarte Einkaufsliste für deinen Alltag: gemeinsame Listen, über 1.000 Katalogartikel, Rezept-Generator und Community-Rezepte. Kostenlos." },
      { property: "og:title", content: "Shoppi — Gemeinsam. Einfach. Einkaufen." },
      { property: "og:description", content: "Die smarte Einkaufsliste für deinen Alltag — gemeinsam mit Familie und Freunden." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StartPage,
});

function StartPage() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onEnterApp={() => {
        markLandingDone();
        navigate({ to: "/" });
      }}
    />
  );
}
