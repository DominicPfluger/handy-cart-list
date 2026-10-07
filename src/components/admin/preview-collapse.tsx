import { useState, type ReactNode } from "react";
import { ZoomableImage } from "./zoomable-image";

/** Aufklappbares Vorschaubild: zugeklappt kleine Vorschau mit Pfeil, aufgeklappt grosses Bild plus Aktionen. */
export function PreviewCollapse({ label, src, emoji, defaultOpen = false, children }: {
  label: string;
  src?: string | null;
  emoji?: string | null;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const img = src ?? null;
  return (
    <div className="space-y-2 rounded-xl border border-border p-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-2xl">
          {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : emoji || "🛒"}
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{label}</span>
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <>
          <div className="flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {img ? <ZoomableImage src={img} className="max-h-64 w-full object-contain" /> : <span className="py-10 text-4xl">{emoji || "🛒"}</span>}
          </div>
          {children}
        </>
      )}
    </div>
  );
}

/** Aufklappbares Icon: zugeklappt nur kleine Vorschau mit Pfeil, aufgeklappt grössere Vorschau plus Aktionen. */
export function IconCollapse({ label, hint, src, emoji, defaultOpen = false, children }: {
  label: string;
  hint?: string;
  src?: string | null;
  emoji?: string | null;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-2 rounded-xl border border-border p-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {src ? <img src={src} alt="" className="h-full w-full object-contain" /> : <span className="text-xl">{emoji || "🛒"}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">{label}</span>
          {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
        </span>
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <>
          <div className="flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {src ? <img src={src} alt="" className="h-24 w-auto object-contain" /> : <span className="py-6 text-4xl">{emoji || "🛒"}</span>}
          </div>
          {children}
        </>
      )}
    </div>
  );
}
