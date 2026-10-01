# KI-Vorschläge: fehlende Produkte in einer Kategorie automatisch anlegen

## Was du bekommst
In der Kachel-Ansicht des Admin-Bereichs gibt es in jeder Kategorie einen neuen Knopf **„✨ Fehlende Produkte vorschlagen“** (neben der „+“-Kachel, in der Vorschau ausgeblendet).

1. Tippen: Die KI sieht sich den Namen der Kategorie, ihren Pfad (z. B. Fleisch & Fisch → Wurstwaren → Salami) und die vorhandenen Produkte an. Danach schlägt sie bis zu 15 typische Produkte vor, die dort noch fehlen.
2. Es öffnet sich eine Liste mit Häkchen, je mit Emoji, Name sowie Menge und Einheit. Alles ist vorausgewählt und du kannst einzelne Vorschläge abwählen.
3. Ein optionales Stichwort-Feld (z. B. „italienisch, Bio“) steuert, was vorgeschlagen wird. Mit „Neu vorschlagen“ holst du eine neue Runde.
4. Mit **„Ausgewählte anlegen“** werden die Produkte am Ende der Kategorie angelegt und automatisch in alle Sprachen übersetzt, auch in neu angelegte.
5. Produkte, die schon anderswo im Katalog stehen, werden nicht doppelt angelegt. Sie werden als Alias in diese Kategorie verknüpft und in der Liste als „verknüpfen“ markiert.

Bilder werden dabei nicht erzeugt. Das geht danach wie bisher mit „KI-Bild“ pro Produkt.

## Technische Details
- `src/lib/product-media.server.ts` bzw. `translate.server.ts`: neue Funktion `suggestProducts(path, existing, keywords)` über das bestehende `aiJson` (Responses, `openai/gpt-6-astra`, json_schema `{items:[{name, emoji, quantity, unit}]}`). Deutsche Namen, Schweizer Schreibweise ss.
- `src/lib/admin.functions.ts`: `suggestCategoryProducts` (POST, Admin-Prüfung über `has_role`). Lädt Pfad und Produkte der Kategorie, ruft die KI auf und gleicht die Vorschläge per normalisiertem Namen mit allen `products` ab. Antwort: `{name, emoji, quantity, unit, existingId?}`.
- `createSuggestedProducts` (POST, Admin): fügt neue `products` mit fortlaufender `sort_order` ein, legt `product_aliases` für vorhandene an und ruft dann `translateMissing` in Stapeln von 120 auf.
- `src/components/admin/catalog-tile-editor.tsx`: Knopf und Vorschlags-Sheet (Checkbox-Liste, Stichwort-Feld, Ladezustand). Nach dem Anlegen wird der Katalog neu geladen (Query-Invalidate wie beim bestehenden Anlegen).
- i18n-Keys `tile.suggest*` in `src/i18n/de.ts` und allen Sprachen in `messages.json`.
- Test: als Admin in einer Kategorie Vorschläge holen, zwei davon anlegen und prüfen, ob sie erscheinen und übersetzt sind.
