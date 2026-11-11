// Skaliert den Zahlenanteil einer Mengenangabe ("500 g" × 2 → "1000 g").
// Angaben ohne Zahl ("nach Geschmack") bleiben unverändert.
export function scaleQuantity(qty: string, factor: number, locale?: string): string {
  if (factor === 1) return qty;
  const m = qty.match(/^(\d+(?:[.,'’\u00a0\u202f ]\d+)*)(.*)$/);
  if (!m) return qty;
  const [, amount, suffix] = m;
  if (!amount) return qty;
  let normalized = amount.replace(/['’\u00a0\u202f ]/g, "");
  if (locale) {
    const parts = new Intl.NumberFormat(locale).formatToParts(1000.5);
    const group = parts.find((p) => p.type === "group")?.value;
    const decimal = parts.find((p) => p.type === "decimal")?.value;
    if (group) normalized = normalized.split(group).join("");
    if (decimal) normalized = normalized.replace(decimal, ".");
  } else {
    // Stored recipes may have been formatted in a different language.
    const comma = normalized.lastIndexOf(",");
    const dot = normalized.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
      const decimal = comma > dot ? "," : ".";
      normalized = normalized.split(decimal === "," ? "." : ",").join("").replace(decimal, ".");
    } else if (/^\d{1,3}(?:[.,]\d{3})+$/.test(normalized)) {
      normalized = normalized.replace(/[.,]/g, "");
    } else {
      normalized = normalized.replace(",", ".");
    }
  }
  const n = Number(normalized);
  if (!isFinite(n)) return qty;
  const scaled = n * factor;
  const rounded = Math.round(scaled * 100) / 100;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${str.replace(".", ",")}${suffix ?? ""}`;
}
