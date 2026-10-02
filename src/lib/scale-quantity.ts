// Skaliert den Zahlenanteil einer Mengenangabe ("500 g" × 2 → "1000 g").
// Angaben ohne Zahl ("nach Geschmack") bleiben unverändert.
export function scaleQuantity(qty: string, factor: number): string {
  if (factor === 1) return qty;
  const m = qty.match(/^(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return qty;
  const n = parseFloat(m[1]!.replace(",", "."));
  if (!isFinite(n)) return qty;
  const scaled = n * factor;
  const rounded = Math.round(scaled * 100) / 100;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${str.replace(".", ",")}${m[2]}`;
}
