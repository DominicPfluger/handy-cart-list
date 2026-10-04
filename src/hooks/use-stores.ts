import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMarket } from "./use-market";
import { useGroupOrder } from "./use-group-order";
import { useT } from "../i18n";

export type StoreOption = { id: string; name: string; custom?: boolean };

/** Läden des gewählten Marktes (Admin-Liste) + eigene Läden + „Standard". */
export function useStores(): StoreOption[] {
  const market = useMarket();
  const { t } = useT();
  const { customStores } = useGroupOrder();
  const { data } = useQuery({
    queryKey: ["supermarkets", market],
    queryFn: async () => {
      const { data } = await supabase.from("supermarkets").select("id,name,emoji").eq("market_code", market).eq("enabled", true).order("sort_order");
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });
  return [
    { id: "default", name: t("store.default") },
    ...(data ?? []).map((s) => ({ id: s.id, name: `${s.emoji ? s.emoji + " " : ""}${s.name}` })),
    ...customStores.map((s) => ({ ...s, custom: true })),
  ];
}
