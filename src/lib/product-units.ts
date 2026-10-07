/** Bevorzugte Mengenangaben je Produkt: eigene Admin-Zuordnung, sonst Warengruppen-Vorschlag. */
type DeptLike = { id: string; parentId?: string | null; parent_id?: string | null; name: string; baseName?: string };

const GROUP_RULES: Array<[RegExp, string[]]> = [
  [/senf|mayo|ketchup|sauce|saucen|dressing|würz|wuerz/i, ["tube", "glas", "flasche"]],
  [/konserve|dose/i, ["dose", "glas"]],
  [/getränk|getraenk|wasser|saft|bier|wein|limonade/i, ["flasche", "liter", "sixpack", "kiste"]],
  [/obst|gemüse|gemuese|frischmarkt|früchte|fruechte/i, ["stueck", "kilogramm", "gramm", "netz"]],
  [/milch|joghurt|molkerei|rahm|quark/i, ["becher", "liter", "packung"]],
  [/tk-|tiefkühl|tiefkuehl/i, ["packung", "beutel"]],
  [/gewürz|gewuerz|kräuter|kraeuter/i, ["glas", "beutel", "packung"]],
];

export function preferredUnits(
  product: { defaultUnit?: string; allowedUnits?: string[]; departmentId?: string },
  departments: DeptLike[] = [],
): string[] {
  const out: string[] = [];
  const add = (u?: string) => { if (u && !out.includes(u)) out.push(u); };
  add(product.defaultUnit);
  if (product.allowedUnits && product.allowedUnits.length) {
    product.allowedUnits.forEach(add);
    return out;
  }
  const byId = new Map(departments.map((d) => [d.id, d]));
  let cur = product.departmentId ? byId.get(product.departmentId) : undefined;
  let guard = 0;
  while (cur && guard++ < 10) {
    const n = cur.baseName ?? cur.name;
    const rule = GROUP_RULES.find(([re]) => re.test(n));
    if (rule) { rule[1].forEach(add); break; }
    const pid = cur.parentId ?? cur.parent_id;
    cur = pid ? byId.get(pid) : undefined;
  }
  return out;
}

/** Einheitenliste so sortieren, dass bevorzugte Einheiten zuerst stehen. */
export function sortByPreferred<T extends { id: string }>(units: T[], preferred: string[]): T[] {
  const rank = (id: string) => { const i = preferred.indexOf(id); return i < 0 ? 999 : i; };
  return [...units].sort((a, b) => rank(a.id) - rank(b.id));
}

/** Standardmenge für eine Einheit; alte Produkte fallen auf ihre bisherige Hauptmenge zurück. */
export function quantityForUnit(product: { defaultQuantity: number; defaultUnit: string; unitQuantities?: Record<string, number> }, unit: string): number {
  const stored = product.unitQuantities?.[unit];
  return typeof stored === "number" && Number.isFinite(stored) && stored > 0 ? stored : unit === product.defaultUnit ? product.defaultQuantity : 1;
}
