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
  /** Länderküchen, in denen das Produkt typisch ist */
  cuisineIds: string[];
  /** Verbreitete Handelsmarken; markets leer = alle Länder (Ländercodes wie CH, DE) */
  brands: { name: string; markets: string[] }[];
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

export interface CatalogCuisine {
  id: string;
  name: string;
  emoji: string | null;
  sortOrder: number;
  baseName: string;
  names: Record<string, string>;
}

export interface RecipeIngredient {
  templateId: string;
  stepKey: string;
  productId: string;
  sortOrder: number;
  groupId: string | null;
}

export interface DepartmentAlias {
  departmentId: string;
  parentId: string;
  sortOrder: number;
}

export interface ProductAlias {
  productId: string;
  departmentId: string;
  sortOrder: number;
}

export interface RecipeGroup {
  id: string;
  parentId: string | null;
  name: string;
  emoji: string | null;
  sortOrder: number;
  baseName: string;
  names: Record<string, string>;
}

export interface Catalog {
  departments: CatalogDepartment[];
  products: CatalogProduct[];
  headings: CatalogHeading[];
  cuisines: CatalogCuisine[];
  recipeIngredients: RecipeIngredient[];
  recipeGroups: RecipeGroup[];
  departmentAliases: DepartmentAlias[];
  productAliases: ProductAlias[];
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

  // Alle Seiten (je 1000 Zeilen) parallel statt nacheinander laden – deutlich schneller.
  const PAGE = 1000;
  async function fetchAll(table: string, columns: string, orders: string[]) {
    const head = await supabase.from(table).select("id", { count: "exact", head: true });
    if (head.error) return { data: null as any[] | null, error: head.error };
    const pages = Math.max(1, Math.ceil((head.count ?? 0) / PAGE) + 1);
    const results = await Promise.all(
      Array.from({ length: pages }, (_, i) => {
        let q = supabase.from(table).select(columns);
        for (const o of orders) q = q.order(o, { ascending: true });
        return q.range(i * PAGE, i * PAGE + PAGE - 1);
      }),
    );
    const all: any[] = [];
    for (const res of results) {
      if (res.error) return { data: null, error: res.error };
      all.push(...((res.data as any[]) ?? []));
    }
    return { data: all, error: null };
  }

  const [deptRes, prodRes, headRes, trRes, cuiRes, pcRes, brRes, riRes, rgRes, daRes, paRes] = await Promise.all([
    supabase
      .from("departments")
      .select("id, parent_id, name, emoji, color, image_path, sort_order")
      .order("sort_order", { ascending: true }),
    fetchAll(
      "products",
      "id, department_id, name, emoji, image_path, default_quantity, default_unit, organic_available, variants, excluded_diets, sort_order",
      ["sort_order", "id"],
    ),
    supabase.from("product_headings").select("id, department_id, before_product_id, name"),
    fetchAll("catalog_translations", "entity_id, locale, name", ["id"]),
    supabase.from("cuisines").select("id, name, emoji, sort_order").order("sort_order", { ascending: true }),
    fetchAll("product_cuisines", "product_id, cuisine_id", ["id"]),
    fetchAll("product_brands", "product_id, name, locales, sort_order", ["sort_order", "id"]),
    fetchAll("recipe_ingredients", "template_id, step_key, product_id, sort_order, group_id", ["sort_order", "id"]),
    supabase.from("recipe_groups").select("id, parent_id, name, emoji, sort_order").order("sort_order", { ascending: true }),
    supabase.from("department_aliases").select("department_id, parent_id, sort_order").order("sort_order", { ascending: true }),
    fetchAll("product_aliases", "product_id, department_id, sort_order", ["sort_order", "id"]),
  ]);
  const brandsByProduct = new Map<string, { name: string; markets: string[] }[]>();
  for (const r of (brRes.data ?? []) as Array<{ product_id: string; name: string; locales: string[] | null }>) {
    const list = brandsByProduct.get(r.product_id) ?? [];
    list.push({ name: r.name, markets: r.locales ?? [] });
    brandsByProduct.set(r.product_id, list);
  }
  const cuisineIdsByProduct = new Map<string, string[]>();
  for (const r of (pcRes.data ?? []) as Array<{ product_id: string; cuisine_id: string }>) {
    cuisineIdsByProduct.set(r.product_id, [...(cuisineIdsByProduct.get(r.product_id) ?? []), r.cuisine_id]);
  }

  if (trRes.error) throw new Error(trRes.error.message);
  const names = new Map<string, Record<string, string>>();
  for (const row of trRes.data ?? []) {
    const entry = names.get(row.entity_id) ?? {};
    entry[row.locale] = row.name;
    names.set(row.entity_id, entry);
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
      cuisineIds: cuisineIdsByProduct.get(r["id"] as string) ?? [],
      brands: brandsByProduct.get(r["id"] as string) ?? [],
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
    cuisines: ((cuiRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r["id"] as string,
      name: r["name"] as string,
      emoji: (r["emoji"] as string | null) ?? null,
      sortOrder: (r["sort_order"] as number) ?? 0,
      baseName: r["name"] as string,
      names: names.get(r["id"] as string) ?? {},
    })),
    recipeIngredients: ((riRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      templateId: r["template_id"] as string,
      stepKey: r["step_key"] as string,
      productId: r["product_id"] as string,
      sortOrder: (r["sort_order"] as number) ?? 0,
      groupId: (r["group_id"] as string | null) ?? null,
    })),
    recipeGroups: ((rgRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: r["id"] as string,
      parentId: (r["parent_id"] as string | null) ?? null,
      name: r["name"] as string,
      emoji: (r["emoji"] as string | null) ?? null,
      sortOrder: (r["sort_order"] as number) ?? 0,
      baseName: r["name"] as string,
      names: names.get(r["id"] as string) ?? {},
    })),
    departmentAliases: ((daRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      departmentId: r["department_id"] as string,
      parentId: r["parent_id"] as string,
      sortOrder: (r["sort_order"] as number) ?? 0,
    })),
    productAliases: ((paRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      productId: r["product_id"] as string,
      departmentId: r["department_id"] as string,
      sortOrder: (r["sort_order"] as number) ?? 0,
    })),
  };
});
