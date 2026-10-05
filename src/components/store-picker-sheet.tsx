import { Check } from "lucide-react";
import { useStores } from "@/hooks/use-stores";
import { useGroupOrder } from "@/hooks/use-group-order";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

/** Bottom-Sheet zur Laden-Wahl: Läden des gewählten Marktes + eigene Läden + „Standard". */
export function StorePickerSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useT();
  const stores = useStores();
  const { store, setStore } = useGroupOrder();

  const pick = (id: string) => {
    setStore(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="max-h-[75vh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-2"
      >
        <SheetHeader>
          <SheetTitle className="text-base">{t("store.label")}</SheetTitle>
        </SheetHeader>
        <div className="mt-3 space-y-1" role="listbox" aria-label={t("store.label")}>
          {stores.map((s) => {
            const selected = s.id === store;
            return (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => pick(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition",
                  selected ? "bg-primary-soft/60 font-semibold text-foreground" : "text-foreground active:bg-muted",
                )}
              >
                <span className="w-7 shrink-0 text-center text-lg" aria-hidden="true">{s.emoji ?? "🏪"}</span>
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
