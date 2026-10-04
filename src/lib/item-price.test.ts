import { describe, it, expect } from "vitest";
import { priceForItem } from "./item-price";
const senf = { price: 2.4, pack_size: 200, pack_unit: "g", unit_price: 12, unit_basis: "kg" };
describe("priceForItem", () => {
  it("Gewicht über Packung", () => expect(priceForItem({ quantity: "400 g", unit: "gramm" }, { defaultQuantity: 1, defaultUnit: "glas" }, senf)).toBeCloseTo(4.8));
  it("ohne Leerzeichen", () => expect(priceForItem({ quantity: "400g", unit: "gramm" }, { defaultQuantity: 1, defaultUnit: "glas" }, senf)).toBeCloseTo(4.8));
  it("Stück = Packung", () => expect(priceForItem({ quantity: "3", unit: "flasche" }, { defaultQuantity: 1, defaultUnit: "flasche" }, { price: 2.9 })).toBeCloseTo(8.7));
  it("andere Stück-Einheit", () => expect(priceForItem({ quantity: "2", unit: "stueck" }, { defaultQuantity: 1, defaultUnit: "glas" }, senf)).toBeCloseTo(4.8));
  it("kg", () => expect(priceForItem({ quantity: "1,5 kg", unit: "kilogramm" }, { defaultQuantity: 1, defaultUnit: "kilogramm" }, { price: 2.5, pack_size: 1, pack_unit: "kg" })).toBeCloseTo(3.75));
  it("Ausreisser", () => expect(priceForItem({ quantity: "500 kg", unit: "kilogramm" }, { defaultQuantity: 200, defaultUnit: "gramm" }, { price: 2.4, pack_size: 200, pack_unit: "g" })).toBeNull());
});
