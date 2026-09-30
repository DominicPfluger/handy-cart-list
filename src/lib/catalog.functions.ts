import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface CatalogDepartment {
  id: string;
  parentId: string | null;
  name: string;
  emoji: string | null;
  color: string | null;
  imageUrl: string | null;
  sortOrder: number;
  /** Deutscher Ausgangsname */
  baseName: string;
  /** Übersetzungen je Sprachvariante */
  names: Record<string, string>;
}

export interface CatalogProduct {
  id: string;
  departmentId: string;
  name: string;
  emoji: string | null;
  imageUrl: string | null;
  defaultQuantity: number;
  defaultUnit: string;
  organicAvailable: boolean;
  variants: string[];
  /** Ernährungsformen, in denen das Produkt nicht erlaubt ist */
  excludedDiets: string[];
  sortOrder: number;
  baseName: string;
  names: Record<string, string>;
}

export interface CatalogHeading {
  id: string;
  departmentId: string;
  beforeProductId: string;
  name: string;
  baseName: string;
  names: Record<string, string>;
}

export interface Catalog {
  departments: CatalogDepartment[];
  products: CatalogProduct[];
  headings: CatalogHeading[];
}

export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });

  const [deptRes, prodRes, headRes] = await Promise.all([
    supabase
      .from("departments")
      .select("id, parent_id, name, emoji, color, image_path, sort_order")
      .order("sort_order", { ascending: true }),
    (async () => {
      // Produkte seitenweise laden (Limit 1000 Zeilen je Abfrage)
      const all: any[] = [];
      for (let from = 0; ; from += 1000) {
        const res = await supabase
          .from("products")
          .select(
            "id, department_id, name, emoji, image_path, default_quantity, default_unit, organic_available, variants, excluded_diets, sort_order",
          )
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + 999);
        if (res.error) return { data: null, error: res.error };
        all.push(...(res.data ?? []));
        if (!res.data || res.data.length < 1000) break;
      }
      return { data: all, error: null };
    })(),
    supabase.from("product_headings").select("id, department_id, before_product_id, name"),
  ]);

  // Übersetzungen seitenweise laden (Limit 1000 Zeilen je Abfrage)
  const names = new Map<string, Record<string, string>>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("catalog_translations")
      .select("entity_id, locale, name")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      const entry = names.get(row.entity_id) ?? {};
      entry[row.locale] = row.name;
      names.set(row.entity_id, entry);
    }
    if (!data || data.length < 1000) break;
  }

  if (deptRes.error) throw new Error(deptRes.error.message);
  if (prodRes.error) throw new Error(prodRes.error.message);

  const deptRows = (deptRes.data ?? []) as Array<Record<string, unknown>>;
  const prodRows = (prodRes.data ?? []) as Array<Record<string, unknown>>;

  // Signed URLs for any uploaded images (bucket is private).
  const paths = [
    ...deptRows.map((r) => r["image_path"] as string | null),
    ...prodRows.map((r) => r["image_path"] as string | null),
  ].filter((p): p is string => Boolean(p));

  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from("catalog-images")
      .createSignedUrls([...new Set(paths)], 60 * 60);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  return {
    departments: deptRows.map((r) => ({
      id: r["id"] as string,
      parentId: (r["parent_id"] as string | null) ?? null,
      name: r["name"] as string,
      emoji: (r["emoji"] as string | null) ?? null,
      color: (r["color"] as string | null) ?? null,
      imageUrl: signed.get(r["image_path"] as string) ?? null,
      sortOrder: (r["sort_order"] as number) ?? 0,
      baseName: r["name"] as string,
      names: names.get(r["id"] as string) ?? {},
    })),
    products: prodRows.map((r) => ({
      id: r["id"] as string,
      departmentId: r["department_id"] as string,
      name: r["name"] as string,
      emoji: (r["emoji"] as string | null) ?? null,
      imageUrl: signed.get(r["image_path"] as string) ?? null,
      defaultQuantity: Number(r["default_quantity"] ?? 1),
      defaultUnit: (r["default_unit"] as string) ?? "stueck",
      organicAvailable: (r["organic_available"] as boolean) ?? true,
      variants: (r["variants"] as string[] | null) ?? [],
      excludedDiets: (r["excluded_diets"] as string[] | null) ?? [],
      sortOrder: (r["sort_order"] as number) ?? 0,
      baseName: r["name"] as string,
      names: names.get(r["id"] as string) ?? {},
    })),
    headings: ((headRes.data ?? []) as Array<Record<string, string>>).map((r) => ({
      id: r["id"]!,
      departmentId: r["department_id"]!,
      beforeProductId: r["before_product_id"]!,
      name: r["name"]!,
      baseName: r["name"]!,
      names: names.get(r["id"]!) ?? {},
    })),
  };
});
