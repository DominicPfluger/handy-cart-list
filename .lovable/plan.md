# Rezept-Generator auf eigener Seite + „Alle Märkte“ immer anzeigen

## Ziel
1. Der Rezept-Generator lebt wieder ausschliesslich auf seiner eigenen Seite `/rezepte/generator`. Die Rezepte-Hauptseite zeigt nur noch die Kacheln.
2. Der Schalter „Alle Märkte anzeigen“ auf „Mehr“ bleibt immer sichtbar (Entscheidung des Nutzers), unabhängig davon, ob es marktspezifische Produkte gibt.

## Änderungen

### 1. Rezepte-Hauptseite (`src/routes/rezepte.index.tsx`)
- `<RecipeBuilder mode="generator" />` entfernen.
- Kachel „🧑‍🍳 Rezept-Generator“ wieder zu `RECIPE_ENTRIES` hinzufügen (an erster Stelle, Link auf `/rezepte/generator`, vorhandene Texte `rec.entryGenTitle` / `rec.entryGenDesc`).
- Reihenfolge der Kacheln: Rezept-Generator → Rezept-Listen → Rezept-Inspirationen.

### 2. Generator-Seite (`src/routes/rezepte.generator.tsx`)
- Bleibt unverändert: eigene Seite mit Rücklink „← Rezepte“, Kategorietitel, Filtern, Zutaten und Speichern — inklusive Öffnen von Community-Rezepten über `?recipe=`.

### 3. „Alle Märkte anzeigen“ (`src/routes/mehr.tsx`)
- Die zuvor eingebaute Bedingung (nur einblenden, wenn fremde Produkte existieren) wieder entfernen: `AllMarketsRow` rendert den Schalter immer.
- Nicht mehr benötigte Importe aufräumen (`useQuery`, `useMemo`, `useLocale`, `marketOf` aus mehr.tsx), falls sonst ungenutzt.

### 4. Aufräumen
- `roadmap.md`: erledigte Punkte abhaken, offene Klärung zu „Alle Märkte“ als entschieden markieren.

## Technische Details
- Keine neuen Übersetzungen nötig — alle Schlüssel (`rec.entryGenTitle`, `rec.entryGenDesc`, `more.allMarkets`, …) existieren bereits in allen 16 Sprachen.
- Keine Datenbank- oder Backend-Änderungen.
- Verifikation: Build-Log prüfen, Vorschau-Test (Rezepte-Seite zeigt nur Kacheln; Generator-Kachel öffnet `/rezepte/generator`; „Mehr“ zeigt den Märkte-Schalter immer).
