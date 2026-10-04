import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export interface CatalogDepartment {
  id: string;
  parentId: string | null;
  name: string;
  emoji: string | null;
  color: string | null;
  /** Pfad im Bild-Speicher; signierte Adresse via getCatalogImageUrls */
  imagePath?: string | null;
  imageUrl: string | null;
  iconPath?: string | null;
  iconUrl?: string | null;
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
  /** Pfad im Bild-Speicher; signierte Adresse via getCatalogImageUrls */
  imagePath?: string | null;
  imageUrl: string | null;
  iconPath?: string | null;
  iconUrl?: string | null;
  defaultQuantity: number;
  defaultUnit: string;
  organicAvailable: boolean;
  variants: string[];
  /** Suchbegriffe wie „Passionsfrucht" für Maracuja (alle Sprachen) */
  synonyms?: string[];
  /** Übersetzte Varianten: Variante → { locale: Name } */
  variantNames: Record<string, Record<string, string>>;
  /** Bilder je Variante: Pfade aus der DB, Adressen werden im Client aufgelöst */
  variantImages?: Record<string, { imagePath: string | null; iconPath: string | null; imageUrl?: string | null; iconUrl?: string | null }>;
  /** Ernährungsformen, in denen das Produkt nicht erlaubt ist */
  excludedDiets: string[];
  /** Länderküchen, in denen das Produkt typisch ist */
  cuisineIds: string[];
  /** Verbreitete Handelsmarken; markets leer = alle Länder (Ländercodes wie CH, DE) */
  brands: { name: string; markets: string[] }[];
  /** Leer = global; sonst nur in diesen Märkten (z. B. ["CH"]) */
  markets?: string[];
  /** Märkte, in denen das globale Produkt ausgeblendet ist */
  excludedMarkets?: string[];
  /** Sortierung je Markt (überschreibt sortOrder) */
  marketOrder?: Record<string, number>;
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
  templateId: string;
  parentId: string | null;
  name: string;
  emoji: string | null;
  sortOrder: number;
  baseName: string;
  names: Record<string, string>;
}

export interface RecipeTemplateRow {
  id: string;
  emoji: string | null;
  color: string | null;
  sortOrder: number;
  enabled: boolean;
  baseName: string;
  /** Anzeigename eigener Vorlagen (= Kennung, wenn keine Übersetzung existiert). */
  name: string;
  names: Record<string, string>;
}

export interface RecipeStepRow {
  id: string;
  templateId: string;
  key: string;
  name: string;
  emoji: string | null;
  min: number;
  max: number;
  required: boolean;
  sortOrder: number;
  baseName: string;
  names: Record<string, string>;
}

export interface RecipePopularRow {
  id: string;
  templateId: string;
  picks: Record<string, string[]>;
  sortOrder: number;
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
  recipeTemplates: RecipeTemplateRow[];
  recipeSteps: RecipeStepRow[];
  recipePopular: RecipePopularRow[];
}

/** Basis-Katalog (schneller erster Bildschirm): Struktur, Produkte, Überschriften, Aliasse, Übersetzungen. */
export interface CatalogCore {
  departments: CatalogDepartment[];
  products: CatalogProduct[];
  headings: CatalogHeading[];
  departmentAliases: DepartmentAlias[];
  productAliases: ProductAlias[];
}

/** Nachgeladene Details: Länderküchen, Marken, Synonyme, Varianten, Rezepte. */
export interface CatalogDetails {
  cuisines: CatalogCuisine[];
  recipeIngredients: RecipeIngredient[];
  recipeGroups: RecipeGroup[];
  recipeTemplates: RecipeTemplateRow[];
  recipeSteps: RecipeStepRow[];
  recipePopular: RecipePopularRow[];
  /** productId → Suchbegriffe */
  synonyms: Record<string, string[]>;
  /** productId → Variante → locale → Name */
  variantNames: Record<string, Record<string, Record<string, string>>>;
  /** productId → Variante → Bildpfade */
  variantImages: Record<string, Record<string, { imagePath: string | null; iconPath: string | null }>>;
  /** productId → Länderküchen-IDs */
  cuisineIds: Record<string, string[]>;
  /** productId → Marken */
  brands: Record<string, { name: string; markets: string[] }[]>;
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient(url, key, {
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
}

/** Nur die signierten Bild-Adressen (leichtgewichtig; wird häufiger erneuert als der Katalog). */
export const getCatalogImageUrls = createServerFn({ method: "GET" }).handler(async (): Promise<Record<string, string>> => {
  const supabase = publicClient();
  const [deptRes, prodRes, varRes] = await Promise.all([
    supabase.from("departments").select("image_path, icon_path").or("image_path.not.is.null,icon_path.not.is.null"),
    supabase.from("products").select("image_path, icon_path").or("image_path.not.is.null,icon_path.not.is.null"),
    supabase.from("product_variant_images").select("image_path, icon_path"),
  ]);
  const paths = [
    ...((deptRes.data ?? []) as Array<{ image_path: string | null; icon_path: string | null }>).flatMap((r) => [r.image_path, r.icon_path]),
    ...((prodRes.data ?? []) as Array<{ image_path: string | null; icon_path: string | null }>).flatMap((r) => [r.image_path, r.icon_path]),
    ...((varRes.data ?? []) as Array<{ image_path: string | null; icon_path: string | null }>).flatMap((r) => [r.image_path, r.icon_path]),
  ].filter((p): p is string => Boolean(p));
  const out: Record<string, string> = {};
  if (paths.length > 0) {
    const { data } = await supabase.storage.from("catalog-images").createSignedUrls([...new Set(paths)], 60 * 60);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) out[entry.path] = entry.signedUrl;
    }
  }
  return out;
});

/** Alle Seiten (je 1000 Zeilen) parallel statt nacheinander laden – deutlich schneller. */
const PAGE = 1000;
async function fetchAll(supabase: ReturnType<typeof publicClient>, table: string, columns: string, orders: string[], localeCol?: string, locale?: string | null) {
  const head = await supabase.from(table).select("id", { count: "exact", head: true });
  if (head.error) return { data: null as any[] | null, error: head.error };
  const pages = Math.max(1, Math.ceil((head.count ?? 0) / PAGE) + 1);
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) => {
      let q = supabase.from(table).select(columns);
      if (localeCol && locale) q = q.eq(localeCol, locale);
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

async function loadTranslations(supabase: ReturnType<typeof publicClient>, locale: string | null): Promise<Map<string, Record<string, string>>> {
  const trRes = await fetchAll(supabase, "catalog_translations", "entity_id, locale, name", ["id"], "locale", locale);
  if (trRes.error) throw new Error(trRes.error.message);
  const names = new Map<string, Record<string, string>>();
  for (const row of trRes.data ?? []) {
    const entry = names.get(row.entity_id) ?? {};
    entry[row.locale] = row.name;
    names.set(row.entity_id, entry);
  }
  return names;
}

/** Basis-Katalog für den ersten Bildschirm: Abteilungen, Produkte (Grundfelder), Überschriften, Aliasse, Übersetzungen. */
export const getCatalogCore = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => (data ?? {}) as { locale?: string })
  .handler(async ({ data: input }): Promise<CatalogCore> => {
    const locale = typeof input?.locale === "string" && input.locale ? input.locale : null;
    const supabase = publicClient();

    const [deptRes, prodRes, headRes, daRes, paRes, exRes, moRes, names] = await Promise.all([
      supabase
        .from("departments")
        .select("id, parent_id, name, emoji, color, image_path, icon_path, sort_order")
        .order("sort_order", { ascending: true }),
      fetchAll(
        supabase,
        "products",
        "id, department_id, name, emoji, image_path, icon_path, default_quantity, default_unit, organic_available, variants, excluded_diets, markets, sort_order",
        ["sort_order", "id"],
      ),
      supabase.from("product_headings").select("id, department_id, before_product_id, name"),
      supabase.from("department_aliases").select("department_id, parent_id, sort_order").order("sort_order", { ascending: true }),
      fetchAll(supabase, "product_aliases", "product_id, department_id, sort_order", ["sort_order", "id"]),
      fetchAll(supabase, "product_market_exclusions", "product_id, market", ["id"]),
      fetchAll(supabase, "product_market_order", "product_id, market, sort_order", ["id"]),
      loadTranslations(supabase, locale),
    ]);

    const excluded = new Map<string, string[]>();
    for (const r of (exRes.data ?? []) as Array<{ product_id: string; market: string }>) excluded.set(r.product_id, [...(excluded.get(r.product_id) ?? []), r.market]);
    const marketOrder = new Map<string, Record<string, number>>();
    for (const r of (moRes.data ?? []) as Array<{ product_id: string; market: string; sort_order: number }>) marketOrder.set(r.product_id, { ...(marketOrder.get(r.product_id) ?? {}), [r.market]: r.sort_order });

    if (deptRes.error) throw new Error(deptRes.error.message);
    if (prodRes.error) throw new Error(prodRes.error.message);

    const deptRows = (deptRes.data ?? []) as Array<Record<string, unknown>>;
    const prodRows = (prodRes.data ?? []) as Array<Record<string, unknown>>;

    // Bilder: nur den Pfad liefern; signierte Adressen holt getCatalogImageUrls separat.
    return {
      departments: deptRows.map((r) => ({
        id: r["id"] as string,
        parentId: (r["parent_id"] as string | null) ?? null,
        name: r["name"] as string,
        emoji: (r["emoji"] as string | null) ?? null,
        color: (r["color"] as string | null) ?? null,
        imagePath: (r["image_path"] as string | null) ?? null,
        imageUrl: null,
        iconPath: (r["icon_path"] as string | null) ?? null,
        iconUrl: null,
        sortOrder: (r["sort_order"] as number) ?? 0,
        baseName: r["name"] as string,
        names: names.get(r["id"] as string) ?? {},
      })),
      products: prodRows.map((r) => ({
        id: r["id"] as string,
        departmentId: r["department_id"] as string,
        name: r["name"] as string,
        emoji: (r["emoji"] as string | null) ?? null,
        imagePath: (r["image_path"] as string | null) ?? null,
        imageUrl: null,
        iconPath: (r["icon_path"] as string | null) ?? null,
        iconUrl: null,
        defaultQuantity: Number(r["default_quantity"] ?? 1),
        defaultUnit: (r["default_unit"] as string) ?? "stueck",
        organicAvailable: (r["organic_available"] as boolean) ?? true,
        variants: (r["variants"] as string[] | null) ?? [],
        synonyms: [],
        variantNames: {},
        variantImages: {},
        excludedDiets: (r["excluded_diets"] as string[] | null) ?? [],
        cuisineIds: [],
        brands: [],
        markets: (r["markets"] as string[] | null) ?? [],
        excludedMarkets: excluded.get(r["id"] as string) ?? [],
        marketOrder: marketOrder.get(r["id"] as string) ?? {},
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

/** Details: Länderküchen, Marken, Synonyme, Varianten und Rezeptdaten – im Hintergrund nach dem Basis-Katalog. */
export const getCatalogDetails = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => (data ?? {}) as { locale?: string })
  .handler(async ({ data: input }): Promise<CatalogDetails> => {
    const locale = typeof input?.locale === "string" && input.locale ? input.locale : null;
    const supabase = publicClient();

    const [cuiRes, pcRes, brRes, riRes, rgRes, vtRes, rtRes, rsRes, rpRes, synRes, viRes, names] = await Promise.all([
      supabase.from("cuisines").select("id, name, emoji, sort_order").order("sort_order", { ascending: true }),
      fetchAll(supabase, "product_cuisines", "product_id, cuisine_id", ["id"]),
      fetchAll(supabase, "product_brands", "product_id, name, locales, sort_order", ["sort_order", "id"]),
      fetchAll(supabase, "recipe_ingredients", "template_id, step_key, product_id, sort_order, group_id", ["sort_order", "id"]),
      supabase.from("recipe_groups").select("id, template_id, parent_id, name, emoji, sort_order").order("sort_order", { ascending: true }),
      fetchAll(supabase, "variant_translations", "product_id, variant, locale, name", ["id"], "locale", locale),
      supabase.from("recipe_templates").select("id, emoji, color, sort_order, enabled").order("sort_order", { ascending: true }),
      supabase.from("recipe_steps").select("id, template_id, key, name, emoji, min, max, required, sort_order").order("sort_order", { ascending: true }),
      supabase.from("recipe_popular").select("id, template_id, picks, sort_order").order("sort_order", { ascending: true }),
      fetchAll(supabase, "product_synonyms", "product_id, term", ["id"]),
      supabase.from("product_variant_images").select("product_id, variant, image_path, icon_path"),
      loadTranslations(supabase, locale),
    ]);

    const variantImages: CatalogDetails["variantImages"] = {};
    for (const r of (viRes.data ?? []) as Array<{ product_id: string; variant: string; image_path: string | null; icon_path: string | null }>) {
      (variantImages[r.product_id] ??= {})[r.variant] = { imagePath: r.image_path, iconPath: r.icon_path };
    }
    const synonyms: CatalogDetails["synonyms"] = {};
    for (const r of (synRes.data ?? []) as Array<{ product_id: string; term: string }>) (synonyms[r.product_id] ??= []).push(r.term);
    const variantNames: CatalogDetails["variantNames"] = {};
    for (const r of (vtRes.data ?? []) as Array<{ product_id: string; variant: string; locale: string; name: string }>) {
      ((variantNames[r.product_id] ??= {})[r.variant] ??= {})[r.locale] = r.name;
    }
    const cuisineIds: CatalogDetails["cuisineIds"] = {};
    for (const r of (pcRes.data ?? []) as Array<{ product_id: string; cuisine_id: string }>) (cuisineIds[r.product_id] ??= []).push(r.cuisine_id);
    const brands: CatalogDetails["brands"] = {};
    for (const r of (brRes.data ?? []) as Array<{ product_id: string; name: string; locales: string[] | null }>) {
      (brands[r.product_id] ??= []).push({ name: r.name, markets: r.locales ?? [] });
    }

    return {
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
        templateId: r["template_id"] as string,
        parentId: (r["parent_id"] as string | null) ?? null,
        name: r["name"] as string,
        emoji: (r["emoji"] as string | null) ?? null,
        sortOrder: (r["sort_order"] as number) ?? 0,
        baseName: r["name"] as string,
        names: names.get(r["id"] as string) ?? {},
      })),
      recipeTemplates: ((rtRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
        id: r["id"] as string,
        emoji: (r["emoji"] as string | null) ?? null,
        color: (r["color"] as string | null) ?? null,
        sortOrder: (r["sort_order"] as number) ?? 0,
        enabled: (r["enabled"] as boolean) ?? true,
        baseName: r["id"] as string,
        name: r["id"] as string,
        names: names.get(r["id"] as string) ?? {},
      })),
      recipeSteps: ((rsRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
        id: r["id"] as string,
        templateId: r["template_id"] as string,
        key: r["key"] as string,
        name: r["name"] as string,
        emoji: (r["emoji"] as string | null) ?? null,
        min: (r["min"] as number) ?? 0,
        max: (r["max"] as number) ?? 1,
        required: (r["required"] as boolean) ?? false,
        sortOrder: (r["sort_order"] as number) ?? 0,
        baseName: r["name"] as string,
        names: names.get(r["id"] as string) ?? {},
      })),
      recipePopular: ((rpRes.data ?? []) as Array<Record<string, unknown>>).map((r) => ({
        id: r["id"] as string,
        templateId: r["template_id"] as string,
        picks: (r["picks"] as Record<string, string[]>) ?? {},
        sortOrder: (r["sort_order"] as number) ?? 0,
      })),
      synonyms,
      variantNames,
      variantImages,
      cuisineIds,
      brands,
    };
  });
