import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Setzt Produkt und Variante zusammen: vorangestellt „Variante-Produkt“, sonst „Produkt Variante“; weitere Zusätze (Marke) bleiben mit „ · “. */
export function joinVariantName(
  base: string,
  rest: string,
  product?: { prefixVariants?: string[]; variantNames?: Record<string, Record<string, string>> },
): string {
  if (!rest) return base;
  const [variant, ...extra] = rest.split(" · ");
  const v = (variant ?? "").trim();
  const lower = v.toLocaleLowerCase();
  const prefix = (product?.prefixVariants ?? []).some((p) =>
    p.toLocaleLowerCase() === lower || Object.values(product?.variantNames?.[p] ?? {}).some((n) => n.toLocaleLowerCase() === lower));
  const head = !v ? base : prefix ? `${v}-${base}` : `${base} ${v}`;
  return [head, ...extra].join(" · ");
}
