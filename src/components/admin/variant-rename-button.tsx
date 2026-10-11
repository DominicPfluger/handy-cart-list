import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translate, getLocale } from "@/i18n";

const T = (k: "adm.variantRename" | "adm.cancel") => translate(getLocale(), k);

/**
 * Variant name with inline rename (✎ → input, Enter/✓ saves, Esc/✕ cancels).
 * For variants already saved on the product, the attached picture moves to the
 * new name right away and old translations are dropped (re-translated on save).
 */
export function VariantNameEdit({ productId, variant, label, saved, existing, onRenamed }: {
  productId?: string | undefined; variant: string; /** Anzeigename in der aktuellen Sprache (Fallback: variant) */ label?: string | undefined; saved: boolean; existing: string[]; onRenamed: (next: string) => void;
}) {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    const next = (edit ?? "").trim();
    if (!next || next === variant) { setEdit(null); return; }
    if (existing.some((x) => x !== variant && x.toLowerCase() === next.toLowerCase())) { toast.error(`„${next}“ existiert bereits`); return; }
    setBusy(true);
    try {
      if (saved && productId) {
        const a = await supabase.from("product_variant_images").update({ variant: next }).eq("product_id", productId).eq("variant", variant);
        await supabase.from("variant_synonyms" as any).update({ variant: next }).eq("product_id", productId).eq("variant", variant);
        const b = await supabase.from("variant_translations").delete().eq("product_id", productId).eq("variant", variant);
        const err = a.error ?? b.error;
        if (err) { toast.error(err.message); return; }
        await qc.invalidateQueries({ queryKey: ["admin-variant-images", productId] });
      }
      onRenamed(next);
      setEdit(null);
    } finally { setBusy(false); }
  };

  if (edit === null) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate" title={label && label !== variant ? variant : undefined}>{label ?? variant}</span>
        <button type="button" aria-label={T("adm.variantRename")} title={T("adm.variantRename")} onClick={() => setEdit(variant)}
          className="shrink-0 rounded px-1 text-xs text-muted-foreground hover:text-foreground">✎</button>
      </span>
    );
  }
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1" onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}>
      <input autoFocus value={edit} disabled={busy} aria-label={T("adm.variantRename")} draggable={false}
        onChange={(e) => setEdit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); void commit(); }
          if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setEdit(null); }
        }}
        className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      <button type="button" aria-label="OK" disabled={busy} onClick={() => void commit()} className="shrink-0 rounded-md border border-border px-1.5 text-xs text-primary">✓</button>
      <button type="button" aria-label={T("adm.cancel")} disabled={busy} onClick={() => setEdit(null)} className="shrink-0 rounded-md border border-border px-1.5 text-xs text-muted-foreground">✕</button>
    </span>
  );
}
