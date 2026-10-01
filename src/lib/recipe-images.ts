// Rezeptfotos: privater Speicher-Bucket, lesbar für alle über signierte Links.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "recipe-images";

/** Verkleinert das Foto (max. 1200 px, JPEG) und lädt es in den Ordner des Nutzers. */
export async function uploadRecipeImage(userId: string, file: File): Promise<string> {
  const blob = await shrink(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return path;
}

async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("image"))), "image/jpeg", 0.82));
}

export async function setRecipeImage(recipeId: string, path: string | null) {
  const { error } = await supabase.from("recipes").update({ image_path: path }).eq("id", recipeId);
  if (error) throw error;
}

export function useRecipeImageUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["recipe-image", path],
    enabled: !!path,
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path!, 3600);
      return data?.signedUrl ?? null;
    },
  }).data ?? null;
}
