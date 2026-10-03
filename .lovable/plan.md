# Admin-Produktliste: Stift nach rechts, Ziehen per langem Drücken aufs Bild

## Was sich ändert

In der Produktliste des Admin-Katalogs (src/components/admin/catalog-tile-editor.tsx):

1. **Stift zurück nach rechts** — Der Bearbeiten-Stift wandert von seiner Position neben dem Zieh-Griff zurück an das rechte Zeilenende, vor den Varianten-Knopf (🏷). Reihenfolge rechts: ✏️ Stift, 🏷 Variante, ✨ KI-Bild, 🗑 Papierkorb. Links bleiben: Checkbox, ⠿ Zieh-Griff, Bild.

2. **Ziehen per langem Drücken aufs Produktbild** — Das Produktbild reagiert zusätzlich auf langes Drücken (ca. 0,5 Sekunden): Dann startet dasselbe Drag & Drop wie am ⠿-Griff (inkl. Mehrfachauswahl „+n"). Kurzes Antippen öffnet weiterhin den Bild-Dialog, Doppeltippen den Zoom — beides bleibt unverändert.

## Technische Details

- **Stift verschieben:** Der Pencil-Button (aktuell Zeile 425–427, direkt nach dem ⠿-Griff) wird entfernt und als erster Button im rechten Button-Block (vor dem Tags-Button, Zeile 439) wieder eingefügt — gleiche Handler, `disabled={!editMode}`, gleiche Klassen.
- **Langes Drücken:** Am Bild-Span (Zeile 428–431) kommt ein `onPointerDown` dazu, der einen Timer (~500 ms) startet. Läuft der Timer ab, wird `startDrag(e, "product", x.id, i, ...)` mit derselben Mehrfachauswahl-Logik wie am ⠿-Griff aufgerufen und der Klick-Timer unterdrückt. Bei `onPointerUp`/`onPointerCancel`/Bewegung vor Ablauf wird der Timer verworfen, damit Klick und Doppelklick wie bisher funktionieren. Der Bild-Span erhält `touch-none select-none`, damit das Gedrückthalten auf dem Handy nicht scrollt oder Text markiert.
- Keine i18n-, DB- oder Funktionsänderungen; Bestätigungsfragen und alle anderen Aktionen bleiben unverändert.

## Prüfung

- Typprüfung und Build.
- Browser-Test: Stift sitzt rechts vor 🏷; langes Drücken auf ein Produktbild startet das Ziehen (Zeile wird abgehoben/verschiebbar); kurzes Tippen öffnet weiterhin den Bild-Dialog.
