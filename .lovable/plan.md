# Sandwiches zwischen Salat und Pizza einordnen

## Ziel
Im Rezept-Generator erscheint die Kategorie „🥪 Sandwiches“ direkt zwischen „🥗 Salat“ und „🍕 Pizza“.

## Umsetzung
- In `src/lib/recipe-templates.ts` den Eintrag `sandwich` in `RECIPE_TEMPLATES` von der letzten Position ans Ende des `salat`-Eintrags verschieben (Reihenfolge: … muesli, smoothie, salat, **sandwich**, pizza, pfanne, menu, dessert …).
- Keine weiteren Änderungen: Die Kacheln im Rezept-Generator rendern in Array-Reihenfolge; Übersetzungen (rk.cat.sandwich / n-sandwich) und die drei Schnellstart-Kombinationen bleiben unverändert.

## Prüfung
- Vorschau öffnen: Kategorie-Reihenfolge Salat → Sandwiches → Pizza sichtbar; Sandwich-Generator funktioniert weiter.
