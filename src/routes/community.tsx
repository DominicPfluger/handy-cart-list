import { createFileRoute, redirect } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

const searchSchema = z.object({
  tab: fallback(z.string(), "all").default("all"),
  author: fallback(z.string(), "").default(""),
  name: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/community")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Rezept-Community – Shoppi" },
    { name: "description", content: "Entdecke öffentliche Rezepte aus der Shoppi-Community." },
    { property: "og:title", content: "Rezept-Community – Shoppi" },
    { property: "og:description", content: "Entdecke öffentliche Rezepte aus der Shoppi-Community." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: zodValidator(searchSchema),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/rezepte/inspirationen", search });
  },
});
