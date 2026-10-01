import { useCallback, useEffect, useState } from "react";

const KEY = "shoppi:speak-rate";
const EVENT = "shoppi:speak-rate-changed";
export const DEFAULT_SPEAK_RATE = 0.95;

export function getSpeakRate(): number {
  if (typeof window === "undefined") return DEFAULT_SPEAK_RATE;
  const raw = window.localStorage.getItem(KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0.5 && n <= 2 ? n : DEFAULT_SPEAK_RATE;
}

export function setSpeakRate(rate: number) {
  window.localStorage.setItem(KEY, String(rate));
  window.dispatchEvent(new Event(EVENT));
}

export function useSpeakRate(): [number, (rate: number) => void] {
  const [rate, setRate] = useState<number>(getSpeakRate);
  useEffect(() => {
    const sync = () => setRate(getSpeakRate());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const update = useCallback((next: number) => {
    setSpeakRate(next);
    setRate(next);
  }, []);
  return [rate, update];
}
