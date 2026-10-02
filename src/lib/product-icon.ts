import { supabase } from "@/integrations/supabase/client";
import { forgetCatalogImage } from "./catalog-image-cache";

/** Creates a transparent, padded thumbnail rather than resizing a CSS box around a large image. */
export async function makeProductIcon(source: Blob): Promise<Blob> {
  const url = URL.createObjectURL(source);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Bild konnte nicht verkleinert werden");
    const scale = Math.min(60 / image.naturalWidth, 60 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, (64 - width) / 2, (64 - height) / 2, width, height);
    for (const quality of [0.68, 0.5, 0.35]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob || blob.type !== "image/webp") throw new Error("WebP-Komprimierung nicht verfügbar");
      if (blob.size <= 8 * 1024 || quality === 0.35) return blob;
    }
    throw new Error("Bild konnte nicht komprimiert werden");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Commits the icon after upload; an old icon is hidden first to avoid displaying stale imagery. */
export async function saveProductIcon(productId: string, source: Blob, imagePath: string): Promise<void> {
  const { error: clearError } = await supabase.from("products").update({ icon_path: null }).eq("id", productId);
  if (clearError) throw clearError;
  const icon = await makeProductIcon(source);
  const path = `product-icons/${productId}-${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from("catalog-images").upload(path, icon, { contentType: "image/webp" });
  if (uploadError) throw uploadError;
  const { error: updateError } = await supabase.from("products").update({ icon_path: path, image_path: imagePath }).eq("id", productId);
  if (updateError) throw updateError;
  await forgetCatalogImage(imagePath);
}

export async function saveProductIconFromPath(productId: string, path: string): Promise<void> {
  const { data, error } = await supabase.storage.from("catalog-images").createSignedUrl(path, 600);
  if (error || !data?.signedUrl) throw error ?? new Error("Bild nicht verfügbar");
  const response = await fetch(data.signedUrl);
  if (!response.ok) throw new Error(`Bild konnte nicht geladen werden (${response.status})`);
  await saveProductIcon(productId, await response.blob(), path);
}