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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const scale = Math.min(60 / image.naturalWidth, 60 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, (64 - width) / 2, (64 - height) / 2, width, height);
    // Icons werden immer als WebP und möglichst unter 8 KB gespeichert.
    for (const quality of [0.72, 0.58, 0.44, 0.3, 0.2]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob || blob.type !== "image/webp") throw new Error("WebP-Komprimierung nicht verfügbar");
      if (blob.size <= 8 * 1024) return blob;
    }
    const fallback = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.12));
    if (!fallback || fallback.type !== "image/webp") throw new Error("Bild konnte nicht komprimiert werden");
    return fallback;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Creates a missing icon; an existing icon is preserved unless replacement was explicitly confirmed. */
export async function saveProductIcon(productId: string, source: Blob, imagePath: string, force = false): Promise<void> {
  const { data: cur } = await supabase.from("products").select("icon_path").eq("id", productId).single();
  if (cur?.icon_path && !force) {
    const { error } = await supabase.from("products").update({ image_path: imagePath }).eq("id", productId);
    if (error) throw error;
    await forgetCatalogImage(imagePath);
    return;
  }
  const { error: clearError } = await supabase.from("products").update({ icon_path: null }).eq("id", productId);
  if (clearError) throw clearError;
  const icon = await makeProductIcon(source);
  const path = `product-icons/${productId}-${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from("catalog-images").upload(path, icon, { contentType: "image/webp" });
  if (uploadError) throw uploadError;
  const { error: updateError } = await supabase.from("products").update({ icon_path: path, image_path: imagePath, ...(force ? { icon_custom: false } : {}) }).eq("id", productId);
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
type IconKind = "product" | "department";
const iconTable = (k: IconKind) => (k === "product" ? "products" : "departments");

/** Separately uploaded icon; never overwritten by later preview images. */
export async function saveCustomIcon(kind: IconKind, id: string, source: Blob): Promise<string> {
  const icon = await makeProductIcon(source);
  const path = `${kind}-icons/${id}-${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage.from("catalog-images").upload(path, icon, { contentType: "image/webp" });
  if (uploadError) throw uploadError;
  const { error } = await supabase.from(iconTable(kind)).update({ icon_path: path, icon_custom: true }).eq("id", id);
  if (error) throw error;
  return path;
}

/** Saves an existing catalog image (preview image or picker selection) as the custom icon. */
export async function saveCustomIconFromPath(kind: IconKind, id: string, path: string): Promise<void> {
  const { data, error } = await supabase.storage.from("catalog-images").createSignedUrl(path, 600);
  if (error || !data?.signedUrl) throw error ?? new Error("Bild nicht verfügbar");
  const response = await fetch(data.signedUrl);
  if (!response.ok) throw new Error(`Bild konnte nicht geladen werden (${response.status})`);
  await saveCustomIcon(kind, id, await response.blob());
}

/** Removes a custom icon; products fall back to the auto icon of their preview image. */
export async function clearCustomIcon(kind: IconKind, id: string): Promise<void> {
  const { data, error } = await supabase.from(iconTable(kind)).select("image_path").eq("id", id).single();
  if (error) throw error;
  const { error: e2 } = await supabase.from(iconTable(kind)).update({ icon_path: null, icon_custom: false }).eq("id", id);
  if (e2) throw e2;
  if (kind === "product" && data?.image_path) await saveProductIconFromPath(id, data.image_path);
}

/** Sets only the large preview image; an existing small icon stays untouched. */
export async function setPreviewImageOnly(kind: IconKind, id: string, imagePath: string): Promise<void> {
  const { error } = await supabase.from(iconTable(kind)).update({ image_path: imagePath }).eq("id", id);
  if (error) throw error;
  await forgetCatalogImage(imagePath);
}
