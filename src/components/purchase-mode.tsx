import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { useSpeakRate } from "../hooks/use-speak-rate";
import { useSpeakLocale } from "../hooks/use-speak-locale";
import { expandAbbreviations, findVoice } from "./speak-list-button";
import { CheckIcon } from "./icons";
import { CachedImage } from "./catalog-icon";

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
  /** Grosses Produktbild (Pfad im Bild-Speicher + signierte Adresse). */
  imagePath?: string | null | undefined;
  imageUrl?: string | null | undefined;
  group?: string;
  groupEmoji?: string;
  note?: string;
  organic?: boolean;
}

function vibrate(ms: number | number[]) {
  try { navigator.vibrate?.(ms); } catch { /* ignore */ }
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
  // Übersprungene Artikel ans Ende der offenen Reihenfolge stellen.
  const [skipped, setSkipped] = useState<string[]>([]);
  const [pos, setPos] = useState(0);
  const [doneStack, setDoneStack] = useState<string[]>([]);
  const [viewDone, setViewDone] = useState<string | null>(null);
  const open = items.filter((i) => !i.checked);
  const seq = [
    ...open.filter((i) => !skipped.includes(i.id)),
    ...skipped.map((id) => open.find((i) => i.id === id)).filter((i): i is PurchaseItem => !!i),
  ];
  const safePos = Math.min(pos, Math.max(0, seq.length - 1));
  const doneItem = viewDone ? items.find((i) => i.id === viewDone && i.checked) : undefined;
  const current = doneItem ?? seq[safePos];
  const nextItem = doneItem ? seq[safePos] : seq[safePos + 1];
  const nextDept = seq.slice(doneItem ? safePos : safePos + 1).find((i) => i.group && i.group !== current?.group);
  const done = items.filter((i) => i.checked).length;
  const allDone = !current;
  const lastDone = [...doneStack].reverse().find((id) => items.some((i) => i.id === id && i.checked));

  // Bildschirm aktiv halten, solange der Kaufmodus offen ist.
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    if (!nav.wakeLock) return;
    let lock: { release: () => Promise<void> } | null = null;
    let alive = true;
    const req = async () => {
      try { const l = await nav.wakeLock!.request("screen"); if (alive) lock = l; else void l.release(); } catch { /* ignore */ }
    };
    const onVis = () => { if (document.visibilityState === "visible") void req(); };
    void req();
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; document.removeEventListener("visibilitychange", onVis); void lock?.release().catch(() => {}); };
  }, []);

  const markDone = () => {
    if (!current) return;
    vibrate(35);
    if (doneItem) { onToggle(doneItem.id); setViewDone(null); return; }
    setDoneStack((s) => [...s, current.id]);
    setSkipped((s) => s.filter((x) => x !== current.id));
    onToggle(current.id);
  };
  const skip = () => {
    if (!current || doneItem || seq.length < 2) return;
    vibrate(15);
    setSkipped((s) => [...s.filter((x) => x !== current.id), current.id]);
  };
  const goPrev = () => {
    if (doneItem) return;
    if (safePos > 0) setPos(safePos - 1);
    else if (lastDone) setViewDone(lastDone);
  };
  const goNext = () => {
    if (doneItem) { setViewDone(null); return; }
    if (safePos < seq.length - 1) setPos(safePos + 1);
  };
  const progress = items.length ? (done / items.length) * 100 : 0;

  // Aktuellen Artikel vorlesen; beim Wechsel zum nächsten erneut.
  // Kurze Verzögerung: Chrome verwirft speak() direkt nach cancel(); Stimmen laden evtl. asynchron.
  useEffect(() => {
    if (!current || !speakOn || typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    let cancelled = false;
    let spoken = false;
    const run = () => {
      if (cancelled || spoken) return;
      spoken = true;
      try { synth.resume(); } catch { /* ignore */ }
      speakNow(current.spoken);
    };
    let timer: number;
    if (synth.getVoices().length === 0) {
      const onVoices = () => { synth.removeEventListener("voiceschanged", onVoices); run(); };
      synth.addEventListener("voiceschanged", onVoices);
      timer = window.setTimeout(() => { synth.removeEventListener("voiceschanged", onVoices); run(); }, 600);
    } else {
      synth.cancel();
      timer = window.setTimeout(run, 150);
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      try { synth.cancel(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.spoken, speakOn, speakLocale]);

  // Eigene Ausgabe ohne cancel() direkt vor speak() (Chrome verwirft sonst die Ausgabe);
  // Referenz halten, damit Chrome die Äusserung nicht vorzeitig verwirft.
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakNow = (text: string) => {
    const synth = window.speechSynthesis;
    if (!synth || !text.trim()) return;
    const u = new SpeechSynthesisUtterance(expandAbbreviations(text, speakLocale));
    u.lang = speakLocale;
    const voice = findVoice(speakLocale);
    if (voice) u.voice = voice;
    u.rate = rate;
    uttRef.current = u;
    synth.speak(u);
  };

  const toggleSpeak = () => {
    const next = !speakOn;
    setSpeakOn(next);
    try { window.localStorage.setItem(SPEAK_KEY, next ? "1" : "0"); } catch { /* ignore */ }
    if (!next) { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }
    // Direkt in der Klick-Geste sprechen (Safari/iOS gibt Sprachausgabe nur so frei).
    else if (current) { try { window.speechSynthesis.cancel(); speakNow(current.spoken); } catch { /* ignore */ } }
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={t("purchase.title")}>
      <div className="flex items-center gap-3 px-5 pt-4">
        <p className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("purchase.title")}</p>
        <span className="text-sm font-semibold text-muted-foreground">{done}/{items.length}</span>
        <button
          onClick={toggleSpeak}
          aria-label={speakOn ? t("purchase.speakOff") : t("purchase.speakOn")}
          aria-pressed={speakOn}
          title={speakOn ? t("purchase.speakOff") : t("purchase.speakOn")}
          className={`grid h-10 w-10 place-items-center rounded-full active:bg-muted ${speakOn ? "text-primary" : "text-muted-foreground"}`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            {speakOn ? (
              <>
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M19 5a10 10 0 0 1 0 14" />
              </>
            ) : (
              <>
                <path d="m22 9-6 6" />
                <path d="m16 9 6 6" />
              </>
            )}
          </svg>
        </button>
        <button onClick={onClose} aria-label={t("common.close")} className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground active:bg-muted">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Grüner Statusbalken zwischen Titelleiste und Produktbild */}
      <div className="mt-3 h-1.5 w-full bg-muted" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={t("purchase.title")}>
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
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
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            {current.group && (
              <span className="rounded-full px-4 py-1 text-sm font-semibold text-foreground" style={current.color ? { backgroundColor: current.color } : undefined}>
                {current.groupEmoji} {current.group}
              </span>
            )}
            {doneItem && <span className="text-sm font-semibold text-primary">✓ {t("purchase.alreadyDone")}</span>}
            <div
              className="grid h-48 w-48 place-items-center overflow-hidden rounded-3xl text-8xl"
              style={current.color ? { backgroundColor: current.color } : undefined}
            >
              {current.imagePath ? (
                <CachedImage
                  key={current.imagePath}
                  path={current.imagePath}
                  signedUrl={current.imageUrl}
                  className="h-full w-full object-cover"
                  fallback={<span aria-hidden="true">{current.emoji || "🛒"}</span>}
                />
              ) : (
                current.emoji || "🛒"
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="break-words text-3xl font-bold leading-tight text-foreground">{(() => { const k = current.name.indexOf(" · "); return k >= 0 ? current.name.slice(0, k) : current.name; })()}</p>
              {current.quantity && <p className="text-lg font-medium text-muted-foreground">{current.quantity}</p>}
              <div className="flex flex-wrap justify-center gap-2">
                {current.organic && <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">🌱 {t("purchase.organic")}</span>}
                {current.name.includes(" · ") && <span className="rounded-full border border-border px-3 py-1 text-sm font-medium text-foreground">{current.name.slice(current.name.indexOf(" · ") + 3)}</span>}
              </div>
              {current.note && (
                <p className="max-w-xs rounded-xl bg-muted px-4 py-2 text-base text-foreground"><span aria-hidden="true">📝 </span><span className="sr-only">{t("purchase.note")}: </span>{current.note}</p>
              )}
            </div>
          </div>
          {(nextItem || nextDept) && !doneItem && (
            <div className="mx-5 mb-3 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
              {nextItem && <p className="truncate"><span className="font-semibold">{t("purchase.upNext")}:</span> {nextItem.name}</p>}
              {nextDept && nextDept.group !== nextItem?.group && (
                <p className="truncate"><span className="font-semibold">{t("purchase.nextDept")}:</span> {nextDept.groupEmoji} {nextDept.group}</p>
              )}
              {nextDept && nextDept.group === nextItem?.group && (
                <p className="truncate"><span className="font-semibold">{t("purchase.nextDept")}:</span> {nextDept.groupEmoji} {nextDept.group}</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 px-5 pb-3">
            <button onClick={goPrev} disabled={!!doneItem || (safePos === 0 && !lastDone)} aria-label={t("purchase.prev")} className="grid h-14 w-14 place-items-center rounded-2xl border border-border text-2xl text-foreground disabled:opacity-30 active:bg-muted">‹</button>
            <button onClick={skip} disabled={!!doneItem || seq.length < 2} className="h-14 flex-1 rounded-2xl border border-border text-lg font-semibold text-foreground disabled:opacity-30 active:bg-muted">↷ {t("purchase.skip")}</button>
            <button onClick={goNext} disabled={!doneItem && safePos >= seq.length - 1} aria-label={t("purchase.next")} className="grid h-14 w-14 place-items-center rounded-2xl border border-border text-2xl text-foreground disabled:opacity-30 active:bg-muted">›</button>
          </div>
          <div className="px-5 pb-10">
            <button
              onClick={markDone}
              className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary py-8 text-2xl font-bold text-primary-foreground shadow-lg transition active:scale-[0.97]"
            >
              {doneItem ? <>↺ {t("purchase.reopen")}</> : <><CheckIcon className="h-7 w-7" /> {t("purchase.done")}</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
