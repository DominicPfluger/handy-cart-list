import { supabase } from "@/integrations/supabase/client";

const SIZE = 512;

/** Verkleinert ein Bild auf 512x512 (zentrierter Zuschnitt) und liefert es als PNG-Blob. */
export async function prepareCategoryImage(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas nicht verfügbar");
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Bild konnte nicht konvertiert werden");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Lädt ein vorbereitetes Bild in den Katalog-Speicher und gibt den Pfad zurück. */
export async function uploadCategoryImage(departmentId: string, blob: Blob): Promise<string> {
  const path = `departments/${departmentId}.png`;
  const { error } = await supabase.storage
    .from("catalog-images")
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw error;
  return path;
}

/** Entfernt das Bild einer Kategorie aus dem Speicher (Fehler werden ignoriert). */
export async function deleteCategoryImage(path: string): Promise<void> {
  await supabase.storage.from("catalog-images").remove([path]);
}

/** Signierte URL für die Vorschau im Admin-Panel (60 Minuten gültig). */
export async function signedCategoryImageUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("catalog-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}
