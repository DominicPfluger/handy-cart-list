// Leitet aus einer Zutatenliste ab, für welche Ernährungsformen ein Produkt NICHT geeignet ist.
const RULES: { diets: string[]; re: RegExp }[] = [
  { diets: ["vegetarian", "vegan", "halal", "kosher"], re: /gelatine|schwein|speck|schinken|lard|schmalz|pork|bacon/i },
  { diets: ["vegetarian", "vegan"], re: /fleisch|rind|kalb|huhn|hähnchen|poulet|pute|truthahn|lamm|wild|fisch|lachs|thunfisch|sardelle|garnele|krabbe|muschel|krebs|shrimp|anchovi|meat|chicken|beef|fish|lab\b|tierisches lab|karmin|e120|e441|cochenille/i },
  { diets: ["vegan"], re: /milch|butter|rahm|sahne|käse|quark|joghurt|molke|lactose|laktose|kasein|casein|ei\b|eier|eigelb|eiweiss|eiweiß|honig|egg|milk|cheese|whey|honey/i },
  { diets: ["lactose_free"], re: /milch|butter|rahm|sahne|käse|quark|joghurt|molke|lactose|laktose|milk|cheese|whey/i },
  { diets: ["gluten_free"], re: /weizen|gerste|roggen|dinkel|hafer|grünkern|emmer|kamut|gluten|malz|wheat|barley|rye|spelt/i },
  { diets: ["sugar_free"], re: /zucker|glukose|glucose|fruktose|fructose|sirup|dextrose|saccharose|sugar|syrup/i },
  { diets: ["fructose_free"], re: /fruktose|fructose|fruchtzucker|honig|agave|sorbit|invertzucker/i },
  { diets: ["halal"], re: /alkohol|wein|bier|rum|likör|ethanol|alcohol|wine|beer/i },
];

export function dietsFromIngredients(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const out = new Set<string>();
  for (const r of RULES) if (r.re.test(t)) r.diets.forEach((d) => out.add(d));
  return [...out];
}
