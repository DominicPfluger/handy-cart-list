import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMarket } from "./use-market";
import { useGroupOrder } from "./use-group-order";
import { useT } from "../i18n";

export type StoreOption = { id: string; name: string; emoji?: string | undefined; custom?: boolean };

/** Läden des gewählten Marktes (Admin-Liste) + eigene Läden + „Standard" — Name und Icon getrennt. */
export function useStores(): StoreOption[] {
  const market = useMarket();
  const { t } = useT();
  const { customStores, storeOrder } = useGroupOrder();
  const { data } = useQuery({
    queryKey: ["supermarkets", market],
    queryFn: async () => {
      const { data } = await supabase.from("supermarkets").select("id,name,emoji").eq("market_code", market).eq("enabled", true).order("sort_order");
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });
  const rest: StoreOption[] = [
    ...(data ?? []).map((s) => ({ id: s.id, name: s.name, emoji: s.emoji ?? undefined })),
    ...customStores.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji, custom: true as const })),
  ];
  // Geräte-lokale Laden-Reihenfolge anwenden; unbekannte/neue Läden hängen hinten an.
  if (storeOrder.length > 0) {
    const pos = new Map(storeOrder.map((id, i) => [id, i]));
    rest.sort((a, b) => {
      const ia = pos.get(a.id);
      const ib = pos.get(b.id);
      if (ia !== undefined && ib !== undefined) return ia - ib;
      if (ia !== undefined) return -1;
      if (ib !== undefined) return 1;
      return 0;
    });
  }
  return [{ id: "default", name: t("store.default"), emoji: "🏪" }, ...rest];
}

/** „Icon Name" für Dropdown-Optionen und Klartext-Anzeigen. */
export function storeLabel(s: { name: string; emoji?: string | undefined }): string {
  return s.emoji ? `${s.emoji} ${s.name}` : s.name;
}
