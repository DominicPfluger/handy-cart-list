# Produkte für das KI-Kategoriebild per Checkbox auswählen

## Was du bekommst
Im Bearbeiten-Dialog einer Kategorie/Unterkategorie (Admin, Kachel-Ansicht) erscheint beim KI-Bildtext eine aufklappbare Liste „Produkte fürs Bild" mit allen Produkten dieser Kategorie (inkl. Alias-Produkte), je mit Checkbox.

- Standard: die ersten Produkte (wie bisher, bis 30) sind angehakt.
- Knöpfe „Alle" / „Keine", Suchfeld bei vielen Produkten, Zähler „x ausgewählt".
- Der ✨/↻-Vorschlag nutzt nur die angehakten Produkte; der Bildtext bleibt wie bisher editierbar, die Bilderzeugung nutzt diesen Text.
- Bei Kategorien ohne eigene Produkte (nur Unterkategorien) werden Produkte der Unterkategorien angeboten.
- Auswahl wird nicht gespeichert (gilt nur für den offenen Dialog). Beschriftungen in allen App-Sprachen.

## Technische Details
- `suggestImagePrompt` (admin.functions.ts): optionales `productIds: uuid[]` (max. 60); wenn gesetzt, Namen nur dieser Produkte laden, sonst bisheriges Verhalten.
- `catalog-tile-editor.tsx` ItemSheet: Produktliste der Kategorie aus vorhandenen Tile-Daten bzw. Supabase-Abfrage; State `pickedIds`; `loadSuggestion` übergibt `productIds`; nach Änderung der Auswahl Vorschlag per ↻ neu laden (kein automatischer KI-Aufruf pro Klick, spart Credits).
- i18n-Schlüssel in `de.ts` + `messages.json` (15 Lokale).
- Test im Browser (390/1280 px): Auswahl ändern, ↻ → Vorschlag nennt nur gewählte Produkte.
