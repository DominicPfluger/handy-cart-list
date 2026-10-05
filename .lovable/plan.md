# Läden-Bereich in „Abteilungen ordnen & umbenennen" zugeklappt anzeigen

## Ziel
Der Läden-Bereich (Laden-Auswahl + Sortierung + „Eigener Laden") innerhalb von „Abteilungen ordnen & umbenennen" unter Einstellungen ist standardmässig zugeklappt. Ein Klick auf die Überschrift klappt ihn auf, ein weiterer Klick wieder zu.

## Umsetzung
In `src/components/category-order-settings.tsx`:

1. Neuer State `storesOpen` (Standard `false`).
2. Über dem Läden-Kasten eine klickbare Kopfzeile (z. B. 🏪 „Läden" + Pfeil ▾/▴, gleiche Stil-Sprache wie die Abteilungs-Zeilen) mit `aria-expanded`.
3. Der Läden-Kasten (dragHint + Laden-Liste + „Eigener Laden"-Button) wird nur bei `storesOpen` gerendert.
4. Deep-Link `/mehr?catOrder=1` (vom „+ Neuer Laden"-Popup der Abteilungsansicht): öffnet zusätzlich `storesOpen`, damit der Nutzer direkt bei den Läden ankommt.

Der Rest (Abteilungen, ausgeblendete Abteilungen, Umbenennen, „Zurücksetzen") bleibt unverändert.

## i18n
Neuer Schlüssel `store.sectionTitle` („Läden") in `src/i18n/de.ts` + den 15 Locale-JSONs (de-AT/de-CH erben).

## Technische Details
- Reiner Frontend-Zustand, keine Datenänderung; Sortierung/Auswahl funktionieren wie bisher, sobald aufgeklappt.
- Typprüfung `bunx tsgo --noEmit`, Browser-Test: zugeklappt beim Öffnen, Auf-/Zuklappen per Klick, Laden-Sortierung weiter per Drag & Drop.
