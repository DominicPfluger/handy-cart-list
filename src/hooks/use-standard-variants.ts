import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StandardVariant = { id: string; name: string; sort_order: number };
export const STANDARD_VARIANTS_KEY = ["standard-variants"] as const;
const FALLBACK = ["Bio", "Vollkorn", "vegan", "laktosefrei", "glutenfrei", "zuckerfrei", "light", "groß", "klein", "mild", "scharf"];

export async function fetchStandardVariants(): Promise<StandardVariant[]> {
  const { data, error } = await (supabase as any).from("standard_variants").select("id,name,sort_order").order("sort_order");
  if (error) throw error;
  return (data ?? []) as StandardVariant[];
}

/** Admin-gepflegte Vorschlags-Varianten (Namen in Reihenfolge). */
export function useStandardVariants(): string[] {
  const { data } = useQuery({ queryKey: STANDARD_VARIANTS_KEY, queryFn: fetchStandardVariants, staleTime: 5 * 60 * 1000 });
  return data ? data.map((v) => v.name) : FALLBACK;
}
