type Scale = { kind: "weight" | "volume"; factor: number };

/** App-Einheiten und Import-Kürzel → Basis (g bzw. ml). */
const UNIT_SCALE: Record<string, Scale> = {
  gramm: { kind: "weight", factor: 1 }, kilogramm: { kind: "weight", factor: 1000 }, milligramm: { kind: "weight", factor: 0.001 },
  pfund: { kind: "weight", factor: 453.6 }, unzen: { kind: "weight", factor: 28.35 },
  milliliter: { kind: "volume", factor: 1 }, deziliter: { kind: "volume", factor: 100 }, liter: { kind: "volume", factor: 1000 },
  gallone: { kind: "volume", factor: 3785 },
  g: { kind: "weight", factor: 1 }, kg: { kind: "weight", factor: 1000 }, mg: { kind: "weight", factor: 0.001 },
  "100g": { kind: "weight", factor: 100 }, lb: { kind: "weight", factor: 453.6 }, oz: { kind: "weight", factor: 28.35 },
  ml: { kind: "volume", factor: 1 }, cl: { kind: "volume", factor: 10 }, dl: { kind: "volume", factor: 100 },
  l: { kind: "volume", factor: 1000 }, "100ml": { kind: "volume", factor: 100 },
};
const scaleOf = (u: string | null | undefined) => (u ? UNIT_SCALE[u.trim().toLowerCase().replace(/\s+/g, "")] : undefined);

export type PriceRow = { price: number | string; pack_size?: number | string | null; pack_unit?: string | null; unit_price?: number | string | null; unit_basis?: string | null };

/** Menge am Anfang lesen: "2", "1,5 kg", "500g". */
export function parseAmount(q: string): number | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)/.exec(q);
  if (!m) return null;
  const n = Number(m[1]!.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Preis eines Listeneintrags aus dem Richtpreis (Packungspreis) umrechnen; null = nicht berechenbar. */
export function priceForItem(
  item: { quantity: string; unit: string },
  product: { defaultQuantity: number; defaultUnit: string },
  ref: PriceRow | number,
): number | null {
  const row: PriceRow = typeof ref === "number" ? { price: ref } : ref;
  const price = Number(row.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const amount = parseAmount(item.quantity);
  if (amount === null) return null;

  const result = (() => {
    const from = scaleOf(item.unit);
    if (from) {
      // 1. Packungsgrösse
      const pack = scaleOf(row.pack_unit);
      const packSize = Number(row.pack_size);
      if (pack && pack.kind === from.kind && packSize > 0) return price * (amount * from.factor) / (packSize * pack.factor);
      // 2. Grundpreis
      const basis = scaleOf(row.unit_basis);
      const up = Number(row.unit_price);
      if (basis && basis.kind === from.kind && up > 0) return up * (amount * from.factor) / basis.factor;
      // 3. Standardmenge des Produkts
      const def = scaleOf(product.defaultUnit);
      if (def && def.kind === from.kind && product.defaultQuantity > 0) return price * (amount * from.factor) / (product.defaultQuantity * def.factor);
      return null;
    }
    // Stück-artige Einheit (oder keine): gleiche Einheit wie Standard → Anteil daran, sonst 1 Packung je Stück
    if (item.unit && item.unit === product.defaultUnit && product.defaultQuantity > 0) return price * amount / product.defaultQuantity;
    if (scaleOf(product.defaultUnit) && !scaleOf(row.pack_unit)) return null;
    return price * amount;
  })();
  if (result === null || !Number.isFinite(result) || result <= 0) return null;
  return result > price * 50 ? null : result;
}
