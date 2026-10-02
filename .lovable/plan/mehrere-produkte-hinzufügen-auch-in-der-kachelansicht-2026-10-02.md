# „Mehrere Produkte hinzufügen" auch in der Kachelansicht

## Ausgangslage (geprüft)
- Listenmodus (`admin.tsx` Zeile 399): Knopf „+ Mehrere Produkte" existiert bereits und öffnet `BulkAddForm` (ein Name pro Zeile, Emoji, Menge/Einheit, ✨ fehlende Produkte vorschlagen, Übernahme der Vorschläge).
- Kachelmodus (`catalog-tile-editor.tsx`): Es gibt nur die Kacheln „Neue Kategorie", „+ Überschrift", „Neues Produkt" und die Zeile „✨ Vorschläge" — der Mehrfach-Hinzufügen-Knopf **fehlt** hier.
- Der `BulkAddForm` samt Erstellen-Logik (Insert + automatische Übersetzung in alle Sprachen) existiert in `admin.tsx` (Zeilen 421–430, 700–772) und wird wiederverwendet.

## Umsetzung

1. **`src/routes/_authenticated/admin.tsx`**
   - Den bestehenden `onSubmit`-Handler des Bulk-Formulars in eine lokale Funktion auslagern (z. B. `handleBulkSubmit`), damit Liste und Kacheln denselben Code nutzen.
   - Den `{bulk && <BulkAddForm … />}`-Block auch im Kachelmodus-Zweig rendern (nach `<CatalogTileEditor />`), mit derselben Logik.
   - `CatalogTileEditor` ein neues Prop `onBulkAdd?: () => void` übergeben → `() => setBulk("plain")`.

2. **`src/components/admin/catalog-tile-editor.tsx`**
   - Neues Prop `onBulkAdd` aufnehmen.
   - Im Bearbeiten-Raster eine Kachel „+ Mehrere Produkte" (gleicher Stil wie „Neues Produkt": `min-h-28`, gestrichelter Rand, `text-primary`, „+" gross) direkt nach der „Neues Produkt"-Kachel einfügen; Klick ruft `p.onBulkAdd` auf.

## Keine weiteren Änderungen nötig
- Übersetzungen: Schlüssel `adm.multi` („Mehrere Produkte") existiert bereits in allen 16 Sprachen.
- Keine Datenbankänderung; gleiche Erstellen-Logik wie im Listenmodus (inkl. automatischer Übersetzung neuer Produkte).

## Verifikation
- Build prüfen (build-errors.log).
- Playwright im Preview: Kachelansicht einer Kategorie mit Produkten öffnen, Kachel „Mehrere Produkte" antippen, Formular erscheint, zwei Test-Namen eingeben, erstellen, Produkte erscheinen in der Liste — danach Testprodukte wieder löschen.
