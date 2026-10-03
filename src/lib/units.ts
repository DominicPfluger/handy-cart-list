import { getLocale, translate } from "../i18n";
import type { MessageKey } from "../i18n/de";

const UNIT_IDS = [
  "stueck", "artikel", "gramm", "kilogramm", "milligramm", "pfund", "unzen", "milliliter", "deziliter",
  "liter", "gallone", "tasse", "glas", "flasche", "dose", "beutel", "packung", "schachtel",
  "box", "karton", "kiste", "kanister", "buendel", "portion", "sack", "eimer", "becher",
  "tube", "netz", "palette", "tablett", "rolle", "blister", "sixpack",
] as const;

export type UnitId = (typeof UNIT_IDS)[number];

/** Einheiten mit Bezeichnungen in der aktuellen Sprache. */
export function getUnits(locale: string = getLocale()) {
  return UNIT_IDS.map((id) => ({
    id,
    label: translate(locale, `unit.${id}` as MessageKey),
    short: translate(locale, `unitS.${id}` as MessageKey),
  }));
}

export function unitShort(id: string | undefined, locale: string = getLocale()): string {
  if (!id || !(UNIT_IDS as readonly string[]).includes(id)) return "";
  return translate(locale, `unitS.${id}` as MessageKey);
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
