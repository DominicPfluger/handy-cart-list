import { useT } from "../i18n";
import { getUnits } from "../lib/units";

export type QtyValue = { qty: string; unit: string };

/** Mengen-Eingabe: Zahl + Einheit (kurze Einheitenbeschriftungen, alle Sprachen). */
export function QuantityInput({ value, onChange, ariaLabel }: { value: QtyValue; onChange: (v: QtyValue) => void; ariaLabel?: string | undefined }) {
  const { t } = useT();
  const units = getUnits();
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        maxLength={8}
        value={value.qty}
        onChange={(e) => onChange({ ...value, qty: e.target.value.slice(0, 8) })}
        aria-label={ariaLabel ?? t("rs.quantity")}
        className="w-16 rounded-md border border-border bg-background px-1.5 py-0.5 text-xs text-foreground outline-none focus:border-primary"
      />
      <select
        value={value.unit}
        onChange={(e) => onChange({ ...value, unit: e.target.value })}
        aria-label={ariaLabel ?? t("rs.quantity")}
        className="rounded-md border border-border bg-background px-1 py-0.5 text-xs text-foreground"
      >
        {units.map((u) => <option key={u.id} value={u.id}>{u.short}</option>)}
      </select>
    </span>
  );
}

/** Gültige Menge? Leer = ungültig (Standard beibehalten), sonst Zahl > 0. */
export function isValidQty(v: QtyValue): boolean {
  const n = Number(v.qty.replace(",", "."));
  return Number.isFinite(n) && n > 0;
}
