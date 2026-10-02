# „Fehlende Produkte vorschlagen": 10 weitere laden + nach Relevanz sortieren

## Was sich ändert (Fenster „✨ Vorschläge" im Admin-Katalog)
- **„+ 10 weitere Vorschläge"** unter der Liste: lädt jeweils 10 neue Produkte dazu. Bereits angezeigte Vorschläge werden nicht wiederholt; die bisherige Liste und deine Häkchen bleiben erhalten. Neue Einträge sind vorangehakt.
- **Relevanz:** Die KI liefert die Vorschläge nach Relevanz (wie häufig im Supermarkt gekauft) geordnet, jeder mit einer Relevanzstufe (z. B. ★★★ / ★★ / ★). Über der Liste ein Umschalter **Sortieren: Relevanz · Alphabet · Reihenfolge geladen** – Standard „Relevanz".
- Ist ein Markt gewählt, bezieht sich die Relevanz auf dieses Land, sonst allgemein (CH/DE/AT).
- „Ausgewählte anlegen" funktioniert unverändert (inkl. Übersetzung in alle Sprachen).

## Technische Details
- `src/lib/admin.functions.ts` – `suggestCategoryProducts`: Eingabe um `exclude: string[]` (bereits gezeigte Namen, max. 300), `count` (default 10) und optional `market` erweitern; Prompt verlangt genau `count` Produkte, sortiert nach Relevanz, zusätzlich Feld `relevance` (1–100). Ausschlussliste fliesst in Prompt und Filter ein. Rückgabe enthält `relevance`.
- `src/components/admin/catalog-tile-editor.tsx` – `SuggestSheet`: Auswahl über stabile Schlüssel (Name) statt Index; `loadMore()` hängt Ergebnisse an; Sortier-Select; Relevanz-Sterne in jeder Zeile; „Neu vorschlagen" ersetzt wie bisher die Liste. Markt wird aus den bestehenden Props weitergereicht (falls vorhanden).
- i18n: `tile.suggestMore` („+ 10 weitere Vorschläge"), `tile.suggestSort` („Sortieren"), `tile.sortRelevance`, `tile.sortAlpha`, `tile.sortLoaded` in de.ts + allen 15 Locales.
- Keine Datenbankänderung. Jeder Klick verbraucht etwas KI-Guthaben.

## Prüfung
Build prüfen; in der Vorschau eine Kategorie öffnen → Vorschläge laden → „+ 10 weitere" → keine Duplikate, Liste wächst; Sortierung umschalten.
