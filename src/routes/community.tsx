import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/community")({
  ssr: false,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/rezepte/inspirationen", search });
  },
});
