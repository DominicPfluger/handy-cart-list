# Überschrift hinzufügen: Position wählbar, kompakteres Eingabefeld

## Ausgangslage
- Im Admin-Panel (Kachel-Ansicht) wird eine neue Überschrift aktuell immer ganz oben vor dem ersten Produkt eingefügt (`onAddHeading` in `admin.tsx` nutzt fest das erste Produkt als Anker).
- Das Eingabefeld erscheint als eigene Zeile über der Produktliste und nimmt die volle Breite ein.

## Ziel
1. **Position beim Anlegen wählbar:** Beim Hinzufügen einer Überschrift erscheint ein kleines Dialog-Fenster (analog zum vorhandenen Verschieben-Dialog): Textfeld für den Titel plus Auswahlfeld „Position" mit allen Produkten („Vor …") und „Ganz ans Ende". Voreingestellt ist „Vor <erstes Produkt>" (bisheriges Verhalten).
2. **Kompakteres Textfeld:** Das Titel-Feld wird kleiner (kürzere Höhe, begrenzte Breite statt voller Zeile) und sitzt im Dialog statt als grosse Zeile über der Liste.

## Umsetzung
- `catalog-tile-editor.tsx`: Der Knopf „+ Überschrift" öffnet neu einen Dialog (gleiches Muster wie der bestehende Überschrift-Verschieben-Dialog) mit:
  - kompaktem Textfeld (Titel, max. 80 Zeichen, Fokus automatisch),
  - Positions-Auswahl (Select: „Vor <Produktname>" je Produkt + „Ganz ans Ende"),
  - Knöpfen „Speichern" und „Abbrechen".
  - Die bisherige grosse Eingabezeile (`newTitle`-Formular über der Produktliste) entfällt.
- `admin.tsx`: `onAddHeading` erhält zusätzlich die gewählte Position (Anker-Produkt bzw. Ende). Bei „Ganz ans Ende" wird die Überschrift hinter dem letzten Produkt verankert (Anker = letztes Produkt, Einfügung danach) — dafür wird `saveHeading` falls nötig um eine „Ende"-Option ergänzt.
- i18n: neue Texte (Dialogtitel, Positions-Label) in `de.ts` und allen 15 Lokalen in `messages.json`; vorhandene Texte des Verschieben-Dialogs werden wiederverwendet, wo möglich.

## Nicht Teil
- Keine Änderung am Verschieben bestehender Überschriften (Funktion bleibt wie sie ist).
- Keine Datenbank-Änderung, ausser `saveHeading` braucht eine optionale Ende-Position.

## Prüfung
- Typecheck + Build.
- Browser-Test: Kategorie mit Produkten öffnen → „+ Überschrift" → Titel eingeben, Position wählen (Mitte und Ende) → Überschrift erscheint an der gewählten Stelle.
