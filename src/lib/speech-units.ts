import { unitLabel } from "./units";

/** Ausgesprochene Einheiten [Einzahl, Mehrzahl] je Sprache (Sprachcode). */
const SPOKEN: Record<string, Record<string, [string, string]>> = {
  de: {
    stueck: ["Stück", "Stück"], gramm: ["Gramm", "Gramm"], kilogramm: ["Kilogramm", "Kilogramm"],
    milliliter: ["Milliliter", "Milliliter"], deziliter: ["Deziliter", "Deziliter"], liter: ["Liter", "Liter"],
    glas: ["Glas", "Gläser"], flasche: ["Flasche", "Flaschen"], dose: ["Dose", "Dosen"], beutel: ["Beutel", "Beutel"],
    packung: ["Packung", "Packungen"], schachtel: ["Schachtel", "Schachteln"], buendel: ["Bund", "Bund"],
    becher: ["Becher", "Becher"], tube: ["Tube", "Tuben"], netz: ["Netz", "Netze"], rolle: ["Rolle", "Rollen"],
  },
  en: {
    stueck: ["piece", "pieces"], gramm: ["gram", "grams"], kilogramm: ["kilogram", "kilograms"],
    milliliter: ["milliliter", "milliliters"], deziliter: ["deciliter", "deciliters"], liter: ["liter", "liters"],
    glas: ["jar", "jars"], flasche: ["bottle", "bottles"], dose: ["can", "cans"], beutel: ["bag", "bags"],
    packung: ["pack", "packs"], schachtel: ["box", "boxes"], buendel: ["bunch", "bunches"],
    becher: ["cup", "cups"], tube: ["tube", "tubes"], netz: ["net", "nets"], rolle: ["roll", "rolls"],
  },
  fr: {
    stueck: ["pièce", "pièces"], gramm: ["gramme", "grammes"], kilogramm: ["kilogramme", "kilogrammes"],
    milliliter: ["millilitre", "millilitres"], deziliter: ["décilitre", "décilitres"], liter: ["litre", "litres"],
    glas: ["bocal", "bocaux"], flasche: ["bouteille", "bouteilles"], dose: ["boîte", "boîtes"], beutel: ["sachet", "sachets"],
    packung: ["paquet", "paquets"], schachtel: ["boîte", "boîtes"], buendel: ["botte", "bottes"],
    becher: ["pot", "pots"], tube: ["tube", "tubes"], netz: ["filet", "filets"], rolle: ["rouleau", "rouleaux"],
  },
  es: {
    stueck: ["unidad", "unidades"], gramm: ["gramo", "gramos"], kilogramm: ["kilo", "kilos"],
    milliliter: ["mililitro", "mililitros"], deziliter: ["decilitro", "decilitros"], liter: ["litro", "litros"],
    glas: ["frasco", "frascos"], flasche: ["botella", "botellas"], dose: ["lata", "latas"], beutel: ["bolsa", "bolsas"],
    packung: ["paquete", "paquetes"], schachtel: ["caja", "cajas"], buendel: ["manojo", "manojos"],
    becher: ["vaso", "vasos"], tube: ["tubo", "tubos"], netz: ["malla", "mallas"], rolle: ["rollo", "rollos"],
  },
  it: {
    stueck: ["pezzo", "pezzi"], gramm: ["grammo", "grammi"], kilogramm: ["chilo", "chili"],
    milliliter: ["millilitro", "millilitri"], deziliter: ["decilitro", "decilitri"], liter: ["litro", "litri"],
    glas: ["vasetto", "vasetti"], flasche: ["bottiglia", "bottiglie"], dose: ["lattina", "lattine"], beutel: ["sacchetto", "sacchetti"],
    packung: ["confezione", "confezioni"], schachtel: ["scatola", "scatole"], buendel: ["mazzo", "mazzi"],
    becher: ["vasetto", "vasetti"], tube: ["tubetto", "tubetti"], netz: ["retina", "retine"], rolle: ["rotolo", "rotoli"],
  },
  pt: {
    stueck: ["unidade", "unidades"], gramm: ["grama", "gramas"], kilogramm: ["quilo", "quilos"],
    milliliter: ["mililitro", "mililitros"], deziliter: ["decilitro", "decilitros"], liter: ["litro", "litros"],
    glas: ["frasco", "frascos"], flasche: ["garrafa", "garrafas"], dose: ["lata", "latas"], beutel: ["saco", "sacos"],
    packung: ["pacote", "pacotes"], schachtel: ["caixa", "caixas"], buendel: ["molho", "molhos"],
    becher: ["copo", "copos"], tube: ["tubo", "tubos"], netz: ["rede", "redes"], rolle: ["rolo", "rolos"],
  },
  nl: {
    stueck: ["stuk", "stuks"], gramm: ["gram", "gram"], kilogramm: ["kilo", "kilo"],
    milliliter: ["milliliter", "milliliter"], deziliter: ["deciliter", "deciliter"], liter: ["liter", "liter"],
    glas: ["pot", "potten"], flasche: ["fles", "flessen"], dose: ["blik", "blikken"], beutel: ["zak", "zakken"],
    packung: ["pak", "pakken"], schachtel: ["doos", "dozen"], buendel: ["bos", "bossen"],
    becher: ["beker", "bekers"], tube: ["tube", "tubes"], netz: ["net", "netten"], rolle: ["rol", "rollen"],
  },
};

const FALLBACK_UNIT: Record<string, [string, string]> = {
  de: ["Einheit", "Einheiten"], en: ["unit", "units"], fr: ["unité", "unités"],
  es: ["unidad", "unidades"], it: ["unità", "unità"], pt: ["unidade", "unidades"], nl: ["eenheid", "eenheden"],
};
const PACKAGES: Record<string, [string, string]> = {
  de: ["Packung", "Packungen"], en: ["pack", "packs"], fr: ["paquet", "paquets"],
  es: ["paquete", "paquetes"], it: ["confezione", "confezioni"], pt: ["pacote", "pacotes"], nl: ["pak", "pakken"],
};
const PER_WORD: Record<string, string> = { de: "à", en: "of", fr: "de", es: "de", it: "da", pt: "de", nl: "van" };
const UNIT_ALIASES: Record<string, string> = {
  "stk": "stueck", "stk.": "stueck", "stück": "stueck", "stueck": "stueck",
  "g": "gramm", "gr": "gramm", "gramm": "gramm", "kg": "kilogramm", "kilogramm": "kilogramm",
  "mg": "milligramm", "milligramm": "milligramm", "ml": "milliliter", "milliliter": "milliliter",
  "dl": "deziliter", "deziliter": "deziliter", "l": "liter", "lt": "liter", "liter": "liter",
  "pkg": "packung", "pkg.": "packung", "packung": "packung",
};

function numberText(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(n);
}

function wordForm(forms: [string, string], n: number, locale: string): string {
  let word = new Intl.PluralRules(locale).select(n) === "one" ? forms[0] : forms[1];
  if (locale === "de-CH") word = word.replace(/ß/g, "ss");
  return word;
}

function unitFromText(text: string): string | undefined {
  return UNIT_ALIASES[text.trim().toLocaleLowerCase()];
}

/** "2 Flaschen" / "2 bottles" – Menge ausgeschrieben in der Vorlese-Sprache. */
export function speakQuantity(stored: string, unit: string | undefined, locale: string): string {
  const language = locale.slice(0, 2);
  const compound = /^\s*([\d.,]+)\s*[x×]\s*([\d.,]+)\s*([^\d\s]+)\s*$/iu.exec(stored);
  if (compound) {
    const packs = Number(compound[1]?.replace(",", "."));
    const inner = Number(compound[2]?.replace(",", "."));
    const innerUnit = unitFromText(compound[3] ?? "") ?? unit;
    if (Number.isFinite(packs) && Number.isFinite(inner)) {
      const packForms = PACKAGES[language] ?? PACKAGES.en;
      const per = PER_WORD[language] ?? PER_WORD.en;
      return `${numberText(packs, locale)} ${wordForm(packForms, packs, locale)} ${per} ${speakQuantity(String(inner), innerUnit, locale)}`;
    }
  }
  const m = /^\s*([\d.,]+)\s*(.*?)\s*$/.exec(stored);
  if (!m) return stored;
  const n = Number(m[1]!.replace(",", "."));
  if (!Number.isFinite(n)) return stored;
  const num = numberText(n, locale);
  const resolvedUnit = unit ?? unitFromText(m[2] ?? "");
  if (!resolvedUnit) {
    if (m[2]?.trim()) return `${num} ${m[2].trim()}`;
    const fallback = FALLBACK_UNIT[language] ?? FALLBACK_UNIT.en;
    return `${num} ${wordForm(fallback, n, locale)}`;
  }
  const forms = SPOKEN[language]?.[resolvedUnit];
  if (forms) {
    return `${num} ${wordForm(forms, n, locale)}`;
  }
  return `${num} ${unitLabel(resolvedUnit, locale)}`;
}
