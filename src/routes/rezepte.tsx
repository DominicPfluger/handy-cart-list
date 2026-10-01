import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/rezepte")({
  ssr: false,
  component: () => <Outlet />,
});
