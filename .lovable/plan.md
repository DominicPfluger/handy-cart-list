# Alias-Produkte in der Kachel-Ansicht per Drag & Drop verschieben

## Ziel
Im Admin-Panel (Katalog, Kachel-Ansicht) erscheinen Alias-Produkte direkt in der Produktliste der Kategorie, an ihrer tatsächlichen Position, und lassen sich wie normale Produkte per Drag & Drop zwischen andere Produkte ziehen. Die Reihenfolge entspricht danach genau der Abteilungsansicht in der App.

## Verhalten
- Alias-Produkte stehen gemischt zwischen den eigenen Produkten (sortiert wie in der App), gekennzeichnet mit gestricheltem Rahmen und „Alias“-Hinweis.
- Ziehen funktioniert in beide Richtungen: Alias zwischen eigene Produkte und eigene Produkte zwischen Aliase; auch Ablegen unter einer Überschrift.
- Klick auf ein Alias öffnet wie bisher die Bearbeitung des Originalprodukts; ✕ entfernt nur den Alias-Eintrag (mit Bestätigung).
- Ein Alias auf eine andere Kategorie oder den Pfad zu ziehen ist nicht möglich (verhindert, dass das Originalprodukt versehentlich umzieht).
- Die separate Liste „Alias-Produkte“ mit ▲/▼-Pfeilen unterhalb entfällt; Alias-Kategorien bleiben unverändert.

## Technische Details
- `admin.tsx`: Produktliste für `cur` aus eigenen Produkten + `product_aliases` (department_id = cur) zusammenführen, nach sort_order sortiert; Alias-Einträge tragen `aliasId`.
- `catalog-tile-editor.tsx`: Alias-Kacheln mit eindeutigem Key/`data-id` (Alias-Id), eigenem Stil, Drop auf Kategorie/Crumb für Aliase ignorieren.
- `reorder("product", …)`: neue Gesamtreihenfolge fortlaufend durchnummerieren und sort_order in `products` bzw. `product_aliases` schreiben (nur geänderte Zeilen); danach Katalog- und Alias-Abfragen invalidieren.
- `ProductAliasRows` aus dem `below`-Bereich entfernen (Komponente für ggf. andere Stellen behalten).
- Prüfung per Playwright in einer Kategorie mit Alias (Desktop und 390 px): Verschieben, Neuladen, Reihenfolge in der App-Abteilungsansicht.
