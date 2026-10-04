# KI-Vorschlag für Überschriften in einer Kategorie

## Was du bekommst
In der Produktliste einer Kategorie unter Admin → Katalog gibt es neben „+ Überschrift“ einen neuen Knopf **„✨ Überschriften vorschlagen“**. Er funktioniert in der Listen- und in der Kachelansicht.

1. Wenn du darauf tippst, sieht sich die KI alle Produkte der Kategorie an. Sie schlägt 2 bis 8 passende Überschriften vor und ordnet jedes Produkt einer davon zu. In „Käse“ wären das zum Beispiel „Hartkäse“, „Weichkäse“ und „Frischkäse“.
2. Danach öffnet sich ein Vorschau-Dialog. Er zeigt jede Überschrift mit den Produkten darunter. Die Namen der Überschriften kannst du direkt ändern.
3. Ein optionales Stichwort-Feld steuert den Vorschlag, zum Beispiel „nach Herkunft“. „Neu vorschlagen“ holt eine neue Runde.
4. **„Übernehmen“** sortiert die Produkte nach den Gruppen um und legt die Überschriften an. Sie werden automatisch in alle Sprachen übersetzt.
5. Gibt es in der Kategorie schon Überschriften, fragt der Dialog vorher: ersetzen oder abbrechen.
6. Vor dem Übernehmen sichert die App die bisherige Reihenfolge, so wie bei den anderen Massenänderungen. So lässt sich alles rückgängig machen.

## Technische Details
- `src/lib/admin.functions.ts`: neue Funktion `suggestHeadings` (POST, `requireSupabaseAuth` + `assertAdmin`). Sie lädt den Kategoriepfad und die Produkte (id, Name) und ruft `aiJson` auf (`openai/gpt-6-astra`). Das Schema ist `{groups:[{name, productIds[]}]}` ohne Längenbegrenzungen. Im Code wird geprüft, dass nur gültige IDs vorkommen, keine doppelt, und fehlende IDs in die letzte Gruppe wandern. Deutsche Namen, Schreibweise ss.
- Übernehmen: Zuerst wird die alte Reihenfolge mit `createBulkBackup` gesichert. Dann werden die neue Reihenfolge über das bestehende `saveOrder` gespeichert, bestehende Überschriften mit `deleteHeading` gelöscht und pro Gruppe `saveHeading` aufgerufen (Anker ist das erste Produkt, die Übersetzung ist schon eingebaut). Danach wird der Katalog neu geladen.
- Neuer Dialog `src/components/admin/heading-ai-dialog.tsx`. Der Knopf wird in `admin.tsx` (Liste) und `catalog-tile-editor.tsx` (Kacheln) eingebunden.
- Neue i18n-Schlüssel `adm.headingAi.*` in `de.ts` und `messages.json` für alle 16 Sprachen.
- Prüfung: Typprüfung und Build. Im Browser in einer Testkategorie Vorschläge holen und übernehmen, dann die Reihenfolge und die Überschriften kontrollieren.
