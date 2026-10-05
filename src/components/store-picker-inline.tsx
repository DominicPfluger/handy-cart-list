import { useNavigate } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { useStores } from "@/hooks/use-stores";
import { useGroupOrder } from "@/hooks/use-group-order";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Inline-Popup zur Laden-Wahl: erscheint im Seitenfluss unterhalb des Store-Icons
 * (Läden des gewählten Marktes + eigene Läden + „Standard") und schiebt die
 * Abteilungen nach unten, statt sie als Overlay zu überdecken.
 * Zuunterst öffnet „+ Neuer Laden" die Einstellungen (Bereich „Abteilungen ordnen & umbenennen").
 */
export function StorePickerInline({ open, onPick, onClose }: { open: boolean; onPick: (id: string) => void; onClose: () => void }) {
  const { t } = useT();
  const navigate = useNavigate();
  const stores = useStores();
  const { store } = useGroupOrder();

  if (!open) return null;

  return (
    <div
      className="picker-open origin-top rounded-2xl border border-border bg-card px-2 py-2 shadow-sm"
      role="listbox"
      aria-label={t("store.label")}
    >
      {stores.map((s) => {
        const selected = s.id === store;
        return (
          <button
            key={s.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onPick(s.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
              selected ? "bg-primary-soft/60 font-semibold text-foreground" : "text-foreground active:bg-muted",
            )}
          >
            <span className="w-7 shrink-0 text-center text-lg" aria-hidden="true">{s.emoji ?? "🏪"}</span>
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
          </button>
        );
      })}
      <div className="mt-1 border-t border-border pt-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate({ to: "/mehr", search: { catOrder: 1 } });
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-primary transition active:bg-primary-soft/40"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center" aria-hidden="true">
            <Plus className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 truncate">{t("store.new")}</span>
        </button>
      </div>
    </div>
  );
}
