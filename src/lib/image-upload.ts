import { supabase } from "@/integrations/supabase/client";

const SIZE = 512;

/** Verkleinert ein Bild auf 512x512 (zentrierter Zuschnitt) und liefert es freigestellt als komprimiertes WebP. */
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
    removeBackground(ctx);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.8));
    if (!blob) throw new Error("Bild konnte nicht konvertiert werden");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Stellt das Motiv frei: Füllt vom Bildrand aus alle Pixel, die der Randfarbe
 * ähneln, transparent (einfarbige Hintergründe). Bereits transparente Bilder bleiben.
 */
function removeBackground(ctx: CanvasRenderingContext2D) {
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;
  const corners = [0, SIZE - 1, (SIZE - 1) * SIZE, SIZE * SIZE - 1];
  if (corners.some((i) => d[i * 4 + 3]! < 250)) return;
  const [r, g, b] = [0, 1, 2].map((c) => corners.reduce((s, i) => s + d[i * 4 + c]!, 0) / 4);
  const near = (i: number, tol: number) =>
    Math.abs(d[i * 4]! - r!) + Math.abs(d[i * 4 + 1]! - g!) + Math.abs(d[i * 4 + 2]! - b!) < tol;
  if (!corners.every((i) => near(i, 60))) return; // kein einheitlicher Hintergrund
  const seen = new Uint8Array(SIZE * SIZE);
  const stack: number[] = [];
  for (let k = 0; k < SIZE; k++) stack.push(k, (SIZE - 1) * SIZE + k, k * SIZE, k * SIZE + SIZE - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i] || !near(i, 70)) continue;
    seen[i] = 1;
    d[i * 4 + 3] = 0;
    const x = i % SIZE, y = (i / SIZE) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < SIZE - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - SIZE);
    if (y < SIZE - 1) stack.push(i + SIZE);
  }
  ctx.putImageData(img, 0, 0);
}

/** Lädt ein vorbereitetes Bild in den Katalog-Speicher und gibt den Pfad zurück. */
export async function uploadCategoryImage(departmentId: string, blob: Blob): Promise<string> {
  const path = `departments/${departmentId}.png`;
  const { error } = await supabase.storage
    .from("catalog-images")
    .upload(path, blob, { contentType: "image/webp", upsert: true });
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
