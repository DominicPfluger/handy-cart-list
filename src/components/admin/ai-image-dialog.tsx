import { useId, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate, getLocale } from "@/i18n";
import type { MessageKey } from "@/i18n/de";
import { AiImageOptionSelects, DEFAULT_AI_IMAGE_OPTS, type AiImageOpts } from "./ai-image-options";

const T = (k: MessageKey, p?: Record<string, string | number>) => translate(getLocale(), k, p);

export interface AiImageChoice { hint: string; opts: AiImageOpts; both: boolean }

/**
 * Gemeinsamer KI-Bild-Dialog: Bildbeschreibung, Stil-Optionen und Wahl zwischen
 * einem Bild (Icon daraus abgeleitet) oder zwei unterschiedlichen Bildern.
 * Wird von Pflege → Produkte ohne Bild und von den Produktvarianten genutzt.
 */
export function AiImagePromptDialog({ title, titleKey = "tile.aiOptions", defaultHint = "", showHint = true, disabled = false, children, onRun, onCancel }: {
  /** Zielzeile, z. B. Produktname */
  title?: ReactNode;
  titleKey?: MessageKey;
  defaultHint?: string;
  showHint?: boolean;
  disabled?: boolean;
  /** Zusätzliche Auswahl über den Optionen */
  children?: ReactNode;
  onRun: (c: AiImageChoice) => void;
  onCancel: () => void;
}) {
  const radioName = useId();
  const [hint, setHint] = useState(defaultHint);
  const [opts, setOpts] = useState<AiImageOpts>(DEFAULT_AI_IMAGE_OPTS);
  const [both, setBoth] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm space-y-3 rounded-2xl bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">{T(titleKey)}</p>
          <Button size="icon" variant="ghost" aria-label={T("adm.cancel")} onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
        {title ? <p className="truncate text-xs text-muted-foreground">{title}</p> : null}
        {children}
        {showHint && (
          <label className="block space-y-1 text-xs text-muted-foreground">
            <span>{T("tile.aiHint")}</span>
            <textarea maxLength={300} rows={3} value={hint} onChange={(e) => setHint(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-2 text-sm text-foreground" />
          </label>
        )}
        <AiImageOptionSelects value={opts} onChange={setOpts} />
        <div className="space-y-1.5" role="radiogroup" aria-label={T("adm.noImg.options")}>
          {([false, true] as const).map((b) => (
            <label key={String(b)} className="flex cursor-pointer items-start gap-2 rounded-xl border border-input p-2 text-xs text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input type="radio" name={radioName} checked={both === b} onChange={() => setBoth(b)} className="mt-0.5" />
              <span>{T(b ? "adm.noImg.modeTwo" : "adm.noImg.modeOne")}</span>
            </label>
          ))}
        </div>
        <Button size="sm" className="w-full" disabled={disabled} onClick={() => onRun({ hint: showHint ? hint : "", opts, both })}>{T("adm.noImg.generate")}</Button>
      </div>
    </div>
  );
}
