import { useSyncExternalStore } from "react";
import { getLocale, translate, swissify } from "../i18n";
import type { MessageKey } from "../i18n/de";

const BUILTIN_IDS = [
  "stueck", "artikel", "gramm", "kilogramm", "milligramm", "pfund", "unzen", "milliliter", "deziliter",
  "liter", "gallone", "tasse", "glas", "flasche", "dose", "beutel", "packung", "schachtel",
  "box", "karton", "kiste", "kanister", "buendel", "portion", "sack", "eimer", "becher",
  "tube", "netz", "palette", "tablett", "rolle", "blister", "sixpack",
] as const;

export type UnitId = string;
export type UnitLabels = Record<string, { label?: string; short?: string }>;
export type UnitRow = { id: string; sort_order: number; enabled: boolean; builtin: boolean; labels: UnitLabels };

// ---- Store: Einheiten aus der Datenbank (Reihenfolge, Sichtbarkeit, eigene Bezeichnungen) ----
let rows: UnitRow[] = BUILTIN_IDS.map((id, i) => ({ id, sort_order: i + 1, enabled: true, builtin: true, labels: {} }));
let byId = new Map(rows.map((r) => [r.id, r]));
let version = 0;
const listeners = new Set<() => void>();
const emit = () => { version++; listeners.forEach((l) => l()); };

export async function loadUnits(): Promise<UnitRow[]> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await (supabase as any).from("units").select("id, sort_order, enabled, builtin, labels").order("sort_order");
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

function labelOf(id: string, locale: string, kind: "label" | "short"): string {
  const r = byId.get(id);
  const own = r?.labels?.[locale]?.[kind] ?? (locale.startsWith("de") ? r?.labels?.["de-DE"]?.[kind] : undefined);
  if (own) return swissify(locale, own);
  if ((BUILTIN_IDS as readonly string[]).includes(id)) return translate(locale, `${kind === "label" ? "unit" : "unitS"}.${id}` as MessageKey);
  return swissify(locale, r?.labels?.["en-US"]?.[kind] ?? r?.labels?.["de-DE"]?.[kind] ?? id);
}

export function unitLabel(id: string, locale: string = getLocale()) { return labelOf(id, locale, "label"); }

/** Sichtbare Einheiten in Admin-Reihenfolge mit Bezeichnungen in der aktuellen Sprache. */
export function getUnits(locale: string = getLocale()) {
  return rows.filter((r) => r.enabled).map((r) => ({
    id: r.id,
    label: labelOf(r.id, locale, "label"),
    short: labelOf(r.id, locale, "short"),
  }));
}

export function unitShort(id: string | undefined, locale: string = getLocale()): string {
  if (!id || !byId.has(id)) return "";
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
