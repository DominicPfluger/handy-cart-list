# Rezept-Generator: KI-Bilder für die Vorlagen

## Ziel
Die acht Rezept-Vorlagen (Müsli, Smoothie, Salat, Sandwiches, Pizza, Pfannegericht, Menükombination, Dessert) erhalten je ein KI-generiertes Bild statt des Emojis. Die Hintergrundfarbe jeder Vorlage bleibt erhalten. Das Bild erscheint im Titel **hinter** dem Titeltext.

## Umsetzung

1. **Bilder erzeugen** (8 Bilder, je 512×512, gespeichert unter `src/assets/recipes/`)
   - Je Vorlage ein appetitliches Produktfoto des Gerichts
   - Stilregeln einhalten: ohne Kräuter, ohne Garnituren/Zusätze, ohne Gefässe
   - Hintergrund in der jeweiligen Vorlagenfarbe, damit Kachel und Bild harmonieren

2. **Vorlagen erweitern** (`src/lib/recipe-templates.ts`, `src/lib/use-recipe-templates.ts`)
   - Neues Feld `image` an der Vorlage; die 8 Bilder werden importiert und zugeordnet
   - Emoji bleibt als Fallback für Vorlagen ohne Bild (z. B. Admin-Vorlagen aus der Datenbank)

3. **Anzeige anpassen**
   - Generator-Auswahl (Kacheln) und Titelzeile: Bild hinter dem Titeltext anzeigen, Hintergrundfarbe der Vorlage bleibt
   - Rezept-Listen (gespeicherte/beliebte Rezepte, Community) nutzen das Vorlagenbild als Fallback, wenn das Rezept kein eigenes Foto hat

## Technisch
- Bilder als ES6-Imports eingebunden (werden mit dem Build ausgeliefert, kein Download nötig)
- Keine neuen Texte, keine Übersetzungen nötig
- Keine Änderung an Auswahl, Schritten oder gespeicherten Rezepten
- Die Zutaten-Bereiche (Teig, Sauce, Käse, Fleisch …) bleiben wie aktuell umgesetzt immer aufgeklappt: nur Rahmen, keine Pfeile — daran ändert dieser Plan nichts

## Prüfung
- Typcheck + Build
- Browser-Test: Generator öffnen, Kacheln und Titel mit Bildern kontrollieren (Desktop + Handy)
