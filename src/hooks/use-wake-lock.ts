import { useEffect, useState } from "react";

const KEY = "shoppi:keep-awake";

/** Gerätelokale Einstellung: Bildschirm in der Einkaufsliste wach halten (Standard: an). */
export function useKeepAwakePref(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(true);
  useEffect(() => { try { setOn(window.localStorage.getItem(KEY) !== "0"); } catch { /* ignore */ } }, []);
  const set = (v: boolean) => { setOn(v); try { window.localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ } };
  return [on, set];
}

/** Verhindert die Auto-Sperre, solange `enabled` aktiv ist (holt die Sperre nach App-Wechsel neu). */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined") return;
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
  }, [enabled]);
}
