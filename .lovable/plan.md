# Admin-Katalog: «Kategorien & Produkte anlegen» auch auf der obersten Ebene

## Ziel
Der Knopf «📂 Kategorien & Produkte anlegen» (Mehrfach-Anlage mit Kategorien und Produkten) erscheint heute nur, wenn eine Kategorie geöffnet ist. Er soll auch auf der obersten Katalog-Ebene verfügbar sein — neu angelegte Kategorien landen dann als Hauptkategorien (ohne Überkategorie).

## Umsetzung

### 1. Knopf auf oberster Ebene zeigen — `src/components/admin/catalog-tile-editor.tsx`
- Bedingung des Knopfs von `p.cur && p.onBulkTree` auf `p.onBulkTree` ändern, damit er im Bearbeitungsmodus auch ohne geöffnete Kategorie erscheint.

### 2. Verdrahtung ohne geöffnete Kategorie — `src/routes/_authenticated/admin.tsx`
- `onBulkTree` immer übergeben (`() => setBulkTree(true)` statt nur bei `cur`).
- Dialog-Render-Bedingung `{bulkTree && cur && …}` auf `{bulkTree && …}` lockern.
- `createTree`: die Abbruch-Bedingung `if (!cur || !d)` auf `if (!d)` ändern; `parent_id: cur` funktioniert mit `null` bereits als Hauptkategorie (Spalte ist nullable). Bestehende-Namen-Prüfung und Sortierung laufen unverändert über die Kinder der aktuellen Ebene (oben = alle Hauptkategorien).

## Verhalten danach
- Oberste Ebene: «📂 Kategorien & Produkte anlegen» legt Hauptkategorien samt Produkten an; existiert der Name schon, werden die Produkte der bestehenden Hauptkategorie angehängt (wie bisher innerhalb von Kategorien).
- Innerhalb einer Kategorie bleibt alles wie gehabt.
- Übersetzung und Erfolgsmeldung («{cats} Kategorien, {n} Produkte angelegt») funktionieren unverändert.

## Technische Details
- Keine neuen Übersetzungs-Schlüssel nötig (`adm.bulkTree*` existiert in allen 16 Sprachen).
- Keine Datenbankänderung; `departments.parent_id` ist bereits nullable.
- Kein Eingriff in Markt-Ansicht oder Alias-Logik.
