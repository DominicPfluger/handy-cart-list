# Rezept-Generator: Zutaten direkt neben der Oberkategorie

## Ziel
Im Rezept-Generator werden die Zutaten beim Aufklappen einer grauen Oberkategorie **direkt daneben** (inline, direkt nach dem Kategorie-Button in derselben umbruchenden Reihe) angezeigt — nicht mehr in einem separaten Block unterhalb aller Kategorien-Buttons.

## Aktuelles Verhalten (recipe-builder.tsx, hasGroups-Zweig)
- Zeile 1: alle grauen Kategorie-Buttons in einer flex-wrap-Reihe.
- Zeile 2 (separat darunter): pro Gruppe Zutaten-Chips, „… nach Wahl", „Weitere anzeigen".

## Neues Verhalten
- Eine einzige flex-wrap-Reihe pro Zutatenbereich (Schritt): Für jede Gruppe werden **in dieser Reihenfolge** gerendert:
  1. grauer Kategorie-Button (mit Emoji, Name, ▴/▾ — unverändert),
  2. beim offenen Zustand direkt dahinter: „… nach Wahl"-Button und die Zutaten-Chips,
  3. „Weitere anzeigen…"/„Weniger anzeigen" inline hinter den Chips.
- Geschlossene Gruppe: nur der Kategorie-Button; bereits gewählte Zutaten dieser Gruppe erscheinen wie bisher ebenfalls direkt dahinter (klein, inline).
- Mehrere Kategorien können gleichzeitig offen sein; jede zeigt ihre Zutaten direkt neben sich. Nachfolgende Kategorie-Buttons fliessen nach dem Zutaten-Block weiter (Zeilenumbruch wie gehabt, kein horizontales Scrollen).
- Alles andere bleibt unverändert: Klick zum Aufklappen, Pfeile, Rahmen, PAGE = 10 mit „Weitere anzeigen", Varianten-Auswahl, „… nach Wahl", Suchverhalten existiert im Generator nicht (nur Admin).

## Technische Umsetzung
- Datei: `src/components/recipe-builder.tsx`, hasGroups-Return (Zeilen ~683–737).
- Statt zwei Blöcken (Chip-Reihe + darunter `groups.map` mit Zutaten) wird ein Container `flex flex-wrap items-center gap-2` verwendet, der pro Gruppe Kategorie-Button, ggf. „… nach Wahl", Chips und ggf. „Weitere anzeigen" direkt hintereinander rendert.
- Keine Datenbankänderung, keine neuen i18n-Texte (bestehende Keys reichen).

## Verifikation
- Typprüfung (tsgo) und Build.
- Browser-Test (Playwright, 390 px mobil + Desktop): /rezepte/generator → Vorlage wählen → Kategorie aufklappen → Zutaten erscheinen direkt neben dem Kategorie-Button, Zeilenumbruch statt horizontalem Scrollen; Mehrfach-Aufklappen, „Weitere anzeigen", „… nach Wahl" und Auswahl funktionieren.
