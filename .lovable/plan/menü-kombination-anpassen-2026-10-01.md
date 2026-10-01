# Menü-Kombination anpassen

## Ziel
Die Rezept-Kategorie „Menü-Kombination" bekommt neue Auswahlschritte, und die Nummerierung vor den Zutaten-Auswahlen entfällt überall im Rezept-Ersteller.

## Änderungen

### 1. Neue Optionen für „Menü-Kombination"
`src/lib/recipe-templates.ts` — die vier Schritte der Vorlage `menu` ersetzen:

1. **Proteinquelle** — z. B. Hähnchenbrust, Lachs, Rinderhackfleisch, Tofu, Eier
2. **Stärkebeilage** — z. B. Reis, Nudeln, Kartoffeln
3. **Gemüsebeilage** — z. B. Grüne Bohnen, Zucchini, Babyspinat, Karotten
4. **Sauce** — z. B. Passierte Tomaten, Crème fraîche, Sojasauce

Alle Zutaten sind bereits im Katalog vorhanden (Namen wie in anderen Vorlagen). Vorspeise und Dessert entfallen; Auswahllimits wie bisher (1–2 bzw. 0–2 je Schritt).

### 2. Beliebte Kombinationen anpassen
`POPULAR_RECIPES.menu` auf die neuen Schritt-Schlüssel (protein, starch, veg, sauce) umstellen, mit Zutaten aus dem Katalog.

### 3. Nummerierung entfernen
`src/components/recipe-builder.tsx` — das „1. / 2. / 3. …" vor jedem Schritt-Titel löschen; Schritt-Titel und Auswahllimit-Hinweis bleiben stehen. Gilt für alle Rezept-Kategorien, nicht nur Menü.

## Hinweise
- Bereits gespeicherte Menü-Rezepte behalten ihren Titel, verlieren aber ihre alten Zutaten-Auswahlen (Vorspeise/Dessert existieren nicht mehr) — beim Öffnen wählt man neu.
- Schritt-Titel sind wie bisher deutsch hinterlegt (analog den übrigen Vorlagen).
