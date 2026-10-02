import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MARKETS as FALLBACK } from "@/components/market-admin";

export type MarketRow = { code: string; name: string; flag: string; currency: string; enabled: boolean; sort_order: number };

export const marketsQuery = {
  queryKey: ["markets"],
  queryFn: async () => {
    const { data, error } = await supabase.from("markets").select("code, name, flag, currency, enabled, sort_order").order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as MarketRow[];
  },
  staleTime: 60_000,
};

/** Kürzel aller sichtbaren Länder-Märkte (Fallback: feste Liste). */
export function useMarketCodes(): string[] {
  const { data } = useQuery(marketsQuery);
  if (!data || data.length === 0) return FALLBACK;
  return data.filter((m) => m.enabled).map((m) => m.code);
}
