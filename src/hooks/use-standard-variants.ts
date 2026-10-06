import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/i18n";

export type StandardVariant = { id: string; name: string; sort_order: number; labels?: Record<string, string> };
export const STANDARD_VARIANTS_KEY = ["standard-variants"] as const;
const FALLBACK = ["Bio", "Vollkorn", "vegan", "laktosefrei", "glutenfrei", "zuckerfrei", "light", "groß", "klein", "mild", "scharf"];

export async function fetchStandardVariants(): Promise<StandardVariant[]> {
  const { data, error } = await (supabase as any).from("standard_variants").select("id,name,sort_order,labels").order("sort_order");
  if (error) throw error;
  return (data ?? []) as StandardVariant[];
}

/** Admin-gepflegte Vorschlags-Varianten: value = deutscher Basisname (wird gespeichert), label = Anzeige in aktiver Sprache. */
export function useStandardVariants(): Array<{ value: string; label: string }> {
  const locale = useLocale();
  const { data } = useQuery({ queryKey: STANDARD_VARIANTS_KEY, queryFn: fetchStandardVariants, staleTime: 5 * 60 * 1000 });
  if (!data) return FALLBACK.map((v) => ({ value: v, label: v }));
  return data.map((v) => ({ value: v.name, label: v.labels?.[locale] ?? v.name }));
}
