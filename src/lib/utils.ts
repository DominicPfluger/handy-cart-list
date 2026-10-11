import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Preserve the initial casing chosen in the variant editor across translations. */
export function variantDisplayName(variant: string, localizedName: string): string {
  const initial = Array.from(variant.trim())[0];
  const letters = Array.from(localizedName);
  const first = letters[0];
  if (!initial || !first || initial.toLocaleLowerCase() === initial.toLocaleUpperCase()) return localizedName;
  letters[0] = initial === initial.toLocaleLowerCase()
    ? first.toLocaleLowerCase()
    : first.toLocaleUpperCase();
  return letters.join("");
}

/** Setzt Produkt und Variante zusammen: vorangestellt „Variante-Produkt“, sonst „Produkt Variante“; weitere Zusätze (Marke) bleiben mit „ · “. */
export function joinVariantName(
  base: string,
  rest: string,
  product?: { replaceVariants?: string[]; prefixVariants?: string[]; prefixVariantsByLocale?: Record<string, string[]>; variantNames?: Record<string, Record<string, string>> },
  locale?: string,
): string {
  if (!rest) return base;
  const [variant, ...extra] = rest.split(" · ");
  const v = (variant ?? "").trim();
  const lower = v.toLocaleLowerCase();
  const prefix = prefixListFor(product, locale).some((p) =>
    p.toLocaleLowerCase() === lower || Object.values(product?.variantNames?.[p] ?? {}).some((n) => n.toLocaleLowerCase() === lower));
  const match = (p: string) => p.toLocaleLowerCase() === lower || Object.values(product?.variantNames?.[p] ?? {}).some((n) => n.toLocaleLowerCase() === lower);
  void prefix; void match;
  const head = v || base;
  return [head, ...extra].join(" · ");
}

/** Vorangestellte Varianten für eine Sprache: eigene Einstellung der Sprache, sonst Standard. */
export function prefixListFor(
  product: { prefixVariants?: string[]; prefixVariantsByLocale?: Record<string, string[]> } | undefined,
  locale?: string,
): string[] {
  const by = product?.prefixVariantsByLocale ?? {};
  if (locale && by[locale]) return by[locale]!;
  return product?.prefixVariants ?? [];
}
