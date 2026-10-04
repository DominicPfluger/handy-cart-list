import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate, getLocale } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { supabase } from "@/integrations/supabase/client";
import { makeProductIcon } from "@/lib/product-icon";
import { AiImageOptionSelects, DEFAULT_AI_IMAGE_OPTS, type AiImageOpts } from "@/components/admin/ai-image-options";

const T = (k: MessageKey, p?: Record<string, string | number>) => translate(getLocale(), k, p);

export type VariantAiChoice = { hint: string; opts: AiImageOpts; both: boolean };

type GenFn = (a: { data: { productId: string; variant: string; iconOnly?: boolean; hint?: string; opts?: AiImageOpts } }) => Promise<{ path: string }>;

async function fetchBlob(path: string) {
  const { data } = await supabase.storage.from("catalog-images").createSignedUrl(path, 600);
  if (!data?.signedUrl) throw new Error("Bild nicht verfügbar");
  return (await fetch(data.signedUrl)).blob();
}

/** Generates one (icon derived) or two separate AI images for a variant and stores the mapping. */
export async function generateVariantWithOptions(gen: GenFn, productId: string, variant: string, c: VariantAiChoice) {
  const hint = c.hint.trim() || undefined;
  const { path } = await gen({ data: { productId, variant, hint, opts: c.opts } });
  let iconSource = await fetchBlob(path);
  if (c.both) {
    const r = await gen({ data: { productId, variant, hint, opts: c.opts, iconOnly: true } });
    iconSource = await fetchBlob(r.path);
  }
  const icon = await makeProductIcon(iconSource);
  const iconPath = `variant-icons/${productId}-${crypto.randomUUID()}.webp`;
  const up = await supabase.storage.from("catalog-images").upload(iconPath, icon, { contentType: "image/webp" });
  if (up.error) throw up.error;
  const { error } = await supabase.from("product_variant_images").upsert({ product_id: productId, variant, image_path: path, icon_path: iconPath }, { onConflict: "product_id,variant" });
  if (error) throw error;
}

export function VariantAiDialog({ title, subtitle, defaultHint, showHint, onCancel, onRun }: {
  title: string; subtitle?: string; defaultHint: string; showHint: boolean; onCancel: () => void; onRun: (c: VariantAiChoice) => void;
}) {
  const [hint, setHint] = useState(defaultHint);
  const [opts, setOpts] = useState<AiImageOpts>(DEFAULT_AI_IMAGE_OPTS);
  const [both, setBoth] = useState(false);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-4 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">{T("tile.aiOptions")}</p>
          <Button size="icon" variant="ghost" aria-label={T("adm.cancel")} onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
        <p className="truncate text-xs text-muted-foreground">{title}{subtitle ? ` · ${subtitle}` : ""}</p>
        {showHint && (
          <label className="block space-y-1 text-xs text-muted-foreground">
            <span>{T("tile.aiHint")}</span>
            <textarea maxLength={300} rows={3} value={hint} onChange={(e) => setHint(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-2 text-sm text-foreground" />
          </label>
        )}
        <AiImageOptionSelects value={opts} onChange={setOpts} />
        <div className="space-y-1.5" role="radiogroup">
          {([false, true] as const).map((b) => (
            <label key={String(b)} className="flex cursor-pointer items-start gap-2 rounded-xl border border-input p-2 text-xs text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name="variant-ai-mode" checked={both === b} onChange={() => setBoth(b)} className="mt-0.5" />
              <span>{T(b ? "adm.noImg.modeTwo" : "adm.noImg.modeOne")}</span>
            </label>
          ))}
        </div>
        <Button size="sm" className="w-full" onClick={() => onRun({ hint: showHint ? hint : "", opts, both })}>{T("adm.noImg.generate")}</Button>
      </div>
    </div>
  );
}
