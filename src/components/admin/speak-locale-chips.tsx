import { LOCALES, type Locale, useT } from "@/i18n";
import { cn } from "@/lib/utils";

/** Vorlese-Sprache als Chips statt Popup-Menü. */
export function SpeakLocaleChips({ value, onChange, marked }: {
  value: Locale;
  onChange: (locale: Locale) => void;
  /** Optional: kleiner Punkt, z. B. wenn eigene Texte vorhanden sind. */
  marked?: (locale: Locale) => boolean;
}) {
  const { t } = useT();
  return (
    <div role="radiogroup" aria-label={t("speak.locale")} className="flex flex-wrap gap-1.5">
      {LOCALES.map((l) => {
        const active = l.id === value;
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(l.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted",
            )}
          >
            <span aria-hidden="true">{l.flag}</span>
            <span className="whitespace-nowrap">{l.label}</span>
            {marked?.(l.id) && (
              <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary-foreground" : "bg-primary")} />
            )}
          </button>
        );
      })}
    </div>
  );
}
