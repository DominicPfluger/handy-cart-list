import { useCallback, useEffect, useState } from "react";
import { LOCALES, useLocale, type Locale } from "../i18n";

const KEY = "shoppi:speak-locale";
const EVENT = "shoppi:speak-locale-changed";
export const DEFAULT_SPEAK_LOCALE: Locale = "de-DE";
/** Gespeicherter Wert: "app" = wie App-Sprache. */
export const SPEAK_FOLLOW_APP = "app";
export type SpeakLocaleSetting = Locale | typeof SPEAK_FOLLOW_APP;
const IDS = LOCALES.map((l) => l.id) as readonly string[];

export function getSpeakLocaleSetting(): SpeakLocaleSetting {
  if (typeof window === "undefined") return DEFAULT_SPEAK_LOCALE;
  const raw = window.localStorage.getItem(KEY);
  if (raw === SPEAK_FOLLOW_APP) return SPEAK_FOLLOW_APP;
  return raw && IDS.includes(raw) ? (raw as Locale) : DEFAULT_SPEAK_LOCALE;
}

/** [aufgelöste Vorlese-Sprache, Setter, gespeicherte Einstellung] */
export function useSpeakLocale(): [Locale, (l: SpeakLocaleSetting) => void, SpeakLocaleSetting] {
  const appLocale = useLocale();
  const [setting, setSetting] = useState<SpeakLocaleSetting>(DEFAULT_SPEAK_LOCALE);
  useEffect(() => {
    const sync = () => setSetting(getSpeakLocaleSetting());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const update = useCallback((next: SpeakLocaleSetting) => {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
    setSetting(next);
  }, []);
  const resolved = setting === SPEAK_FOLLOW_APP ? appLocale : setting;
  return [resolved, update, setting];
}
