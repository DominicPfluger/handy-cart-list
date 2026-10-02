# Produkte nach Relevanz sortieren im Admin-Bereich

## Ziel

In der Katalog-Bearbeitung des Admin-Bereichs (Tab „Katalog") soll es einen Knopf „Nach Relevanz sortieren" geben — sowohl in der Listen- als auch in der Kachel-Ansicht. Er sortiert die Produkte der gerade geöffneten Kategorie per KI so, wie sie typischerweise gekauft werden (Klassiker zuerst).

## Verhalten

- Knopf erscheint in der Werkzeugleiste der aktuellen Kategorie, in beiden Ansichten (Liste und Kacheln), sobald mindestens 2 Produkte vorhanden sind.
- Vor dem Sortieren kommt eine Rückfrage zum Bestätigen.
- Die KI ordnet nur die vorhandenen Produkte um — sie fügt nichts hinzu, entfernt nichts und benennt nichts um.
- Ist oben ein Markt ausgewählt, gilt die Sortierung nur für diesen Markt (wie bisher beim Verschieben). Ohne Markt-Auswahl gilt sie global für alle Märkte.
- Die neue Reihenfolge wird sofort angezeigt und gespeichert; Erfolg wird kurz gemeldet.
- Sind Überschriften in der Kategorie vorhanden, wird jede Überschriften-Gruppe separat sortiert, damit die Gruppenstruktur erhalten bleibt.

## Technische Umsetzung

- Vorhandene Server-Funktion `rankProducts` (src/lib/admin.functions.ts) wiederverwenden — dieselbe, die der Marktkatalog für „Nach Relevanz im Markt sortieren" nutzt (Kriterium „popularity", optional mit Markt-Code). Keine neue Server-Logik nötig.
- src/routes/_authenticated/admin.tsx: neue Funktion `sortByRelevance()` — sammelt die Produkte der aktuellen Kategorie (bei Überschriften als getrennte Gruppen), ruft `rankProducts`, baut die neue Reihenfolge und speichert sie über die vorhandene `saveOrder()` (global in `products.sort_order` bzw. pro Markt in `product_market_order`). Anzeige sofort aktualisieren wie bei `reorder()`.
- Listen-Ansicht: Knopf in der Zeile mit den bestehenden Aktionen der Kategorie.
- Kachel-Ansicht: Knopf über dem Produkt-Raster; src/components/admin/catalog-tile-editor.tsx bekommt dafür eine neue Callback-Eigenschaft `onSortRelevance` von admin.tsx.
- Neue Texte (Knopf, Rückfrage, Erfolgsmeldung) in src/i18n/de.ts und allen 15 Sprachen in src/i18n/messages.json.

## Prüfung

- Fehlerprüfung (Build) muss ohne Befund durchlaufen.
- In der Vorschau: Knopf in beiden Ansichten sichtbar, Sortieren in einer Testkategorie ausführen und Reihenfolge prüfen.
