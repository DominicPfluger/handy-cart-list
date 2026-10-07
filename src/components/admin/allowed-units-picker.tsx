import { getLocale, useT } from "@/i18n";
import { getUnits } from "@/lib/units";

/** Mehrfachauswahl weiterer Standard-Einheiten eines Produkts (z. B. Tube + Glas). */
export function AllowedUnitsPicker({ value, primary, onChange }: { value: string[]; primary: string; onChange: (v: string[]) => void }) {
  const { t } = useT();
  const units = getUnits(getLocale());
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-foreground">{t("adm.allowedUnits")}</p>
      <div className="flex flex-wrap gap-1">
        {units.filter((u) => u.id !== primary).map((u) => {
          const on = value.includes(u.id);
          return (
            <button key={u.id} type="button" aria-pressed={on} onClick={() => toggle(u.id)}
              className={`rounded-full border px-2 py-0.5 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
              {u.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
