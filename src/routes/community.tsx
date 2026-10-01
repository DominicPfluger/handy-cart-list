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
  validateSearch: zodValidator(searchSchema),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/rezepte/inspirationen", search });
  },
});
