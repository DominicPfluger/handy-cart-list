# Ernährungsform-Einstellung an den Anfang der Mehr-Seite

## Ziel
Auf der Seite „Mehr" erscheint die Ernährungsformen-Einstellung (🥗) direkt am Anfang der Seite — vor dem Bereich „Gemeinsam" und allen anderen Einträgen.

## Aktueller Zustand
- `DietPreferenceRow` (aufklappbare Zeile mit Ernährungsform-Chips) steht zurzeit als erste Zeile im unteren Bereich „Sprache & Admin" (src/routes/mehr.tsx, ca. Zeile 238).
- Alle Texte (more.dietPreference, diet.*) existieren bereits in allen 16 Sprachen.

## Änderungen (nur src/routes/mehr.tsx)
1. Neue erste Sektion ganz oben auf der Seite (direkt unter der Überschrift „Mehr", vor „Gemeinsam"): eine Karte mit der `DietPreferenceRow`.
2. `<DietPreferenceRow />` aus dem Bereich „Sprache & Admin" entfernen (dort beginnt die Sektion dann mit der Sprachauswahl).

## Verhalten unverändert
- Aufklapplogik, Chips, Mehrfachauswahl, „Zurücksetzen", gerätelokale Speicherung und der Filter bleiben genau wie bisher — nur die Position ändert sich.
- Keine Datenbankänderung, keine neuen Übersetzungen.

## Verifikation
- Typcheck; Browser-Test: Mehr-Seite zeigt die Ernährungsform-Zeile als ersten Eintrag, Aufklappen und Auswählen funktioniert.
