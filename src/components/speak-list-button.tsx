import { useEffect, useState } from "react";
import { toast } from "sonner";
import { translate, useT } from "../i18n";
import { useSpeakRate } from "../hooks/use-speak-rate";
import { useSpeakLocale } from "../hooks/use-speak-locale";
import { fillSpeech, resolveSpeechText, useSpeechTexts } from "../lib/speech-texts";
import { applyPronunciationRules, getPronunciationRules } from "../lib/pronunciation-rules";

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
export function expandAbbreviations(text: string, locale: string): string {
  const corrected = applyPronunciationRules(text, locale, getPronunciationRules());
  if (!locale.toLowerCase().startsWith("de")) return corrected;
  return corrected
    .replace(/\bStk\.?/g, "Stück")
    .replace(/\bPkg\.?/g, "Packung")
    // „1 Stück“ natürlich als „ein Stück“ statt „eins Stück“ sprechen.
    .replace(/(^|[^\d.,'’])1\s+Stück\b/g, "$1ein Stück");
}

export function speakSentences(sentences: string[], locale: string, rate: number, onDone?: () => void) {
  const synth = window.speechSynthesis;
  const voice = findVoice(locale);
  const busy = synth.speaking || synth.pending;
  if (busy) synth.cancel();
  try { synth.resume(); } catch { /* ignore */ }
  const list = sentences.filter((s) => s.trim()).map((s) => expandAbbreviations(s, locale));
  const utts: SpeechSynthesisUtterance[] = [];
  list.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    if (voice) u.voice = voice;
    u.rate = rate;
    if (i === list.length - 1 && onDone) {
      u.onend = onDone;
      u.onerror = onDone;
    }
    utts.push(u);
  });
  // Referenzen halten, sonst verwirft Chrome die Äusserungen vorzeitig.
  activeUtterances = utts;
  // Chrome verwirft speak() direkt nach cancel(): nur dann kurz warten.
  const run = () => utts.forEach((u) => synth.speak(u));
  if (busy) window.setTimeout(run, 120); else run();
}
let activeUtterances: SpeechSynthesisUtterance[] = [];

