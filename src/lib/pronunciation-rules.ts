import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PronunciationRule {
  id: string;
  locale: string;
  written: string;
  spoken: string;
}

const EMPTY: PronunciationRule[] = [];
export const pronunciationRulesQueryKey = ["pronunciation-rules"];
let cachedRules: PronunciationRule[] = EMPTY;

export function usePronunciationRules() {
  return useQuery({
    queryKey: pronunciationRulesQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("pronunciation_rules").select("id, locale, written, spoken").order("written");
      if (error) throw error;
      cachedRules = (data ?? []) as PronunciationRule[];
      return cachedRules;
    },
    staleTime: 5 * 60_000,
  });
}

export function getPronunciationRules(): PronunciationRule[] {
  return cachedRules;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Ersetzt zentral verwaltete Schreibweisen nur für die Sprachausgabe, nie im sichtbaren Produktnamen. */
export function applyPronunciationRules(text: string, locale: string, rules: PronunciationRule[]): string {
  const applicable = rules
    .filter((rule) => rule.locale === locale && rule.written.trim() && rule.spoken.trim())
    .sort((a, b) => b.written.length - a.written.length);
  return applicable.reduce(
    (result, rule) => result.replace(new RegExp(escapeRegExp(rule.written.trim()), "giu"), rule.spoken.trim()),
    text,
  );
}