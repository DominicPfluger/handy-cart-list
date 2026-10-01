import { useCallback, useEffect, useState } from "react";

const KEY = "shoppi:product-dept";
const EVT = "shoppi:product-dept-change";

function read(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string>; } catch { return {}; }
}

/** Bevorzugte Listen-Kategorie je Produkt (nur auf diesem Gerät). */
export function usePreferredDept() {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    setMap(read());
    const on = () => setMap(read());
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  const setPreferred = useCallback((productId: string, deptId: string) => {
    const next = { ...read(), [productId]: deptId };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVT));
  }, []);
  return { preferred: map, setPreferred };
}
