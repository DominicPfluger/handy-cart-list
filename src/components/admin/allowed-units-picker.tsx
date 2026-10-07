import { getLocale, useT } from "@/i18n";
import { getUnits } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type UnitDefaultsValue = { primary: string; units: string[]; quantities: Record<string, number> };

/** Sortierte Standard-Einheiten mit einer eigenen Standardmenge pro Einheit. */
export function AllowedUnitsPicker({ value, onChange }: { value: UnitDefaultsValue; onChange: (v: UnitDefaultsValue) => void }) {
  const { t } = useT();
  const units = getUnits(getLocale());
  const selected = [value.primary, ...value.units.filter((id) => id !== value.primary)];
  const available = units.filter((u) => !selected.includes(u.id));
  const label = (id: string) => units.find((u) => u.id === id)?.label ?? id;
  const setQuantity = (id: string, raw: string) => {
    const amount = Number(raw.replace(",", "."));
    onChange({ ...value, quantities: { ...value.quantities, [id]: Number.isFinite(amount) ? amount : 0 } });
  };
  const move = (index: number, direction: -1 | 1) => {
    const next = [...selected];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange({ ...value, primary: next[0]!, units: next.slice(1) });
  };
  const remove = (id: string) => {
    const next = selected.filter((unit) => unit !== id);
    if (!next.length) return;
    const quantities = { ...value.quantities };
    delete quantities[id];
    onChange({ primary: next[0]!, units: next.slice(1), quantities });
  };
  const add = (id: string) => {
    if (id) onChange({ ...value, units: [...value.units, id], quantities: { ...value.quantities, [id]: 1 } });
  };
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground">{t("adm.allowedUnits")}</p>
      <div className="space-y-1.5">
        {selected.map((id, index) => (
          <div key={id} className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-center gap-2 rounded-lg border border-border bg-card p-2">
            <span className="truncate text-sm font-medium text-foreground">{label(id)}</span>
            <Input aria-label={`${t("adm.defaultQty")} · ${label(id)}`} type="number" inputMode="decimal" min="0.01" step="any"
              value={value.quantities[id] ?? 1} onChange={(e) => setQuantity(id, e.target.value)} className="h-8 px-2 text-sm" />
            <div className="flex">
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={index === 0} aria-label={t("lm.moveUp")} title={t("lm.moveUp")} onClick={() => move(index, -1)}>↑</Button>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={index === selected.length - 1} aria-label={t("lm.moveDown")} title={t("lm.moveDown")} onClick={() => move(index, 1)}>↓</Button>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" disabled={selected.length === 1} aria-label={t("adm.remove")} title={t("adm.remove")} onClick={() => remove(id)}>×</Button>
            </div>
          </div>
        ))}
      </div>
      {available.length > 0 && <select aria-label={t("adm.allowedUnits")} value="" onChange={(e) => add(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground">
        <option value="">+ {t("adm.defaultUnit")}</option>
        {available.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
      </select>}
    </div>
  );
}
