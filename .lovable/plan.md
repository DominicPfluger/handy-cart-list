# Admin: Varianten im Produkt-Dialog per Drag & Drop sortieren

## Ziel
Im Produkt-Bearbeiten-Dialog (admin.tsx, Abschnitt „Varianten") lassen sich die eingetragenen Varianten per Drag & Drop umsortieren. Die Reihenfolge wird wie bisher beim Speichern in `products.variants` übernommen.

## Änderungen (`src/routes/_authenticated/admin.tsx`)

1. **Drag & Drop auf der Varianten-Liste** (Zeilen ~678–694):
   - Jede Variante-Zeile erhält links einen Griff `⠿` und wird `draggable`.
   - HTML5-Drag-Events: `onDragStart` merkt den Start-Index, `onDragOver` (preventDefault) markiert die Zielzeile visuell (z. B. `bg-primary-soft`), `onDrop` sortiert das lokale `variants`-Array um (Element von Start- an Zielposition verschieben), `onDragEnd` räumt auf.
   - ✕-Entfernen-Button bleibt rechts unverändert.
2. **Keine weiteren Änderungen**: Eingabe-Feld, Schnell-Chips (Bio, vegan, …), Speichern-Logik und automatische Übersetzung bleiben wie sie sind. Die Reihenfolge wird erst beim Klick auf „Speichern" übernommen — kein separates Speichern pro Zug nötig.

## Technik
- Nur `admin.tsx` betroffen; reine Client-Logik auf dem lokalen `variants`-State, keine Datenbank- oder i18n-Änderung.
- HTML5 Drag & Drop (statt Pointer-basiert wie im Kachel-Editor), da der Dialog ein einfaches Formular ohne Scroll-Konflikte ist.
