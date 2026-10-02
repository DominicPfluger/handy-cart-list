import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

/** Zeigt den Katalog im Handy-Rahmen wie in der App-Abteilungsansicht. */
export function CatalogPreview({ onClose }: { onClose: () => void }) {
  const { t: T } = useT();
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-foreground/60 p-4" onClick={onClose}>
      <div className="flex w-full max-w-[400px] items-center justify-between text-background">
        <span className="font-bold">👁 {T("tile.preview")}</span>
        <Button size="sm" variant="secondary" onClick={onClose}>✕</Button>
      </div>
      <iframe
        src="/abteilungen"
        title={T("tile.preview")}
        className="h-[min(820px,85vh)] w-full max-w-[400px] rounded-3xl border-8 border-foreground bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
