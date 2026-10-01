/** Landingpage (/start + erster Besuch auf /): Geräte-lokale Erkennung. */
const KEY = "shoppi:landing-seen";

/** true, wenn dieses Gerät die App noch nie benutzt hat → Landingpage zeigen. */
export function shouldShowLanding(): boolean {
  try {
    if (localStorage.getItem(KEY)) return false;
    if (localStorage.getItem("shoppi:lists") || localStorage.getItem("shoppi:list")) return false;
    return true;
  } catch {
    return false;
  }
}

/** Merkt sich, dass die App geöffnet wurde, und informiert das Root-Layout. */
export function markLandingDone() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event("shoppi:landing-done"));
}
