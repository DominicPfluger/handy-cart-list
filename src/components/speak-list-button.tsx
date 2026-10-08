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
  if (typeof window === "undefined" || !("speechSynthesis" in window)) { onDone?.(); return; }
  const synth = window.speechSynthesis;
  const voice = findVoice(locale);
  const busy = synth.speaking || synth.pending;
  if (busy) synth.cancel();
  try { synth.resume(); } catch { /* ignore */ }
  const list = sentences.filter((s) => s.trim()).map((s) => expandAbbreviations(s, locale));
  if (!list.length) { onDone?.(); return; }
  const token = ++speakToken;
  let finished = false;
  const finish = () => {
    if (finished || token !== speakToken) return;
    finished = true;
    stopKeepAlive();
    onDone?.();
  };
  const utts: SpeechSynthesisUtterance[] = [];
  list.forEach((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? locale;
    if (voice) u.voice = voice;
    u.rate = Math.min(2, Math.max(0.5, rate || 1));
    if (i === list.length - 1) {
      u.onend = finish;
      u.onerror = (e) => {
        // Abbruch durch neues Vorlesen ist kein Fehler.
        if (e.error === "interrupted" || e.error === "canceled") return;
        finish();
      };
    }
    utts.push(u);
  });
  // Referenzen halten, sonst verwirft Chrome die Äusserungen vorzeitig.
  activeUtterances = utts;
  const run = () => {
    if (token !== speakToken) return;
    utts.forEach((u) => synth.speak(u));
    // Chrome stoppt lange Ausgaben nach ~15 s: regelmässig anstossen.
    stopKeepAlive();
    keepAlive = window.setInterval(() => {
      if (!synth.speaking) { stopKeepAlive(); return; }
      try { synth.pause(); synth.resume(); } catch { /* ignore */ }
    }, 10000);
  };
  // iOS Safari braucht speak() direkt in der Tipp-Geste; Chrome verwirft speak() direkt nach cancel().
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (busy && !isIOS) window.setTimeout(run, 120); else run();
}
let activeUtterances: SpeechSynthesisUtterance[] = [];
let speakToken = 0;
let keepAlive: number | undefined;
function stopKeepAlive() { if (keepAlive) { window.clearInterval(keepAlive); keepAlive = undefined; } }
// Stimmen früh laden (Chrome liefert sie erst asynchron).
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try { window.speechSynthesis.getVoices(); window.speechSynthesis.addEventListener?.("voiceschanged", () => window.speechSynthesis.getVoices()); } catch { /* ignore */ }
}

