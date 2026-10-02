# Überschrift hinzufügen: Dialog mit Positionswahl und kompaktem Textfeld

## Ausgangslage
- Im Admin-Panel (Kachel-Ansicht) wird eine neue Überschrift aktuell immer ganz oben vor dem ersten Produkt eingefügt (`onAddHeading` in `admin.tsx` nutzt fest das erste Produkt als Anker).
- Das Eingabefeld erscheint nach Knopfdruck als eigene grosse Zeile über der Produktliste.

## Ziel
1. **Dialog statt eigener Zeile:** Nach Klick auf „+ Überschrift" öffnet sich ein kleines Dialog-Fenster (gleiches Muster wie der bestehende Überschrift-Verschieben-Dialog) — die grosse Eingabezeile über der Produktliste entfällt.
2. **Position wählbar:** Im Dialog ein Auswahlfeld „Position" mit allen Produkten („Vor …") plus „Ganz ans Ende". Voreingestellt ist „Vor <erstes Produkt>" (bisheriges Verhalten).
3. **Kompaktes Textfeld:** Das Titel-Feld im Dialog ist klein (normale Eingabehöhe, max. 80 Zeichen, Fokus automatisch).

## Umsetzung
- `catalog-tile-editor.tsx`: Der Knopf „+ Überschrift" öffnet den neuen Dialog mit:
  - kompaktem Textfeld (Titel),
  - Positions-Auswahl (Select: „Vor <Produktname>" je Produkt + „Ganz ans Ende"),
  - Knöpfen „Speichern" und „Abbrechen".
  - Das bisherige `newTitle`-Formular (eigene Zeile über der Produktliste) entfällt.
- `admin.tsx`: `onAddHeading` erhält zusätzlich die gewählte Position (Anker-Produkt bzw. Ende). Bei „Ganz ans Ende" wird die Überschrift hinter dem letzten Produkt verankert — dafür wird `saveHeading` falls nötig um eine „Ende"-Option ergänzt.
- i18n: neue Texte (Dialogtitel, Positions-Label) in `de.ts` und allen 15 Lokalen in `messages.json`; vorhandene Texte des Verschieben-Dialogs werden wiederverwendet, wo möglich.

## Nicht Teil
- Keine Änderung am Verschieben bestehender Überschriften.
- Keine Datenbank-Änderung, ausser `saveHeading` braucht eine optionale Ende-Position.

## Prüfung
- Typecheck + Build.
- Browser-Test: Kategorie mit Produkten öffnen → „+ Überschrift" → Titel eingeben, Position wählen (Mitte und Ende) → Überschrift erscheint an der gewählten Stelle.
