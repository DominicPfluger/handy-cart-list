import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useT } from "../i18n";

export interface SpeakGroup {
  label: string;
  items: string[];
}

export function SpeakListButton({ title, groups }: { title: string; groups: SpeakGroup[] }) {
  const { t, locale } = useT();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const toggle = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error(t("speak.unsupported"));
      return;
    }
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const count = groups.reduce((n, g) => n + g.items.length, 0);
    const sentences = count === 0
      ? [`${title}. ${t("speak.empty")}`]
      : [t("speak.intro", { name: title, count }), ...groups.filter((g) => g.items.length).map((g) => `${g.label}: ${g.items.join(", ")}.`)];
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang.replace("_", "-") === locale) ?? voices.find((v) => v.lang.startsWith(locale.slice(0, 2)));
    synth.cancel();
    sentences.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = locale;
      if (voice) u.voice = voice;
      u.rate = 0.95;
      if (i === sentences.length - 1) {
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
      }
      synth.speak(u);
    });
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
