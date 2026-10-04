const UNIT_SCALE: Record<string, { kind: string; factor: number }> = {
  gramm: { kind: "weight", factor: 1 }, kilogramm: { kind: "weight", factor: 1000 }, milligramm: { kind: "weight", factor: 0.001 },
  milliliter: { kind: "volume", factor: 1 }, deziliter: { kind: "volume", factor: 100 }, liter: { kind: "volume", factor: 1000 },
};

/** Preis eines Listeneintrags aus dem Richtpreis des Produkts umrechnen (null = nicht berechenbar). */
export function priceForItem(
  item: { quantity: string; unit: string },
  product: { defaultQuantity: number; defaultUnit: string },
  price: number,
): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  const match = /^\s*(\d+(?:[.,]\d+)?)(?:\s|$)/.exec(item.quantity);
  if (!match) return null;
  const amount = Number(match[1]?.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0 || product.defaultQuantity <= 0) return null;
  if (item.unit === product.defaultUnit) return price * amount / product.defaultQuantity;
  const from = item.unit ? UNIT_SCALE[item.unit] : undefined;
  const to = UNIT_SCALE[product.defaultUnit];
  return from && to && from.kind === to.kind ? price * amount * from.factor / (product.defaultQuantity * to.factor) : null;
}
