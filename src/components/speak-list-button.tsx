import { useEffect, useState } from "react";
import { toast } from "sonner";
import { translate, useT } from "../i18n";
import { useSpeakRate } from "../hooks/use-speak-rate";
import { useSpeakLocale } from "../hooks/use-speak-locale";
import { fillSpeech, resolveSpeechText, useSpeechTexts } from "../lib/speech-texts";

export interface SpeakGroup {
  label: string;
  items: string[];
}

/** Liest Sätze mit passender Stimme der gewünschten Sprache vor. */
export function findVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const lang = locale.slice(0, 2).toLowerCase();
  return voices.find((v) => norm(v.lang) === locale.toLowerCase())
    ?? voices.find((v) => norm(v.lang).split("-")[0] === lang);
}

/** true wenn Stimmen geladen sind, aber keine zur Sprache passt. */
export function missingVoice(locale: string): boolean {
  const voices = window.speechSynthesis.getVoices();
  return voices.length > 0 && !findVoice(locale);
}

/** Kürzel, die die deutsche Sprachausgabe ausschreiben soll. */
function expandAbbreviations(text: string, locale: string): string {
  if (!locale.toLowerCase().startsWith("de")) return text;
  return text
    .replace(/\bStk\.?/g, "Stück")
    .replace(/\bPkg\.?/g, "Packung");
}

export function speakSentences(sentences: string[], locale: string, rate: number, onDone?: () => void) {
  const synth = window.speechSynthesis;
  const voice = findVoice(locale);
  synth.cancel();
  const list = sentences.filter((s) => s.trim()).map((s) => expandAbbreviations(s, locale));
  list.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    if (voice) u.voice = voice;
    u.rate = rate;
    if (i === list.length - 1 && onDone) {
      u.onend = onDone;
      u.onerror = onDone;
    }
    synth.speak(u);
  });
}

/** groups: Funktion, die die Gruppen in der Vorlese-Sprache liefert. */
export function SpeakListButton({ title, groups }: { title: string; groups: (speakLocale: string) => SpeakGroup[] }) {
  const { t } = useT();
  const [speaking, setSpeaking] = useState(false);
  const [rate] = useSpeakRate();
  const [speakLocale] = useSpeakLocale();
  const { data: rows } = useSpeechTexts();

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const toggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error(t("speak.unsupported"));
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const gs = groups(speakLocale).filter((g) => g.items.length);
    const count = gs.reduce((n, g) => n + g.items.length, 0);
    const tx = (k: "intro" | "empty" | "group" | "outro") => resolveSpeechText(rows, speakLocale, k, count);
    if (missingVoice(speakLocale)) toast.warning(translate(speakLocale, "speak.noVoice"));
    const sentences = count === 0
      ? [fillSpeech(tx("empty"), { name: title, count: 0 })]
      : [
          fillSpeech(tx("intro"), { name: title, count }),
          ...gs.map((g) => fillSpeech(tx("group"), { kategorie: g.label, artikel: g.items.join(", ") })),
          fillSpeech(tx("outro"), { name: title, count }),
        ];
    speakSentences(sentences, speakLocale, rate, () => setSpeaking(false));
    setSpeaking(true);
  };

  const label = speaking ? t("speak.stop") : t("speak.read");
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={speaking}
      title={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-primary active:bg-muted"
    >
      {speaking ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" />
        </svg>
      )}
    </button>
  );
}
