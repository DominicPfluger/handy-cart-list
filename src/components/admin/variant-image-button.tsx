import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { translate, getLocale } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { prepareCategoryImage } from "@/lib/image-upload";
import { makeProductIcon } from "@/lib/product-icon";
import { generateVariantImage } from "@/lib/product-media.functions";
import { VariantAiDialog, generateVariantWithOptions } from "@/components/admin/variant-ai-dialog";
import { ImageZoomOverlay } from "@/components/admin/zoomable-image";

const T = (k: MessageKey, p?: Record<string, string | number>) => translate(getLocale(), k, p);

type Row = { variant: string; image_path: string | null; icon_path: string | null };

/** Admin control for one variant's picture: click the picture for a large view, use the menu to upload, generate or remove. */
export function VariantImageButton({ productId, productName, variant }: { productId: string; productName?: string; variant: string }) {
  const qc = useQueryClient();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const gen = useServerFn(generateVariantImage);
  const rows = useQuery({
    queryKey: ["admin-variant-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_variant_images").select("variant, image_path, icon_path").eq("product_id", productId);
      if (error) throw error;
      const paths = (data ?? []).flatMap((r) => [r.image_path, r.icon_path]).filter((x): x is string => Boolean(x));
      const urls: Record<string, string> = {};
      if (paths.length) {
        const { data: s } = await supabase.storage.from("catalog-images").createSignedUrls(paths, 3600);
        for (const e of s ?? []) if (e.path && e.signedUrl) urls[e.path] = e.signedUrl;
      }
      return { rows: (data ?? []) as Row[], urls };
    },
  });
  const row = rows.data?.rows.find((r) => r.variant === variant);
  const thumbPath = row?.icon_path ?? row?.image_path;
  const thumb = thumbPath ? rows.data?.urls[thumbPath] : undefined;
  const bigPath = row?.image_path ?? row?.icon_path;
  const big = bigPath ? rows.data?.urls[bigPath] : undefined;

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["admin-variant-images", productId] });
    await qc.invalidateQueries({ queryKey: ["catalog"] });
    await qc.invalidateQueries({ queryKey: ["catalog-images"] });
  };

  const saveFromBlob = async (blob: Blob, imagePath: string) => {
    const icon = await makeProductIcon(blob);
    const iconPath = `variant-icons/${productId}-${crypto.randomUUID()}.webp`;
    const up = await supabase.storage.from("catalog-images").upload(iconPath, icon, { contentType: "image/webp" });
    if (up.error) throw up.error;
    const { error } = await supabase.from("product_variant_images").upsert({ product_id: productId, variant, image_path: imagePath, icon_path: iconPath }, { onConflict: "product_id,variant" });
    if (error) throw error;
  };

  const wrap = async (fn: () => Promise<void>, done: MessageKey) => {
    setBusy(true);
    try { await fn(); await refresh(); toast.success(T(done)); setOpen(false); }
    catch (e) { toast.error(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const upload = (f: File) => wrap(async () => {
    const blob = await prepareCategoryImage(f);
    const path = `variants/${productId}-${crypto.randomUUID()}.webp`;
    const up = await supabase.storage.from("catalog-images").upload(path, blob, { contentType: "image/webp" });
    if (up.error) throw up.error;
    await saveFromBlob(blob, path);
  }, "adm.variantImageSaved");

  const generate = () => { setOpen(false); setAiOpen(true); };

  const remove = () => {
    if (!window.confirm(T("tile.removeImageConfirm"))) return;
    void wrap(async () => {
      const { error } = await supabase.from("product_variant_images").delete().eq("product_id", productId).eq("variant", variant);
      if (error) throw error;
    }, "tile.imageRemoved");
  };

  return (
    <span className="relative flex shrink-0 items-center gap-1">
      <button type="button" aria-label={big ? T("adm.variantImageBig") : T("adm.variantImage")} title={big ? T("adm.variantImageBig") : T("adm.variantImage")}
        onClick={() => (big ? setZoom(true) : setOpen((o) => !o))} disabled={busy}
        className="grid h-8 w-8 place-items-center overflow-hidden rounded-md border border-border bg-muted text-xs">
        {busy ? "⏳" : thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : "🖼️"}
      </button>
      <button type="button" aria-label={T("adm.variantImageMenu")} title={T("adm.variantImageMenu")} onClick={() => setOpen((o) => !o)} disabled={busy}
        className="grid h-8 w-6 place-items-center rounded-md border border-border bg-muted text-xs text-muted-foreground hover:bg-background">⋮</button>
      {open && (
        <span className="absolute right-0 top-9 z-10 flex w-44 flex-col rounded-lg border border-border bg-background p-1 text-left text-sm shadow-md">
          <button type="button" className="rounded px-2 py-1.5 text-left hover:bg-muted" onClick={() => file.current?.click()}>📷 {T("adm.variantImageUpload")}</button>
          <button type="button" className="rounded px-2 py-1.5 text-left hover:bg-muted" onClick={generate}>✨ {T("tile.aiImage")}</button>
          {row && <button type="button" className="rounded px-2 py-1.5 text-left text-destructive hover:bg-muted" onClick={remove}>🗑️ {T("adm.variantImageRemove")}</button>}
        </span>
      )}
      {aiOpen && (
        <VariantAiDialog title={variant} subtitle={productName} showHint
          defaultHint={productName ? `${variant} von ${productName}` : variant}
          onCancel={() => setAiOpen(false)}
          onRun={(c) => { setAiOpen(false); void wrap(() => generateVariantWithOptions(gen, productId, variant, c), "adm.variantImageSaved"); }} />
      )}
      {zoom && big && <ImageZoomOverlay src={big} open onClose={() => setZoom(false)} />}
      <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }} />
    </span>
  );
}
