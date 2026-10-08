import { useSyncExternalStore } from "react";

export interface PronunciationRule {
  id: string;
  locale: string;
  written: string;
  spoken: string;
}

const STORAGE_KEY = "shoppi:pronunciation-rules";
const EVENT = "shoppi:pronunciation-rules-changed";
const EMPTY: PronunciationRule[] = [];

function readRules(): PronunciationRule[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter((rule): rule is PronunciationRule => {
      if (!rule || typeof rule !== "object") return false;
      const candidate = rule as Partial<PronunciationRule>;
      return typeof candidate.id === "string"
        && typeof candidate.locale === "string"
        && typeof candidate.written === "string"
        && typeof candidate.spoken === "string";
    });
  } catch {
    return EMPTY;
  }
}

let cachedRaw: string | null | undefined;
let cachedRules = EMPTY;

function snapshot(): PronunciationRule[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedRules;
  cachedRaw = raw;
  cachedRules = readRules();
  return cachedRules;
}

function subscribe(callback: () => void) {
  const notify = () => callback();
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function usePronunciationRules(): PronunciationRule[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function savePronunciationRules(rules: PronunciationRule[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(EVENT));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Ersetzt persönliche Schreibweisen nur für die Sprachausgabe, nie in der sichtbaren Produktbezeichnung. */
export function applyPronunciationRules(text: string, locale: string, rules: PronunciationRule[]): string {
  const applicable = rules
    .filter((rule) => rule.locale === locale && rule.written.trim() && rule.spoken.trim())
    .sort((a, b) => b.written.length - a.written.length);
  return applicable.reduce(
    (result, rule) => result.replace(new RegExp(escapeRegExp(rule.written.trim()), "giu"), rule.spoken.trim()),
    text,
  );
}