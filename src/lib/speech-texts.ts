import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { translate } from "../i18n";

export const SPEECH_KEYS = ["intro", "empty", "group", "outro"] as const;
export type SpeechKey = (typeof SPEECH_KEYS)[number];

export interface SpeechTextRow { id: string; locale: string; key: string; text: string }

export const speechTextsQueryKey = ["speech-texts"];

export function useSpeechTexts() {
  return useQuery({
    queryKey: speechTextsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("speech_texts").select("id, locale, key, text");
      if (error) throw error;
      return (data ?? []) as SpeechTextRow[];
    },
    staleTime: 5 * 60_000,
  });
}

/** Eingebauter Standardtext pro Sprache. */
export function defaultSpeechText(locale: string, key: SpeechKey): string {
  switch (key) {
    case "intro": return translate(locale, "speak.intro");
    case "empty": return `{name}. ${translate(locale, "speak.empty")}`;
    case "group": return "{kategorie}: {artikel}.";
    case "outro": return "";
  }
}

export function resolveSpeechText(rows: SpeechTextRow[] | undefined, locale: string, key: SpeechKey, count?: number): string {
  const custom = rows?.find((r) => r.locale === locale && r.key === key)?.text?.trim();
  if (custom) return custom;
  if (key === "intro" && count === 1) return translate(locale, "speak.introOne");
  return defaultSpeechText(locale, key);
}

export function fillSpeech(tpl: string, vars: Record<string, string | number>): string {
  let s = tpl;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
