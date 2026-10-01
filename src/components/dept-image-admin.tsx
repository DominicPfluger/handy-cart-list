import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { prepareCategoryImage, uploadCategoryImage, deleteCategoryImage, signedCategoryImageUrl } from "@/lib/image-upload";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { Button } from "@/components/ui/button";

const T = (key: MessageKey) => translate(getLocale(), key);

/** Bereich „Kategoriebild" im Admin-Editor: Vorschau, Hochladen, Entfernen. */
export function DeptImageEditor({ deptId, imagePath, onChanged }: { deptId: string; imagePath: string | null; onChanged: (path: string | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    if (!imagePath) { setPreview(null); return; }
    signedCategoryImageUrl(imagePath).then((u) => { if (alive) setPreview(u); });
    return () => { alive = false; };
  }, [imagePath]);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const blob = await prepareCategoryImage(file);
      const path = await uploadCategoryImage(deptId, blob);
      const { error } = await supabase.from("departments").update({ image_path: path } as never).eq("id", deptId);
      if (error) throw error;
      onChanged(path);
      toast.success(T("adm.imageDone"));
    } catch {
      toast.error(T("adm.imageError"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!imagePath) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("departments").update({ image_path: null } as never).eq("id", deptId);
      if (error) throw error;
      await deleteCategoryImage(imagePath);
      onChanged(null);
      toast.success(T("adm.imageRemoved"));
    } catch {
      toast.error(T("adm.imageError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <h3 className="text-sm font-semibold text-foreground">{T("adm.image")}</h3>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
          {preview ? <img src={preview} alt="" className="h-full w-full object-contain" /> : <span className="text-2xl text-muted-foreground">🖼️</span>}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? T("adm.imageUploading") : T("adm.imageUpload")}
          </Button>
          {imagePath && (
            <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={handleRemove}>
              {T("adm.imageRemove")}
            </Button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">{T("adm.imageHint")}</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
      />
    </div>
  );
}
