import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { generateVariantImage } from "@/lib/product-media.functions";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate, getLocale } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { supabase } from "@/integrations/supabase/client";
import { makeProductIcon } from "@/lib/product-icon";
import { AiImagePromptDialog } from "./ai-image-dialog";
import type { AiImageOpts } from "./ai-image-options";

const T = (k: MessageKey, p?: Record<string, string | number>) => translate(getLocale(), k, p);

export type VariantAiChoice = { hint: string; opts: AiImageOpts; both: boolean };

type GenFn = (a: { data: { productId: string; variant: string; iconOnly?: boolean; hint?: string | undefined; opts?: AiImageOpts } }) => Promise<{ path: string }>;

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
  title: string; subtitle?: string | undefined; defaultHint: string; showHint: boolean; onCancel: () => void; onRun: (c: VariantAiChoice) => void;
}) {
  return (
    <AiImagePromptDialog
      title={subtitle ? `${title} · ${subtitle}` : title}
      defaultHint={defaultHint}
      showHint={showHint}
      onRun={onRun}
      onCancel={onCancel}
    />
  );
}

/** Button that generates AI images for all saved variants without a picture, sequentially with progress + cancel. */
export function VariantAiBulkButton({ productId, productName, variants }: { productId: string; productName: string; variants: string[] }) {
  const qc = useQueryClient();
  const gen = useServerFn(generateVariantImage);
  const [dlg, setDlg] = useState(false);
  const [prog, setProg] = useState<{ done: number; total: number } | null>(null);
  const stop = useRef(false);
  const rows = useQuery({
    queryKey: ["admin-variant-images", productId, "bulk"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_variant_images").select("variant").eq("product_id", productId);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.variant));
    },
  });
  const missing = variants.filter((v) => rows.data && !rows.data.has(v));
  if (!rows.data || (missing.length === 0 && !prog)) return null;

  const run = async (c: VariantAiChoice) => {
    setDlg(false);
    stop.current = false;
    const list = [...missing];
    let ok = 0;
    setProg({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      if (stop.current) break;
      const v = list[i]!;
      try { await generateVariantWithOptions(gen, productId, v, c); ok++; }
      catch (e) { toast.error(`${v}: ${e instanceof Error ? e.message : String(e)}`); }
      setProg({ done: i + 1, total: list.length });
    }
    setProg(null);
    await qc.invalidateQueries({ queryKey: ["admin-variant-images", productId] });
    await qc.invalidateQueries({ queryKey: ["catalog"] });
    await qc.invalidateQueries({ queryKey: ["catalog-images"] });
    if (ok) toast.success(T("adm.variantAi.done", { n: ok }));
  };

  return (
    <>
      {prog ? (
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          ⏳ {prog.done} / {prog.total}
          <button type="button" className="rounded-md border border-border px-2 py-0.5 hover:bg-muted" onClick={() => { stop.current = true; }}>{T("adm.cancel")}</button>
        </span>
      ) : (
        <button type="button" onClick={() => setDlg(true)} className="rounded-md border border-border px-2 py-1 text-xs text-primary hover:bg-muted">
          ✨ {T("adm.variantAi.all", { n: missing.length })}
        </button>
      )}
      {dlg && <VariantAiDialog title={productName} subtitle={T("adm.variantAi.all", { n: missing.length })} defaultHint="" showHint={false} onCancel={() => setDlg(false)} onRun={(c) => void run(c)} />}
    </>
  );
}
