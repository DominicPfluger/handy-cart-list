# „Am häufigsten gespeichert" zu unterst auf der Rezept-Inspirationen-Seite

## Ziel
Auf der Seite „Rezept-Inspirationen" soll der Bereich **„Am häufigsten gespeichert"** (Rezept-Kacheln, sortiert nach Speicherungen) ganz **unten** auf der Seite stehen — nach „Beliebte Rezepte" und „Kürzlich erstellt".

## Aktuelle Reihenfolge
1. Community-Rezepte
2. Mit Favoriten passend
3. Bestbewertet
4. **Am häufigsten gespeichert** ← hier
5. Beliebte Rezepte / Kürzlich erstellt (Rezept-Generator-Bereich)

## Neue Reihenfolge
1. Community-Rezepte
2. Mit Favoriten passend
3. Bestbewertet
4. Beliebte Rezepte / Kürzlich erstellt (Rezept-Generator-Bereich)
5. **Am häufigsten gespeichert** ← zu unterst

## Umsetzung
- `src/components/recipe-feed.tsx`: Aus `RecipeFeed` nur die „Am häufigsten gespeichert"-Zeile entfernen; zusätzlich eine neue kleine Komponente `MostSavedRow` exportieren, die genau diese Zeile rendert (gleiches Aussehen und Verhalten wie bisher).
- `src/routes/rezepte.inspirationen.tsx`: `<MostSavedRow />` **nach** `<RecipeBuilder mode="inspiration" />` einfügen (letzte Sektion der Seite).

## Nicht geändert
- Verhalten der Zeile selbst (5 Einträge + „Mehr anzeigen"), Übersetzungen, andere Seiten.

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`) und Build.
- Browser-Check: Die Reihenfolge auf der Inspirationen-Seite stimmt; die Zeile lädt wie bisher.
