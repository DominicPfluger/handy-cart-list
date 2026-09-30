// ============= Spracheingabe: Mikrofon-Button mit Web Speech API =============
import { useRef, useState } from "react";
import { toast } from "sonner";
import { MicIcon } from "./icons";
import { useT } from "../i18n";

/* eslint-disable @typescript-eslint/no-explicit-any */
type RecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceInputButton({
  onResult,
  className,
}: {
  onResult: (text: string) => void;
  className?: string;
}) {
  const { t, locale } = useT();
  const [listening, setListening] = useState(false);
  const recRef = useRef<RecognitionLike | null>(null);

  const start = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast.error(t("voice.notSupported"));
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = locale;
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e: any) => {
        const parts: string[] = [];
        for (let i = 0; i < e.results.length; i += 1) {
          parts.push(String(e.results[i]?.[0]?.transcript ?? ""));
        }
        const text = parts.join(" ").trim();
        if (text) onResult(text);
      };
      rec.onend = () => {
        setListening(false);
        recRef.current = null;
      };
      rec.onerror = () => {
        setListening(false);
        recRef.current = null;
      };
      recRef.current = rec;
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={start}
      aria-label={t("voice.add")}
      title={t("voice.add")}
      className={className}
    >
      <MicIcon className={`h-5 w-5 ${listening ? "animate-pulse text-coral" : ""}`} />
    </button>
  );
}
