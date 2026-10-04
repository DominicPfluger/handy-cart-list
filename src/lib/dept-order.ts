/** Ordnet Abteilungen in Katalog-Reihenfolge: Oberkategorien in Eingabereihenfolge
 *  (aus der DB bereits nach sort_order sortiert), darunter jeweils ihre Unterkategorien. */
export function deptTreeOrder<T extends { id: string; parent_id: string | null }>(depts: T[]): T[] {
  const children = new Map<string | null, T[]>();
  for (const d of depts) {
    const key = d.parent_id && depts.some((x) => x.id === d.parent_id) ? d.parent_id : null;
    const arr = children.get(key) ?? [];
    arr.push(d);
    children.set(key, arr);
  }
  const out: T[] = [];
  const walk = (parent: string | null) => {
    for (const d of children.get(parent) ?? []) {
      out.push(d);
      walk(d.id);
    }
  };
  walk(null);
  return out;
}
