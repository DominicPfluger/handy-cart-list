import { useCallback, useEffect, useState } from "react";
import { LOCALES, type Locale } from "../i18n";

const KEY = "shoppi:speak-locale";
const EVENT = "shoppi:speak-locale-changed";
export const DEFAULT_SPEAK_LOCALE: Locale = "de-DE";
const IDS = LOCALES.map((l) => l.id) as readonly string[];

export function getSpeakLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_SPEAK_LOCALE;
  const raw = window.localStorage.getItem(KEY);
  return raw && IDS.includes(raw) ? (raw as Locale) : DEFAULT_SPEAK_LOCALE;
}

export function useSpeakLocale(): [Locale, (l: Locale) => void] {
  const [loc, setLoc] = useState<Locale>(DEFAULT_SPEAK_LOCALE);
  useEffect(() => {
    const sync = () => setLoc(getSpeakLocale());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const update = useCallback((next: Locale) => {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
    setLoc(next);
  }, []);
  return [loc, update];
}
