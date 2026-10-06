import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translate, getLocale } from "@/i18n";

const T = (k: "adm.variantRename") => translate(getLocale(), k);

/**
 * Renames a variant in the editor. For variants already saved on the product,
 * the attached picture and translations are moved to the new name right away
 * so nothing is lost; the variant list itself is saved with the dialog.
 */
export function VariantRenameButton({ productId, variant, saved, existing, onRenamed }: {
  productId?: string | undefined; variant: string; saved: boolean; existing: string[]; onRenamed: (next: string) => void;
}) {
  const qc = useQueryClient();
  const click = async () => {
    const next = window.prompt(T("adm.variantRename"), variant)?.trim();
    if (!next || next === variant) return;
    if (existing.some((x) => x !== variant && x.toLowerCase() === next.toLowerCase())) { toast.error(`„${next}“ existiert bereits`); return; }
    if (saved && productId) {
      const a = await supabase.from("product_variant_images").update({ variant: next }).eq("product_id", productId).eq("variant", variant);
      const b = await supabase.from("variant_translations").delete().eq("product_id", productId).eq("variant", variant);
      const err = a.error ?? b.error;
      if (err) { toast.error(err.message); return; }
      await qc.invalidateQueries({ queryKey: ["admin-variant-images", productId] });
    }
    onRenamed(next);
  };
  return (
    <button type="button" aria-label={T("adm.variantRename")} title={T("adm.variantRename")} onClick={() => void click()}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border text-xs text-muted-foreground hover:text-foreground">✎</button>
  );
}
