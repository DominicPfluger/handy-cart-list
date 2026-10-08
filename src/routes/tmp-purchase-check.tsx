import { createFileRoute } from "@tanstack/react-router";
import { PurchaseMode, type PurchaseItem } from "../components/purchase-mode";

export const Route = createFileRoute("/tmp-purchase-check")({
  ssr: false,
  component: () => (
    <PurchaseMode
      items={[{ id: "t1", name: "Mehl · Vollkorn", spoken: "Mehl Vollkorn, 1 Kilogramm", quantity: "1 kg", checked: false, emoji: "🌾" }]}
      onToggle={() => {}}
      onClose={() => {}}
    />
  ),
});
