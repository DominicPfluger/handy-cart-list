# Suche in der Abteilungsansicht findet auch Begriffe verwandter Sprachvarianten

## Ziel
Die Suche in der Abteilungsansicht soll Produkte auch über Bezeichnungen aus **verwandten Sprachvarianten** finden — also gleiche Sprache, andere Region:
- Deutsch (de) findet auch Schweizerdeutsch (de-CH) und Österreichisch (de-AT) — und umgekehrt
- Englisch: US (en-US), Britisch (en-GB), Kanadisch (en-CA) gegenseitig
- Ebenso für Französisch (fr-FR/fr-CA), Italienisch (it-IT/it-CH), Portugiesisch (pt-PT/pt-BR), Niederländisch (nl-NL/nl-BE), Spanisch (es-ES/es-MX)

Nicht berücksichtigt werden komplett andere Sprachen (z. B. findet die deutsche Suche nicht „tomato").

## Umsetzung
Alle Übersetzungen liegen bereits im Produktobjekt vor (`product.names` = alle Sprachen, `product.variantNames` = Varianten je Sprache) — keine Datenbank-Änderung nötig.

In `src/routes/abteilungen.tsx`:

1. **Verwandte Locales bestimmen:** Aus der aktuellen Sprache wird der Sprachstamm ermittelt (Teil vor dem Bindestrich, z. B. `de` aus `de-CH`); berücksichtigt werden alle Katalog-Übersetzungen, deren Locale denselben Stamm hat.

2. **Suche erweitern:** Neben Name in der aktuellen Sprache, Basisname, Marken, Varianten und Synonymen wird zusätzlich geprüft, ob der Suchbegriff zu einem Namen in einer **verwandten Sprachvariante** passt (gleiche Matching-Regeln über `matchesProductSearch`). Gilt auch für Varianten-Namen in diesen Sprachen.

3. **Hinweis im Treffer:** Wird ein Produkt nur über eine Bezeichnung aus einer anderen Sprachvariante gefunden, erscheint in der Trefferzeile ein Hinweis mit dem gefundenen Begriff — im gleichen Stil wie der bestehende Hinweis „auch bekannt als …" (Schlüssel `search.alsoKnownAs` wird wiederverwendet).

4. **Sortierung und Anzeige bleiben unverändert** — Treffer weiterhin nach Abteilungsreihenfolge und Einkaufsverlauf; der angezeigte Produktname bleibt der in der gewählten Sprache.

## Technische Details
- `src/routes/abteilungen.tsx`: Neuer Helfer `matchedLocaleName(product)`, der die Werte aus `product.names` (und bei Varianten aus `product.variantNames`) filtert auf Locales mit demselben Sprachstamm wie `getLocale()` und gegen `normalizedQuery` prüft; in den Filter von `searchResults` und in die Hinweis-Logik (`synonymHint`-Muster) einbauen. Daten sind bereits geladen, kein neuer Fetch.
- Keine i18n-Änderung nötig (bestehender Schlüssel `search.alsoKnownAs` wird wiederverwendet).
- Keine DB-Änderung.
