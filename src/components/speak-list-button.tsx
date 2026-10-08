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
const NOVELTY = /bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;
export function findVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => !NOVELTY.test(v.name));
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const lang = locale.slice(0, 2).toLowerCase();
  // Lokale Stimmen bevorzugen: Netzwerkstimmen (z. B. Google) starten oft nicht oder brechen ab.
  const rank = (v: SpeechSynthesisVoice) => (v.localService ? 0 : 2) + (v.default ? 0 : 1);
  const pick = (list: SpeechSynthesisVoice[]) => list.sort((a, b) => rank(a) - rank(b))[0];
  return pick(voices.filter((v) => norm(v.lang) === locale.toLowerCase()))
    ?? pick(voices.filter((v) => norm(v.lang).split("-")[0] === lang));
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
    onDone?.();
  };
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // Mit gewählter Stimme sprechen; schlägt das fehl (Stimme nicht verfügbar,
  // Ausgabe startet nicht), einmal mit der Standardstimme des Geräts wiederholen.
  const build = (withVoice: boolean) => list.map((text, i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    if (withVoice && voice) u.voice = voice;
    u.rate = Math.min(2, Math.max(0.5, rate || 1));
    if (i === 0) u.onstart = () => { started = true; };
    if (i === list.length - 1) {
      u.onend = finish;
      u.onerror = (e) => {
        if (e.error === "interrupted" || e.error === "canceled") return;
        if (withVoice && voice && !started) { retry(); return; }
        finish();
      };
    }
    return u;
  });
  let started = false;
  let retried = false;
  const retry = () => {
    if (retried || token !== speakToken) return;
    retried = true;
    try { synth.cancel(); } catch { /* ignore */ }
    const again = build(false);
    activeUtterances = again;
    window.setTimeout(() => { if (token === speakToken) again.forEach((u) => synth.speak(u)); }, 80);
  };
  const utts = build(true);
  // Referenzen halten, sonst verwirft Chrome die Äusserungen vorzeitig.
  activeUtterances = utts;
  const run = () => {
    if (token !== speakToken) return;
    try { synth.resume(); } catch { /* ignore */ }
    utts.forEach((u) => synth.speak(u));
    window.setTimeout(() => {
      if (token === speakToken && !started && !synth.speaking) {
        if (voice) retry(); else finish();
      }
    }, 1500);
  };
  // iOS Safari braucht speak() direkt in der Tipp-Geste; Chrome verwirft speak() direkt nach cancel().
  if (busy && !isIOS) window.setTimeout(run, 120); else run();
}
let activeUtterances: SpeechSynthesisUtterance[] = [];
let speakToken = 0;
// Stimmen früh laden (Chrome liefert sie erst asynchron).
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try { window.speechSynthesis.getVoices(); window.speechSynthesis.addEventListener?.("voiceschanged", () => window.speechSynthesis.getVoices()); } catch { /* ignore */ }
}

