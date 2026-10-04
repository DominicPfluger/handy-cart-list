import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLocale } from "@/i18n";
import { currentMarket, useMarket } from "./use-market";

export { currentMarket };

export type RefPrice = { product_id: string; price: number; pack_size?: number | null; pack_unit?: string | null; currency: string; unit_price: number | null; unit_basis: string | null; observed_at: string };

/** Richtpreise (Admin-Import) für das aktuelle Land, als Map productId → Preis. */
export function useReferencePrices() {
  const market = useMarket();
  return useQuery({
    queryKey: ["reference-prices", market],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const map = new Map<string, RefPrice>();
      for (let f = 0; ; f += 1000) {
        const { data } = await supabase.from("product_reference_prices").select("product_id, price, currency, pack_size, pack_unit, unit_price, unit_basis, observed_at").eq("market", market).range(f, f + 999);
        for (const r of (data ?? []) as RefPrice[]) map.set(r.product_id, r);
        if (!data || data.length < 1000) break;
      }
      return map;
    },
  });
}

const BASIS: Record<string, string> = { "100g": "100 g", kg: "kg", "100ml": "100 ml", l: "l" };

export function formatRefPrice(p: RefPrice) {
  const fmt = (n: number) => new Intl.NumberFormat(getLocale(), { style: "currency", currency: p.currency }).format(n);
  const unit = p.unit_price != null && p.unit_basis ? ` · ${fmt(p.unit_price)}/${BASIS[p.unit_basis] ?? p.unit_basis}` : "";
  return `≈ ${fmt(Number(p.price))}${unit}`;
}
