// Server-only: Supermarkt-Seite einlesen, Produkte + Richtpreise extrahieren, mit Katalog abgleichen.
import { aiJson } from "./translate.server";

export const MARKET_CURRENCY: Record<string, string> = {
  CH: "CHF", US: "USD", CA: "CAD", GB: "GBP", MX: "MXN", BR: "BRL",
  DE: "EUR", AT: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", BE: "EUR", NL: "EUR", PT: "EUR",
};

export type Extracted = {
  raw_name: string;
  suggested_name: string;
  price: number | null;
  currency: string | null;
  pack_size: number | null;
  pack_unit: string | null;
  unit_price: number | null;
  unit_basis: string | null;
};

export type Candidate = Extracted & {
  department_id: string | null;
  emoji: string | null;
  match_product_id: string | null;
  match_type: "exact" | "similar" | "new";
};

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export async function fetchPageMarkdown(url: string): Promise<string> {
  const lovable = process.env["LOVABLE_API_KEY"];
  const fc = process.env["FIRECRAWL_API_KEY"];
  if (lovable && fc) {
    const res = await fetch(`${GATEWAY}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": fc },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 2000 }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Firecrawl ${res.status}: ${body}`);
      if (res.status === 402) throw new Error("Guthaben für den Web-Abruf aufgebraucht");
      throw new Error(`Seite konnte nicht abgerufen werden (${res.status})`);
    }
    const j = (await res.json()) as { markdown?: string; data?: { markdown?: string } };
    const md = j.markdown ?? j.data?.markdown ?? "";
    if (md.trim()) return md;
  }
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ShoppiImport" } });
  if (!res.ok) throw new Error(`Seite konnte nicht abgerufen werden (${res.status})`);
  const html = await res.text();
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

const num = { type: ["number", "null"] } as const;
const str = { type: ["string", "null"] } as const;

export async function extractProducts(markdown: string, market: string): Promise<Extracted[]> {
  const currency = MARKET_CURRENCY[market] ?? "EUR";
  const r = await aiJson<{ items: Extracted[] }>(
    `Du liest den Inhalt einer Supermarkt-Webseite (Land ${market}, Währung ${currency}) und extrahierst die angebotenen Lebensmittel-/Haushaltsprodukte (max. 150).
- raw_name: Name wie auf der Seite.
- suggested_name: generischer deutscher Katalogname ohne Marke, ohne Packungsgrösse, Singular/üblich (z. B. "Coop Bio Rispentomaten 500 g" → "Rispentomaten"; "Lindt Excellence 85%" → "Dunkle Schokolade").
- price: aktueller Preis als Zahl, sonst null. currency: ISO-Code.
- pack_size + pack_unit (g, kg, ml, l, Stück).
- unit_price + unit_basis ("100g","kg","100ml","l"): nur wenn auf der Seite angegeben oder sicher aus Preis und Gewicht/Volumen berechenbar. Bei Stückware null.
Keine Werbetexte, Rezepte oder Navigation. Dubletten zusammenfassen.`,
    markdown.slice(0, 60000),
    "products",
    {
      type: "object", additionalProperties: false, required: ["items"],
      properties: { items: { type: "array", items: { type: "object", additionalProperties: false,
        required: ["raw_name", "suggested_name", "price", "currency", "pack_size", "pack_unit", "unit_price", "unit_basis"],
        properties: { raw_name: { type: "string" }, suggested_name: { type: "string" }, price: num, currency: str, pack_size: num, pack_unit: str, unit_price: num, unit_basis: str } } } },
    },
  );
  return (r.items ?? []).filter((x) => x.suggested_name?.trim()).map((x) => {
    const out = { ...x, currency: x.currency ?? currency };
    // Grundpreis berechnen falls fehlend und sinnvoll
    if (out.unit_price == null && out.price && out.pack_size && out.pack_unit) {
      const u = out.pack_unit.toLowerCase();
      const grams = u === "g" ? out.pack_size : u === "kg" ? out.pack_size * 1000 : null;
      const ml = u === "ml" ? out.pack_size : u === "l" ? out.pack_size * 1000 : null;
      if (grams) { out.unit_price = grams >= 1000 ? (out.price / grams) * 1000 : (out.price / grams) * 100; out.unit_basis = grams >= 1000 ? "kg" : "100g"; }
      else if (ml) { out.unit_price = ml >= 1000 ? (out.price / ml) * 1000 : (out.price / ml) * 100; out.unit_basis = ml >= 1000 ? "l" : "100ml"; }
    }
    if (out.unit_price != null) {
      out.unit_price = Math.round(out.unit_price * 100) / 100;
      if (!(out.unit_price > 0 && out.unit_price < 100000)) { out.unit_price = null; out.unit_basis = null; }
    }
    return out;
  });
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, " ").trim();

/** Gleicht extrahierte Produkte mit Katalog ab; schlägt Abteilung/Emoji für neue vor. */
export async function matchCatalog(sb: any, items: Extracted[]): Promise<Candidate[]> {
  const prods: Array<{ id: string; name: string; department_id: string; emoji: string | null }> = [];
  for (let f = 0; ; f += 1000) {
    const r = await sb.from("products").select("id, name, department_id, emoji").order("id").range(f, f + 999);
    prods.push(...(r.data ?? []));
    if (!r.data || r.data.length < 1000) break;
  }
  const byName = new Map<string, string>();
  for (const p of prods) byName.set(norm(p.name), p.id);
  for (let f = 0; ; f += 1000) {
    const r = await sb.from("catalog_translations").select("entity_id, name").eq("entity_type", "product").order("id").range(f, f + 999);
    for (const t of r.data ?? []) if (!byName.has(norm(t.name))) byName.set(norm(t.name), t.entity_id);
    if (!r.data || r.data.length < 1000) break;
  }
  const out: Candidate[] = items.map((x) => {
    const id = byName.get(norm(x.suggested_name)) ?? byName.get(norm(x.raw_name)) ?? null;
    return { ...x, department_id: null, emoji: null, match_product_id: id, match_type: id ? "exact" : "new" };
  });
  const rest = out.map((c, i) => ({ c, i })).filter((x) => !x.c.match_product_id);
  if (rest.length === 0) return out;

  const { data: deps } = await sb.from("departments").select("id, name, parent_id").order("sort_order");
  const depList = (deps ?? []) as Array<{ id: string; name: string }>;
  const catalog = prods.map((p, i) => `${i}:${p.name}`).join("\n");
  const r = await aiJson<{ items: { i: number; similar: number; dept: number; emoji: string }[] }>(
    `Für jedes neue Produkt: similar = Index eines Katalogprodukts, das im Einkaufsalltag dasselbe ist (z. B. "Rispentomaten" ≈ "Tomaten"), sonst -1. dept = Index der passendsten Abteilung. emoji = ein passendes Emoji.`,
    `NEUE PRODUKTE:\n${rest.map((x, k) => `${k}:${x.c.suggested_name}`).join("\n")}\n\nABTEILUNGEN:\n${depList.map((d, i) => `${i}:${d.name}`).join("\n")}\n\nKATALOG:\n${catalog}`,
    "match",
    { type: "object", additionalProperties: false, required: ["items"], properties: { items: { type: "array", items: { type: "object", additionalProperties: false, required: ["i", "similar", "dept", "emoji"], properties: { i: { type: "integer" }, similar: { type: "integer" }, dept: { type: "integer" }, emoji: { type: "string" } } } } } },
  );
  for (const m of r.items ?? []) {
    const target = rest[m.i];
    if (!target) continue;
    const c = out[target.i]!;
    const sim = prods[m.similar];
    if (sim) { c.match_product_id = sim.id; c.match_type = "similar"; c.department_id = sim.department_id; c.emoji = sim.emoji; }
    else { c.department_id = depList[m.dept]?.id ?? null; c.emoji = m.emoji || null; }
  }
  return out;
}

/** Komplett: Seite lesen → Kandidaten in DB (pending). Exakte Treffer aktualisieren nur den Richtpreis. */
export async function scanToCandidates(sb: any, opts: { url: string; market: string; sourceId: string | null }) {
  const md = await fetchPageMarkdown(opts.url);
  const items = await extractProducts(md, opts.market);
  const cands = await matchCatalog(sb, items);

  // Bereits offene Kandidaten derselben Quelle nicht doppelt anlegen
  const { data: open } = await sb.from("import_candidates").select("raw_name").eq("status", "pending").eq("source_url", opts.url);
  const openSet = new Set(((open ?? []) as Array<{ raw_name: string }>).map((o) => norm(o.raw_name)));

  let priced = 0;
  const rows = [];
  for (const c of cands) {
    if (c.match_type === "exact" && c.match_product_id) {
      if (c.price) {
        await sb.from("product_reference_prices").upsert({
          product_id: c.match_product_id, market: opts.market, price: c.price, currency: c.currency ?? MARKET_CURRENCY[opts.market] ?? "EUR",
          pack_size: c.pack_size, pack_unit: c.pack_unit, unit_price: c.unit_price, unit_basis: c.unit_basis,
          source_id: opts.sourceId, observed_at: new Date().toISOString(),
        }, { onConflict: "product_id,market" });
        priced++;
      }
      continue;
    }
    if (openSet.has(norm(c.raw_name))) continue;
    rows.push({ ...c, source_id: opts.sourceId, source_url: opts.url, market: opts.market, status: "pending" });
  }
  if (rows.length) {
    const { error } = await sb.from("import_candidates").insert(rows);
    if (error) throw new Error(error.message);
  }
  return { found: cands.length, pending: rows.length, priced, existing: cands.filter((c) => c.match_type === "exact").length };
}
