# Rezept-Generator: Länderküchen-Chips direkt am Knopf

## Ziel

Im Rezept-Generator erscheinen beim Aufklappen der Länderküchen die Küchen-Chips **direkt nach dem «🌍 Länderküche»-Knopf in derselben Reihe** (inline). «Nur Favoriten», «Überrasch mich» und «Neu beginnen» rutschen unter die Chips. Kein Popup, kein separater Block darunter.

## Aktueller Zustand (verifiziert)

`src/components/recipe-builder.tsx` (ca. Zeilen 532–596): Die Knopfreihe ist ein `flex flex-wrap`-Container mit den vier Knöpfen (Länderküche, Nur Favoriten, Überrasch mich, Neu beginnen). Die Chips stehen bei `cuisineOpen` in einem **eigenen Block unterhalb der ganzen Reihe** (live per Browser-Test bestätigt).

## Änderung

Nur `src/components/recipe-builder.tsx`:

1. Die Küchen-Chips (die `catalog.cuisines.map(...)`-Schleife) aus dem separaten Block in den bestehenden `flex flex-wrap`-Container verschieben — direkt hinter den «🌍 Länderküche»-Knopf, vor «Nur Favoriten».
2. Rendern der Chips weiterhin nur bei `cuisineOpen` (`{cuisineOpen && catalog.cuisines.map(...)}`); Auf-/Zuklappen per Knopf bleibt unverändert, Standard bleibt zugeklappt.
3. Der `cuisine.hint`-Hinweis (erscheint bei gewählter Küche) bleibt als Absatz unterhalb der Reihe.
4. Chip-Styling unverändert (Pill, `aria-pressed`, Grün bei aktiv, `toggleCuisine`).

Keine neuen Übersetzungen, keine anderen Dateien betroffen.

## Abnahme

- Generator mit Kategorie (z. B. Pizza) öffnen: zugeklappte Reihe wie bisher.
- «🌍 Länderküche» tippen: Chips beginnen direkt nach dem Knopf in derselben Reihe und umfliessen ihn; «Nur Favoriten / Überrasch mich / Neu beginnen» stehen unter den Chips.
- Auswahl filtert die Zutaten wie bisher; Zuklappen versteckt die Chips wieder.
- Typprüfung (`bunx tsgo --noEmit`) und Build fehlerfrei.
