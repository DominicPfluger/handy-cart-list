# Vorlese-Texte: ganze Breite, Formularfelder begrenzt

## Ziel
Die Admin-Seite „Vorlese-Texte" (`/vorlese-texte`) nutzt auf Desktop die volle breite Admin-Ansicht (wie `/admin`: max 5xl/7xl), aber die Formularfelder (Sprach-Auswahl, Textfelder, Button-Zeile) bleiben auf eine gut lesbare Spaltenbreite (max-w-xl) begrenzt.

## Änderungen

### 1. `src/routes/__root.tsx` (Zeile 177)
Die Admin-Breitenerkennung um `/vorlese-texte` erweitern:
```ts
const isAdmin = useRouterState({ select: (s) => {
  const p = s.location.pathname;
  return p.startsWith("/admin") || p.startsWith("/vorlese-texte");
}});
```
Damit erbt die Seite denselben Container (`max-w-[440px] md:max-w-5xl xl:max-w-7xl md:px-4`).

### 2. `src/routes/_authenticated/vorlese-texte.tsx`
- Das Formular (Sprach-Dropdown, die vier Textareas, Button-Zeile) kommt in einen Container mit `max-w-xl` — bleibt mobil volle Breite, auf Desktop begrenzte Spalte.
- Kopfzeile (Link, Titel, Hinweise, Platzhalter-Box) bleibt in der vollen Breite.

## Verifikation
- Typprüfung + Build fehlerfrei.
- Browser-Test als Admin: Seite `/vorlese-texte` in breitem Viewport — Seite nutzt volle Breite, Dropdown/Textareas bleiben auf Spaltenbreite begrenzt.
