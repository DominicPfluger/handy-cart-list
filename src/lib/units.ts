export const UNITS = [
  { id: "stueck", label: "Stück", short: "Stk." },
  { id: "gramm", label: "Gramm", short: "g" },
  { id: "kilogramm", label: "Kilogramm", short: "kg" },
  { id: "milligramm", label: "Milligramm", short: "mg" },
  { id: "pfund", label: "Pfund", short: "Pfd." },
  { id: "unzen", label: "Unzen", short: "oz" },
  { id: "milliliter", label: "Milliliter", short: "ml" },
  { id: "deziliter", label: "Deziliter", short: "dl" },
  { id: "liter", label: "Liter", short: "l" },
  { id: "gallone", label: "Gallone", short: "gal" },
  { id: "tasse", label: "Tasse", short: "Tasse" },
  { id: "glas", label: "Glas", short: "Glas" },
  { id: "flasche", label: "Flasche", short: "Fl." },
  { id: "dose", label: "Dose", short: "Dose" },
  { id: "beutel", label: "Beutel", short: "Beutel" },
  { id: "packung", label: "Packung", short: "Pkg." },
  { id: "schachtel", label: "Schachtel", short: "Schachtel" },
  { id: "box", label: "Box", short: "Box" },
  { id: "karton", label: "Karton", short: "Karton" },
  { id: "kiste", label: "Kiste", short: "Kiste" },
  { id: "kanister", label: "Kanister", short: "Kanister" },
  { id: "buendel", label: "Bündel", short: "Bund" },
] as const;

export type UnitId = (typeof UNITS)[number]["id"];

export function unitShort(id: string | undefined): string {
  return UNITS.find((u) => u.id === id)?.short ?? "";
}

/** "500 g" / "2 Stk." */
export function formatQuantity(quantity: number | string, unit?: string): string {
  const q = typeof quantity === "number" ? quantity : Number(quantity);
  const num = Number.isFinite(q) ? String(q).replace(".", ",") : String(quantity);
  const short = unitShort(unit);
  return short ? `${num} ${short}` : num;
}
