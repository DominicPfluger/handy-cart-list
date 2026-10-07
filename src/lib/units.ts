import { useSyncExternalStore } from "react";
import { getLocale, translate, swissify } from "../i18n";
import type { MessageKey } from "../i18n/de";
import { currentMarket } from "../hooks/use-market";

const BUILTIN_IDS = [
  "stueck", "artikel", "gramm", "kilogramm", "milligramm", "pfund", "unzen", "milliliter", "deziliter",
  "liter", "gallone", "tasse", "glas", "flasche", "dose", "beutel", "packung", "schachtel",
  "box", "karton", "kiste", "kanister", "buendel", "portion", "sack", "eimer", "becher",
  "tube", "netz", "palette", "tablett", "rolle", "blister", "sixpack",
] as const;

export type UnitId = string;
export type UnitLabels = Record<string, { label?: string; short?: string }>;
export type UnitRow = { id: string; sort_order: number; enabled: boolean; builtin: boolean; labels: UnitLabels; hidden_markets?: string[] };

// ---- Store: Einheiten aus der Datenbank (Reihenfolge, Sichtbarkeit, eigene Bezeichnungen) ----
let rows: UnitRow[] = BUILTIN_IDS.map((id, i) => ({ id, sort_order: i + 1, enabled: true, builtin: true, labels: {} }));
let byId = new Map(rows.map((r) => [r.id, r]));
let version = 0;
const listeners = new Set<() => void>();
const emit = () => { version++; listeners.forEach((l) => l()); };

export async function loadUnits(): Promise<UnitRow[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await (supabase as any).from("units").select("id, sort_order, enabled, builtin, labels, hidden_markets").order("sort_order");
    if (data && data.length) {
      rows = data as UnitRow[];
      byId = new Map(rows.map((r) => [r.id, r]));
      emit();
    }
  } catch { /* offline: eingebaute Liste */ }
  return rows;
}

export function useUnitsVersion() {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => version, () => 0);
}

export function allUnitRows() { return rows; }

// ---- Persönliche Einheiten (geräte-lokal): eigene Einheiten, Reihenfolge, Ausblendungen ----
export type UserUnitPrefs = { order: string[]; hidden: string[]; custom: { id: string; label: string; short: string }[] };
const PREFS_KEY = "shoppi:user-units";
let prefs: UserUnitPrefs | null = null;
function getPrefs(): UserUnitPrefs {
  if (prefs) return prefs;
  const empty = { order: [], hidden: [], custom: [] };
  if (typeof window === "undefined") return empty;
  try { prefs = { ...empty, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") }; } catch { prefs = empty; }
  return prefs!;
}
export function userUnitPrefs() { return getPrefs(); }
export function setUserUnitPrefs(next: UserUnitPrefs) {
  prefs = next;
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* voll */ }
  emit();
}
function customOf(id: string) { return getPrefs().custom.find((c) => c.id === id); }

function labelOf(id: string, locale: string, kind: "label" | "short"): string {
  const c = customOf(id);
  if (c) return c[kind];
  const r = byId.get(id);
  const own = r?.labels?.[locale]?.[kind] ?? (locale.startsWith("de") ? r?.labels?.["de-DE"]?.[kind] : undefined);
  if (own) return swissify(locale, own);
  if ((BUILTIN_IDS as readonly string[]).includes(id)) return translate(locale, `${kind === "label" ? "unit" : "unitS"}.${id}` as MessageKey);
  return swissify(locale, r?.labels?.["en-US"]?.[kind] ?? r?.labels?.["de-DE"]?.[kind] ?? id);
}

export function unitLabel(id: string, locale: string = getLocale()) { return labelOf(id, locale, "label"); }

/** Alle für den Markt verfügbaren Einheiten (inkl. eigener) in persönlicher Reihenfolge, ohne Ausblend-Filter. */
export function userUnitList(locale: string = getLocale()) {
  const m = currentMarket();
  const p = getPrefs();
  const ids = [
    ...rows.filter((r) => r.enabled && !(r.hidden_markets ?? []).includes(m)).map((r) => r.id),
    ...p.custom.map((c) => c.id),
  ];
  const rank = (id: string) => { const i = p.order.indexOf(id); return i < 0 ? 10000 + ids.indexOf(id) : i; };
  return [...ids].sort((a, b) => rank(a) - rank(b)).map((id) => ({
    id, label: labelOf(id, locale, "label"), short: labelOf(id, locale, "short"),
    custom: !!customOf(id), hidden: p.hidden.includes(id),
  }));
}

/** Sichtbare Einheiten in persönlicher bzw. Admin-Reihenfolge mit Bezeichnungen in der aktuellen Sprache. */
export function getUnits(locale: string = getLocale(), keep?: string) {
  const list = userUnitList(locale).filter((u) => !u.hidden || u.id === keep);
  if (keep && !list.some((u) => u.id === keep) && byId.has(keep)) {
    list.push({ id: keep, label: labelOf(keep, locale, "label"), short: labelOf(keep, locale, "short"), custom: false, hidden: false });
  }
  return list.map(({ id, label, short }) => ({ id, label, short }));
}

export function unitShort(id: string | undefined, locale: string = getLocale()): string {
  if (!id || (!byId.has(id) && !customOf(id))) return "";
  return labelOf(id, locale, "short");
}

/** "500 g" / "2 Stk." in der aktuellen Sprache */
export function formatQuantity(quantity: number | string, unit?: string, locale: string = getLocale()): string {
  const q = typeof quantity === "number" ? quantity : Number(quantity);
  const num = Number.isFinite(q)
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(q)
    : String(quantity);
  const short = unitShort(unit, locale);
  return short ? `${num} ${short}` : num;
}

/** Gespeicherte Mengenangabe (z. B. "1,5 kg") in der aktuellen Sprache neu formatieren. */
export function relocalizeQuantity(stored: string, unit?: string): string {
  const m = /^\s*([\d.,]+)/.exec(stored);
  if (!m || !unit) return stored;
  const n = Number(m[1]!.replace(",", "."));
  return Number.isFinite(n) ? formatQuantity(n, unit) : stored;
}
