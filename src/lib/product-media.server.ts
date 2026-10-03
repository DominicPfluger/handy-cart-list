import { aiJson } from "./translate.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export type ImageGenOpts = {
  style?: "photo" | "illustration";
  background?: "transparent" | "white" | "gradient";
  view?: "front" | "top" | "side";
  count?: "single" | "group";
};

/** Erzeugt ein Produktbild (komprimiertes WebP mit transparentem Hintergrund) über das Lovable-KI-Bildmodell. */
export async function generateProductImage(name: string, emoji: string | null, hint?: string, opts?: ImageGenOpts): Promise<Uint8Array> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("KI-Schlüssel fehlt");
  const extra = hint?.trim() ? ` The image must show: ${hint.trim()}.` : "";
  const style = opts?.style === "illustration" ? "Flat friendly vector illustration style, clean shapes, soft colors. " : "Clean product photo of ";
  const subject = opts?.style === "illustration" ? `"${name}" (${emoji ?? "grocery item"}) for a shopping list app. ` : `"${name}" (${emoji ?? "grocery item"}) for a shopping list app. `;
  const bg =
    opts?.background === "white" ? "isolated on a pure white background (no backdrop, no shadow plate)" :
    opts?.background === "gradient" ? "on a soft, subtle pastel gradient background that fits a green shopping app (no text)" :
    "isolated on a fully transparent background (no backdrop, no shadow plate)";
  const view =
    opts?.view === "top" ? "viewed slightly from above, " :
    opts?.view === "side" ? "viewed from the side, " : "";
  const count = opts?.count === "group" ? "Small group of 2-3 items, arranged together, " : "Single item, ";
   const prompt =
    `${style}${subject}` +
    `${count}centered, ${view}${bg}, soft daylight, no text, no brand logos, no packaging labels with words, square composition. ` +
    "No herbs, no garnishes or additions of any kind, no vessels or containers (no bowls, plates, pots, jars) — just the plain product itself." +
    extra;
  const transparent = !opts?.background || opts.background === "transparent";
  const res = await fetch(`${GATEWAY}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
    // 512x512 wird vom Modell abgelehnt (Mindestauflösung) → kleinste erlaubte Grösse, stark komprimiert.
    body: JSON.stringify({ model: "openai/gpt-image-2.5-sunburst", prompt, size: "1024x1024", ...(transparent ? { background: "transparent" } : {}), output_format: "webp", output_compression: 60, quality: "low" }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(res.status === 402 ? "KI-Guthaben aufgebraucht" : res.status === 429 ? "KI ausgelastet, bitte gleich nochmal" : `Bild-KI-Fehler ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string; url?: string }> };
  const entry = json.data?.[0];
  if (entry?.b64_json) {
    const bin = atob(entry.b64_json);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  if (entry?.url) {
    const img = await fetch(entry.url);
    if (!img.ok) throw new Error("Bild-Download fehlgeschlagen");
    return new Uint8Array(await img.arrayBuffer());
  }
  throw new Error("Kein Bild von der KI erhalten");
}

export type PriceEstimate = {
  key: string;
  price: number;
  pack_size: number | null;
  pack_unit: string | null;
  unit_price: number | null;
  unit_basis: "100g" | "kg" | "100ml" | "l" | null;
};

const MARKET_HINTS: Record<string, string> = {
  CH: "Switzerland, currency CHF, typical Migros/Coop prices",
  DE: "Germany, currency EUR, typical Rewe/Edeka prices",
  AT: "Austria, currency EUR, typical Billa/Spar prices",
  FR: "France, currency EUR, typical Carrefour/Leclerc prices",
  ES: "Spain, currency EUR, typical Mercadona prices",
  MX: "Mexico, currency MXN, typical Walmart/Soriana prices",
  IT: "Italy, currency EUR, typical Esselunga/Conad prices",
  BE: "Belgium, currency EUR, typical Delhaize/Colruyt prices",
  NL: "Netherlands, currency EUR, typical Albert Heijn/Jumbo prices",
  GB: "United Kingdom, currency GBP, typical Tesco/Sainsbury's prices",
  US: "USA, currency USD, typical Walmart/Kroger prices",
  CA: "Canada, currency CAD, typical Loblaws prices",
  PT: "Portugal, currency EUR, typical Continente prices",
  BR: "Brazil, currency BRL, typical Pão de Açúcar prices",
};

/** Schätzt typische Ladenpreise (Richtwerte) für eine Produktliste in einem Markt. */
export async function estimatePrices(
  products: Array<{ id: string; name: string; default_quantity: number; default_unit: string }>,
  market: string,
): Promise<PriceEstimate[]> {
  const hint = MARKET_HINTS[market] ?? `${market}, local currency, typical supermarket prices`;
  const input = JSON.stringify(
    products.map((p) => ({ key: p.id, name: p.name, qty: p.default_quantity, unit: p.default_unit })),
  );
  const r = await aiJson<{ items: PriceEstimate[] }>(
    `Estimate typical current supermarket shelf prices for grocery items. Market: ${hint}. ` +
      "Use the given quantity/unit as the pack size. price = total pack price (number, realistic, mid-range store brand). " +
      "pack_size/pack_unit: numeric size and unit (g, kg, ml, l, Stück) when inferable, else null. " +
      "unit_price/unit_basis: price per 100g, kg, 100ml or l when meaningful (e.g. cheese per kg), else null. " +
      "Answer with one item per input, same key.",
    input,
    "prices",
    {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["key", "price", "pack_size", "pack_unit", "unit_price", "unit_basis"],
            properties: {
              key: { type: "string" },
              price: { type: "number" },
              pack_size: { type: ["number", "null"] },
              pack_unit: { type: ["string", "null"] },
              unit_price: { type: ["number", "null"] },
              unit_basis: { type: ["string", "null"], enum: ["100g", "kg", "100ml", "l", null] },
            },
          },
        },
      },
    },
  );
  return r.items;
}
