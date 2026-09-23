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
  sortOrder: number;
}

export interface Catalog {
  departments: CatalogDepartment[];
  products: CatalogProduct[];
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

  const [deptRes, prodRes] = await Promise.all([
    supabase
      .from("departments")
      .select("id, parent_id, name, emoji, color, image_path, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, department_id, name, emoji, image_path, default_quantity, default_unit, organic_available, sort_order",
      )
      .order("sort_order", { ascending: true }),
  ]);

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
      sortOrder: (r["sort_order"] as number) ?? 0,
    })),
  };
});
