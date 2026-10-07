/** Lagerform eines Katalogprodukts, abgeleitet aus seiner Abteilung (Frisch / Tiefkühl / Konserve). */
export type StorageForm = "fresh" | "frozen" | "canned";

const FROZEN_DEPTS = new Set([
  "657b83d1-dc4b-462d-8f5f-ecad6d1f4563", // TK-Gemüse
  "8bcf88a0-5876-4203-b4ca-24dab75aa865", // TK-Beilagen
  "718b2507-b054-4ed1-a6b7-4627f7c011a5", // TK-Meeresfrüchte
  "7d431082-fb94-41a7-8059-e6a930517577", // TK-Früchte
  "d1c5ce65-0c23-42cc-a9f9-1f0fc57d7fe4", // TK-Fisch
  "e6660458-fdbb-4a83-afda-a6ba46d07167", // TK-Fleisch
]);

const CANNED_DEPTS = new Set([
  "80f6152e-8de5-4a68-bfdb-7c0a7c771ed7", // Gemüsekonserven
  "d4e5f603-3333-4a33-8a33-0000000000d3", // Hülsenfrüchte-Konserven
  "910cf7f7-e2e4-4303-b83f-5116093d695f", // Fruchtkonserven
  "8c3f1a2b-4d5e-4f6a-9b7c-9d0e1f2a3b4c", // Dosen-Pilze
  "9edf293e-1025-4259-92d1-955688c72ca1", // Fischkonserven
  "ed3ce843-47ca-49f6-9025-291c2274c5d5", // Fleischkonserven
]);

export function storageFormOf(departmentId?: string | null): StorageForm {
  if (departmentId && FROZEN_DEPTS.has(departmentId)) return "frozen";
  if (departmentId && CANNED_DEPTS.has(departmentId)) return "canned";
  return "fresh";
}

/** Erkennt bereits vorhandene Lagerform-Wörter im Namen (alle App-Sprachen), damit nichts doppelt angehängt wird. */
const FORM_WORDS: Record<Exclude<StorageForm, "fresh">, RegExp> = {
  frozen: /(^|[\s(\-])(tk|tiefgekühlt|tiefgekuehlt|frozen|surgel|congelad|congelat|diepvries|bevroren)/i,
  canned: /(^|[\s(\-])(konserve|dose|dosen|canned|tinned|conserve|en conserve|enlatad|en lata|in scatola|blik|ingeblikt|em lata|enlatad)/i,
};

export function hasFormWord(name: string, form: StorageForm): boolean {
  return form !== "fresh" && FORM_WORDS[form].test(name);
}

export const STORAGE_FORMS: StorageForm[] = ["fresh", "frozen", "canned"];

/** Gleichnamige Produkte in anderen Lagerformen finden (je Form ein Produkt). */
export function formAlternatives<P extends { id: string; name: string; departmentId: string }>(
  products: P[],
  product: P,
): Partial<Record<StorageForm, P>> {
  const key = product.name.trim().toLocaleLowerCase();
  const out: Partial<Record<StorageForm, P>> = {};
  for (const p of products) {
    if (p.name.trim().toLocaleLowerCase() !== key) continue;
    const f = storageFormOf(p.departmentId);
    if (!out[f] || p.id === product.id) out[f] = p;
  }
  return out;
}
