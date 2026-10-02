// ============= Foto an einem Listeneintrag: Aufnahme, Miniaturansicht, Grossansicht =============
// Das Foto bleibt auf dem Gerät (IndexedDB); geteilte Listen sehen nur den Texteintrag.
import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { deleteItemPhoto, getItemPhoto, prepareItemPhoto, putItemPhoto } from "../lib/item-photo-store";

export function ItemPhoto({ itemId, readOnly = false }: { itemId: string; readOnly?: boolean }) {
  const { t } = useT();
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | undefined;
    getItemPhoto(itemId).then((blob) => {
      if (!alive || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrl(undefined);
      setZoom(false);
    };
  }, [itemId]);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await prepareItemPhoto(file);
      await putItemPhoto(itemId, blob);
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      /* Foto konnte nicht verarbeitet werden */
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    await deleteItemPhoto(itemId);
    setUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return undefined;
    });
    setZoom(false);
  };

  return (
    <>
      {url ? (
        <button
          onClick={() => setZoom(true)}
          className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border"
          aria-label={t("list.photoBig")}
        >
          <img src={url} alt="" className="h-full w-full object-cover" />
        </button>
      ) : readOnly ? null : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border text-base text-muted-foreground transition active:scale-90 disabled:opacity-50"
          aria-label={t("list.photoAdd")}
        >
          <span aria-hidden="true">{busy ? "…" : "📷"}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {zoom && url && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 p-6" onClick={() => setZoom(false)}>
          <img src={url} alt="" className="max-h-[70vh] max-w-full rounded-lg object-contain" />
          <div className="flex items-center gap-3">
            {!readOnly && <button
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="rounded-full border border-border px-4 py-2 text-sm text-foreground"
            >
              {t("list.photoAdd")}
            </button>}
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="rounded-full border border-border px-4 py-2 text-sm text-coral">
              {t("list.photoDelete")}
            </button>
            <button onClick={() => setZoom(false)} className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
