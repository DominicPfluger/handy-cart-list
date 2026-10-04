import { useCallback, useSyncExternalStore } from "react";
import { de, type MessageKey } from "./de";


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

/** Sprachcode, z. B. "de-DE". Neben den eingebauten Sprachen auch im Admin angelegte. */
export type Locale = string;
export type LocaleInfo = { id: string; label: string; flag: string };
export const DEFAULT_LOCALE: Locale = "de-DE";
/** Eingebaute Zielsprachen (ohne de-DE). Serverseitig kommen angelegte Sprachen aus app_locales dazu. */
export const TRANSLATED_LOCALES: string[] = LOCALES.map((l) => l.id).filter((l) => l !== "de-DE");
const STORAGE_KEY = "shoppi:locale";

const dicts: Record<string, Record<string, string>> = {};


// ---- Im Admin angelegte Sprachen (app_locales + ui_translations) ----
let extraLocales: LocaleInfo[] = [];
let localesVersion = 0;
const allIds = () => [...LOCALES.map((l) => l.id as string), ...extraLocales.map((l) => l.id)];
let cachedAll: LocaleInfo[] = [...LOCALES];
let cachedVersion = -1;
/** Alle wählbaren Sprachen: eingebaut + im Admin angelegt. */
export function allLocales(): LocaleInfo[] {
  if (cachedVersion !== localesVersion) { cachedAll = [...LOCALES, ...extraLocales]; cachedVersion = localesVersion; }
  return cachedAll;
}
const loadedDicts = new Set<string>();
// Eingebaute Sprachen liegen als eigene Chunks vor und werden erst bei Bedarf geladen.
const builtinDicts = import.meta.glob<{ default: Record<string, string> }>("./locales/*.json");

async function loadDict(locale: string) {
  if (dicts[locale]) return;
  if (loadedDicts.has(locale)) return;
  loadedDicts.add(locale);
  try {
    const builtin = builtinDicts[`./locales/${locale}.json`];
    if (builtin) {
      dicts[locale] = (await builtin()).default;
    } else {
      // Im Admin angelegte Sprache: Übersetzungen aus der Datenbank laden.
      const { supabase } = await import("@/integrations/supabase/client");
      const out: Record<string, string> = {};
      for (let f = 0; ; f += 1000) {
        const { data } = await supabase.from("ui_translations").select("key, text").eq("locale", locale).range(f, f + 999);
        for (const r of data ?? []) out[r.key] = r.text;
        if (!data || data.length < 1000) break;
      }
      dicts[locale] = out;
    }
  } catch {
    loadedDicts.delete(locale);
    return;
  }
  localesVersion++;
  emit();
}
/** Lädt angelegte Sprachen aus der Datenbank (nur im Browser). */
export async function loadExtraLocales(force = false) {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.from("app_locales").select("id, label, flag").order("label");
    const builtin = new Set(LOCALES.map((l) => l.id as string));
    extraLocales = (data ?? []).filter((l) => !builtin.has(l.id));
    if (force) loadedDicts.clear();
    localesVersion++;
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
    if (stored && !explicit && allIds().includes(stored)) { explicit = stored; current = stored; document.documentElement.lang = current; }
    if (extraLocales.some((l) => l.id === current)) await loadDict(current);
    emit();
  } catch { /* offline: eingebaute Sprachen genügen */ }
}

/** Wählt die passendste unterstützte Sprachvariante für eine Browsersprache. */
export function matchLocale(candidates: readonly string[]): Locale {
  for (const c of candidates) {
    const exact = allIds().find((id) => id.toLowerCase() === c.toLowerCase());
    if (exact) return exact as Locale;
  }
  for (const c of candidates) {
    const lang = c.slice(0, 2).toLowerCase();
    const first = allIds().find((id) => id.startsWith(lang));
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
    explicit = stored && allIds().includes(stored) ? (stored as Locale) : null;
  } catch {
    explicit = null;
  }
  current = explicit ?? matchLocale(navigator.languages ?? [navigator.language]);
  document.documentElement.lang = current;
  emit();
  void loadExtraLocales();
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
  if (extraLocales.some((l) => l.id === current)) void loadDict(current);
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
  let text = dicts[locale]?.[key] ?? (locale.startsWith("de") ? undefined : dicts["en-US"]?.[key]) ?? (de as Record<string, string>)[key] ?? key;
  text = swissify(locale, text);
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

const getVersion = () => localesVersion;
/** Alle Sprachen inkl. angelegter; aktualisiert sich nach dem Laden. */
export function useAllLocales(): LocaleInfo[] {
  useSyncExternalStore(subscribe, getVersion, () => 0);
  return allLocales();
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, () => DEFAULT_LOCALE);
}

export function useT() {
  const locale = useLocale();
  const version = useSyncExternalStore(subscribe, getVersion, () => 0);
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, version],
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
