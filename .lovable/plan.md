# Standard-Menge & -Einheit direkt in der Katalog-Auflistung ändern

## Ziel
Im Admin-Katalog (Kachel-/Listenansicht) können Standard-Menge und Standard-Einheit eines Produkts per Dropdown direkt in der Zeile geändert werden — ohne den Bearbeitungsdialog zu öffnen. Die beiden Dropdowns stehen vor dem Stiftsymbol.

## Umsetzung

### `src/components/admin/catalog-tile-editor.tsx`
- In der Produktzeile (vor dem Stift-Button, Zeile ~538) zwei kompakte `<select>`-Elemente einfügen:
  - **Menge**: Dropdown mit gängigen Werten (0.25, 0.5, 0.75, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20), aktueller Wert vorausgewählt; ist der gespeicherte Wert nicht in der Liste, wird er zusätzlich als Option angezeigt.
  - **Einheit**: Dropdown mit allen aktivierten Einheiten aus `getUnits(getLocale())` (Label in aktueller Sprache).
- Änderung speichert sofort über den bestehenden `p.run(...)`-Callback: `supabase.from("products").update({ default_quantity, default_unit })` auf das Basisprodukt (`pid`), danach Katalog-Cache aktualisieren (wie bei den anderen Inline-Aktionen).
- Nur im Bearbeitungsmodus aktiv (`disabled={!editMode}`), bei Alias-Zeilen deaktiviert (Aliase teilen die Einheit des Basisprodukts).
- Styling: schmale, zeilenhohe Selects (ca. `h-7`, abgerundet, dezenter Rahmen), damit die Zeile nicht höher wird; auf Mobilgeräten bleiben sie lesbar.

### Texte
- Neue i18n-Schlüssel (de + Auto-Übersetzung für alle 16 Locales über den bestehenden Mechanismus): `adm.defaultQty` (aria-label „Standard-Menge"), `adm.defaultUnit` (aria-label „Standard-Einheit"), `adm.defaultsSaved` (Erfolgs-Hinweis „Standard gespeichert").

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`).
- Browser-Test im Admin-Katalog: Menge/Einheit per Dropdown ändern, Prüfung, dass der Wert in der Zeile und nach Neu laden korrekt ist.
