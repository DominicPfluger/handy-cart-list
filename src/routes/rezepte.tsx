import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/rezepte")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Rezepte – Shoppi" },
    { name: "description", content: "Entdecke Rezepte und finde Ideen für deine Einkaufsliste." },
    { property: "og:title", content: "Rezepte – Shoppi" },
    { property: "og:description", content: "Entdecke Rezepte und finde Ideen für deine Einkaufsliste." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <Outlet />,
});
