import { useState } from "react";
import { getLocale, translate } from "@/i18n";
import type { MessageKey } from "@/i18n/de";

const T = (key: MessageKey) => translate(getLocale(), key);

/** Bild, das per Doppelklick eine Grossansicht (Vorschau) öffnet. */
export function ZoomableImage({ src, className }: { src: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <img src={src} alt="" className={className} onDoubleClick={() => setOpen(true)} />
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/70 p-6" onClick={() => setOpen(false)}>
          <button type="button" aria-label={T("common.cancel")} onClick={() => setOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-xl text-foreground shadow">✕</button>
          <img src={src} alt="" className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
        </div>
      )}
    </>
  );
}
