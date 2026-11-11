import { describe, expect, test } from "bun:test";
import { scaleQuantity } from "./scale-quantity";

describe("recipe portion quantities", () => {
  for (const locale of ["de-DE", "en-US", "de-CH", "fr-CH", "en-AU"]) {
    test(`1000 g at two portions remains 2000 g in ${locale}`, () => {
      const amount = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(1000);
      expect(scaleQuantity(`${amount} g`, 2, locale)).toBe("2000 g");
    });
    test(`grouped decimal quantities retain their fraction in ${locale}`, () => {
      const amount = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(1234.5);
      expect(scaleQuantity(`${amount} g`, 2, locale)).toBe("2469 g");
    });
    test(`small decimal quantities are not treated as thousands in ${locale}`, () => {
      const amount = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(0.125);
      expect(scaleQuantity(`${amount} kg`, 2, locale)).toBe("0,25 kg");
    });
  }
  test("stored German and English grouped recipe amounts also scale correctly", () => {
    expect(scaleQuantity("1.000 g", 2)).toBe("2000 g");
    expect(scaleQuantity("1,000 g", 2)).toBe("2000 g");
    expect(scaleQuantity("1.234,5 g", 2)).toBe("2469 g");
    expect(scaleQuantity("1,234.5 g", 2)).toBe("2469 g");
  });
  test("one portion and nonnumeric instructions remain unchanged", () => {
    expect(scaleQuantity("1.000 g", 1, "de-DE")).toBe("1.000 g");
    expect(scaleQuantity("nach Geschmack", 2)).toBe("nach Geschmack");
    expect(scaleQuantity("500 g", 2)).toBe("1000 g");
    expect(scaleQuantity("1,5 kg", 2)).toBe("3 kg");
  });
});