import { useEffect } from "react";

/**
 * Globaler ESC-Abbruch für selbstgebaute Overlays (Backdrop mit onClick-Schliessen).
 * Radix-Dialoge/Sheets behandeln ESC selbst und werden hier übersprungen.
 */
export function EscapeCloser() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return;
      const overlays = Array.from(document.querySelectorAll<HTMLElement>("div.fixed.inset-0"))
        .filter((el) => !el.hasAttribute("data-state") && !el.closest("[data-sonner-toaster]"));
      if (!overlays.length) return;
      // oberstes Overlay: höchster z-index, bei Gleichstand das zuletzt im DOM
      const z = (el: HTMLElement) => Number.parseInt(getComputedStyle(el).zIndex, 10) || 0;
      const top = overlays.reduce((a, b) => (z(b) >= z(a) ? b : a));
      e.preventDefault();
      top.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
