export const LOCALE_HINTS: Record<string, string> = {
  "en-US": "American English (e.g. eggplant, zucchini, cilantro, cookies, ground beef).",
  "en-GB": "British English (e.g. aubergine, courgette, coriander, biscuits, mince, crisps).",
  "en-CA": "Canadian English spelling and grocery terms.",
  "de-AT": "Austrian German grocery terms (Paradeiser, Erdäpfel, Karfiol, Kren, Marillen, Topfen, Schlagobers, Fisolen, Palatschinken, Ribisel, Semmel).",
  "de-CH": "Swiss Standard German: never use ß (write ss). Swiss terms: Rüebli, Randen, Peperoni (bell pepper), Nüsslisalat, Rahm, Weggli, Glace, Poulet.",
  "es-ES": "Spanish of Spain (patatas, zumo, melocotón).",
  "es-MX": "Mexican Spanish (papas, jugo, durazno, ejotes, jitomate).",
  "fr-FR": "French of France.",
  "fr-CA": "Canadian French grocery terms (patates, bleuets, crème glacée).",
  "it-IT": "Italian of Italy.",
  "it-CH": "Swiss Italian (Ticino) grocery terms where they differ.",
  "pt-PT": "European Portuguese (sumo, ananás).",
  "pt-BR": "Brazilian Portuguese (suco, abacaxi).",
  "nl-NL": "Dutch of the Netherlands.",
  "nl-BE": "Flemish/Belgian Dutch grocery terms where they differ.",
};

/** Übersetzt deutsche Katalognamen in eine Sprachvariante (Lovable AI, gestreamt). */
export async function translateNames(names: Record<string, string>, locale: string): Promise<Record<string, string>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("KI-Schlüssel fehlt");
  const keys = Object.keys(names);
  if (keys.length === 0) return {};

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions:
        `Translate German supermarket category and product names into ${locale}. ${LOCALE_HINTS[locale] ?? ""} ` +
        "Use the everyday term shoppers in that market see on shelves. Keep proper names (e.g. Brie, Gouda) unless a local form is common. Short, capitalised like a shopping app.",
      input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify(names) }] }],
      text: {
        format: {
          type: "json_schema",
          name: "translations",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["items"],
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["key", "name"],
                  properties: { key: { type: "string" }, name: { type: "string" } },
                },
              },
            },
          },
        },
      },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    const err = new Error(res.status === 402 ? "KI-Guthaben aufgebraucht" : `KI-Fehler ${res.status}: ${body.slice(0, 200)}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  // SSE lesen und Text sammeln
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as { type?: string; delta?: string; error?: { message?: string } };
        if (evt.type === "response.output_text.delta" && evt.delta) text += evt.delta;
        if (evt.type === "error" || evt.type === "response.failed") throw new Error(evt.error?.message ?? "KI-Fehler");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (!text) throw new Error("Leere KI-Antwort");
  const parsed = JSON.parse(text) as { items: Array<{ key: string; name: string }> };
  const out: Record<string, string> = {};
  for (const it of parsed.items) if (keys.includes(it.key) && it.name.trim()) out[it.key] = it.name.trim();
  return out;
}
