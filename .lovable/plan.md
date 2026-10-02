# Überschrift hinzufügen: Position wählbar, kompakteres Eingabefeld

## Ausgangslage
- Im Admin-Panel (Kachel-Ansicht) wird eine neue Überschrift aktuell immer ganz oben vor dem ersten Produkt eingefügt (`onAddHeading` in `admin.tsx` nutzt fest das erste Produkt als Anker).
- Das Eingabefeld erscheint nach Knopfdruck als eigene Zeile über der Produktliste und nimmt die volle Breite ein.

## Ziel
1. **Position beim Anlegen wählbar:** Nach Klick auf „+ Überschrift" erscheint weiterhin das Eingabefeld direkt in der Seite (kein Dialogfenster) — neu mit einem Auswahlfeld „Position" daneben: alle Produkte („Vor …") plus „Ganz ans Ende". Voreingestellt ist „Vor <erstes Produkt>" (bisheriges Verhalten).
2. **Kompakteres Textfeld:** Die Eingabezeile wird schmaler und niedriger — Textfeld mit begrenzter Breite statt voller Zeile, daneben Positions-Auswahl, Speichern- und Abbrechen-Knopf in einer kompakten Zeile.

## Umsetzung
- `catalog-tile-editor.tsx`: Das bestehende `newTitle`-Formular wird umgebaut:
  - kompaktes Textfeld (Titel, max. 80 Zeichen, Fokus automatisch, feste/maximale Breite statt `flex-1` über die ganze Zeile),
  - Select „Position" daneben („Vor <Produktname>" je Produkt + „Ganz ans Ende"),
  - Speichern- und ✕-Knopf in derselben Zeile; auf schmalen Bildschirmen bricht die Zeile um.
- `admin.tsx`: `onAddHeading` erhält zusätzlich die gewählte Position (Anker-Produkt bzw. Ende). Bei „Ganz ans Ende" wird die Überschrift hinter dem letzten Produkt verankert — dafür wird `saveHeading` falls nötig um eine „Ende"-Option ergänzt.
- i18n: neue Texte (Positions-Label) in `de.ts` und allen 15 Lokalen in `messages.json`; vorhandene Texte des Verschieben-Dialogs werden wiederverwendet, wo möglich.

## Nicht Teil
- Kein Dialogfenster — das Eingabefeld bleibt inline in der Seite.
- Keine Änderung am Verschieben bestehender Überschriften.
- Keine Datenbank-Änderung, ausser `saveHeading` braucht eine optionale Ende-Position.

## Prüfung
- Typecheck + Build.
- Browser-Test: Kategorie mit Produkten öffnen → „+ Überschrift" → Titel eingeben, Position wählen (Mitte und Ende) → Überschrift erscheint an der gewählten Stelle.
