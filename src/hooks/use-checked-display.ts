import { useCallback, useEffect, useState } from "react";

const KEY = "shoppi:checked-display";
const EVENT = "shoppi:checked-display-changed";
export type CheckedDisplay = "strike" | "collapse" | "hide";

function read(): CheckedDisplay {
  if (typeof window === "undefined") return "strike";
  const v = window.localStorage.getItem(KEY); return v === "hide" || v === "collapse" ? v : "strike";
}

/** Geräte-lokal: erledigte Artikel durchstreichen oder ausblenden. */
export function useCheckedDisplay(): [CheckedDisplay, (v: CheckedDisplay) => void] {
  const [value, setValue] = useState<CheckedDisplay>("strike");
  useEffect(() => {
    const sync = () => setValue(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const set = useCallback((v: CheckedDisplay) => {
    window.localStorage.setItem(KEY, v);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [value, set];
}
