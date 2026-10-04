import { useEffect, useState } from "react";
import { useT } from "../i18n";
import { useSpeakRate } from "../hooks/use-speak-rate";
import { useSpeakLocale } from "../hooks/use-speak-locale";
import { speakSentences } from "./speak-list-button";
import { CheckIcon } from "./icons";

const SPEAK_KEY = "shoppi:purchase-speak";

function readSpeakEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SPEAK_KEY) !== "0";
}

export interface PurchaseItem {
  id: string;
  name: string;
  /** Fertig formulierter Text für die Sprachausgabe (inkl. Menge). */
  spoken: string;
  quantity: string;
  checked: boolean;
  emoji: string;
  color?: string;
}

/** Freihändiger Kaufmodus: zeigt jeweils den nächsten offenen Artikel gross an,
 *  liest ihn vor und bestätigt mit einer grossen Tippefläche. */
export function PurchaseMode({ items, onToggle, onClose }: {
  items: PurchaseItem[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const [rate] = useSpeakRate();
  const [speakLocale] = useSpeakLocale();
  const [speakOn, setSpeakOn] = useState<boolean>(readSpeakEnabled);
  const current = items.find((i) => !i.checked);
  const done = items.filter((i) => i.checked).length;
  const allDone = !current;
  const progress = items.length ? (done / items.length) * 100 : 0;

  // Aktuellen Artikel vorlesen; beim Wechsel zum nächsten erneut.
  useEffect(() => {
    if (current && speakOn) speakSentences([current.spoken], speakLocale, rate);
    return () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, speakOn]);

  const toggleSpeak = () => {
    const next = !speakOn;
    setSpeakOn(next);
    try { window.localStorage.setItem(SPEAK_KEY, next ? "1" : "0"); } catch { /* ignore */ }
    if (!next) { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={t("purchase.title")}>
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("purchase.title")}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">{done}/{items.length}</span>
        <button onClick={onClose} aria-label={t("common.close")} className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground active:bg-muted">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {allDone ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="grid h-28 w-28 place-items-center rounded-full bg-primary text-6xl text-primary-foreground">✓</div>
          <p className="text-2xl font-bold text-foreground">{t("purchase.allDone")}</p>
          <button onClick={onClose} className="w-full max-w-xs rounded-2xl border border-border bg-card py-4 text-lg font-semibold text-foreground active:scale-[0.98]">
            {t("common.close")}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <div
              className="grid h-28 w-28 place-items-center overflow-hidden rounded-3xl text-6xl"
              style={current.color ? { backgroundColor: current.color } : undefined}
            >
              {current.emoji || "🛒"}
            </div>
            <p className="break-words text-3xl font-bold leading-tight text-foreground">{current.name}</p>
            {current.quantity && <p className="text-lg font-medium text-muted-foreground">{current.quantity}</p>}
          </div>
          <div className="px-5 pb-10">
            <button
              onClick={() => onToggle(current.id)}
              className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary py-8 text-2xl font-bold text-primary-foreground shadow-lg transition active:scale-[0.97]"
            >
              <CheckIcon className="h-7 w-7" /> {t("purchase.done")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
