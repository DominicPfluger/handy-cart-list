# Suche in der Abteilungsansicht findet auch Begriffe aus anderen Sprachen

## Ziel
Die Suche in der Abteilungsansicht soll Produkte auch dann finden, wenn der Suchbegriff dem Namen in einer anderen Sprache entspricht — z. B. findet „tomato" auch „Tomate", „fromage" auch „Käse".

## Umsetzung
Alle Übersetzungen liegen bereits im Produktobjekt vor (`product.names` = alle Sprachen, `product.variantNames` = Varianten je Sprache) — es ist keine Datenbank-Änderung nötig.

In `src/routes/abteilungen.tsx`:

1. **Suche erweitern:** Neben dem Namen in der aktuellen Sprache, dem Basisnamen, Marken, Varianten und Synonymen wird zusätzlich geprüft, ob der Suchbegriff zu einem Namen in **irgendeiner anderen Sprache** passt (gleiche Matching-Regeln wie bisher über `matchesProductSearch`). Das gilt auch für Varianten-Namen in anderen Sprachen.

2. **Hinweis im Treffer:** Wird ein Produkt nur über eine fremdsprachige Bezeichnung gefunden, erscheint in der Trefferzeile ein Hinweis mit dem gefundenen Begriff — im gleichen Stil wie der bestehende Hinweis „auch bekannt als …" (Schlüssel `search.alsoKnownAs` wird wiederverwendet).

3. **Sortierung und Anzeige bleiben unverändert** — Treffer weiterhin nach Abteilungsreihenfolge und Einkaufsverlauf sortiert; der angezeigte Produktname bleibt der in der gewählten Sprache.

## Technische Details
- `src/routes/abteilungen.tsx`: Neuer Helfer `matchedLocaleName(product)`, der `Object.values(product.names)` (und bei Varianten die Werte aus `product.variantNames`) gegen `normalizedQuery` prüft; in den Filter von `searchResults` und in die Hinweis-Logik (`synonymHint`-Muster) einbauen. Cache-abhängige Werte sind bereits geladen, kein neuer Fetch.
- Keine i18n-Änderung nötig (bestehender Schlüssel `search.alsoKnownAs` wird wiederverwendet).
- Keine DB-Änderung.
