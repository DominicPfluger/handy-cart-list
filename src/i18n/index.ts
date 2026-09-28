import { useCallback, useSyncExternalStore } from "react";
import { de, type MessageKey } from "./de";
import messages from "./messages.json";

export const LOCALES = [
  { id: "de-DE", label: "Deutsch (Deutschland)", flag: "🇩🇪" },
  { id: "de-AT", label: "Deutsch (Österreich)", flag: "🇦🇹" },
  { id: "de-CH", label: "Deutsch (Schweiz)", flag: "🇨🇭" },
  { id: "en-US", label: "English (United States)", flag: "🇺🇸" },
  { id: "en-GB", label: "English (United Kingdom)", flag: "🇬🇧" },
  { id: "en-CA", label: "English (Canada)", flag: "🇨🇦" },
  { id: "es-ES", label: "Español (España)", flag: "🇪🇸" },
  { id: "es-MX", label: "Español (México)", flag: "🇲🇽" },
  { id: "fr-FR", label: "Français (France)", flag: "🇫🇷" },
  { id: "fr-CA", label: "Français (Canada)", flag: "🇨🇦" },
  { id: "it-IT", label: "Italiano (Italia)", flag: "🇮🇹" },
  { id: "it-CH", label: "Italiano (Svizzera)", flag: "🇨🇭" },
  { id: "pt-PT", label: "Português (Portugal)", flag: "🇵🇹" },
  { id: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { id: "nl-NL", label: "Nederlands (Nederland)", flag: "🇳🇱" },
  { id: "nl-BE", label: "Nederlands (België)", flag: "🇧🇪" },
] as const;

export type Locale = (typeof LOCALES)[number]["id"];
export const DEFAULT_LOCALE: Locale = "de-DE";
export const TRANSLATED_LOCALES = LOCALES.map((l) => l.id).filter((l) => l !== "de-DE");
const IDS = LOCALES.map((l) => l.id) as readonly string[];
const STORAGE_KEY = "shoppi:locale";

const dicts = messages as Record<string, Record<string, string>>;

/** Wählt die passendste unterstützte Sprachvariante für eine Browsersprache. */
export function matchLocale(candidates: readonly string[]): Locale {
  for (const c of candidates) {
    const exact = IDS.find((id) => id.toLowerCase() === c.toLowerCase());
    if (exact) return exact as Locale;
  }
  for (const c of candidates) {
    const lang = c.slice(0, 2).toLowerCase();
    const first = IDS.find((id) => id.startsWith(lang));
    if (first) return first as Locale;
  }
  return DEFAULT_LOCALE;
}

// ---- Store (SSR rendert immer de-DE, echte Sprache nach Hydration) ----
let current: Locale = DEFAULT_LOCALE;
let explicit: Locale | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getLocale(): Locale {
  return current;
}
export function getExplicitLocale(): Locale | null {
  return explicit;
}

export function initLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    explicit = stored && IDS.includes(stored) ? (stored as Locale) : null;
  } catch {
    explicit = null;
  }
  current = explicit ?? matchLocale(navigator.languages ?? [navigator.language]);
  document.documentElement.lang = current;
  emit();
}

export function setLocale(locale: Locale | null) {
  explicit = locale;
  try {
    if (locale) localStorage.setItem(STORAGE_KEY, locale);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  current = locale ?? matchLocale(navigator.languages ?? [navigator.language]);
  document.documentElement.lang = current;
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Schweizer Orthographie: kein ß. */
export function swissify(locale: string, text: string) {
  return locale === "de-CH" ? text.replace(/ß/g, "ss") : text;
}

export function translate(locale: string, key: MessageKey, vars?: Record<string, string | number>) {
  let text = dicts[locale]?.[key] ?? (de as Record<string, string>)[key] ?? key;
  text = swissify(locale, text);
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
}

export function useT() {
  const locale = useLocale();
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );
  return { t, locale };
}

/** Name in gewünschter Sprache mit Rückfall: exakt → gleiche Sprache → Deutsch. */
export function pickName(names: Record<string, string> | undefined, locale: string, base: string) {
  if (names) {
    if (names[locale]) return names[locale];
    const lang = locale.slice(0, 2);
    if (lang !== "de") {
      const sibling = Object.keys(names).find((k) => k.startsWith(lang));
      if (sibling) return names[sibling]!;
    } else if (names["de-DE"]) {
      return swissify(locale, names["de-DE"]);
    }
  }
  return swissify(locale, base);
}
