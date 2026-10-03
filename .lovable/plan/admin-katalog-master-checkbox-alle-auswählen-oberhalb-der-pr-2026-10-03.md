# Admin-Katalog: Master-Checkbox „Alle auswählen" oberhalb der Produktauflistung

## Ziel
Im Admin-Panel (Katalog, Produktliste einer Kategorie) gibt es neu direkt oberhalb der Produktauflistung eine Checkbox „Alle auswählen":
- Haken setzen → alle Produktzeilen der aktuellen Kategorie werden markiert (wie heute über den „Alle auswählen"-Knopf in der Auswahlleiste).
- Haken entfernen → Auswahl komplett aufheben.
- Zeigt einen Zwischenzustand (Strich), wenn nur ein Teil der Produkte markiert ist.
- Nach dem Markieren erscheint wie bisher die Auswahlleiste („n ausgewählt – zum Verschieben ziehen") und die markierten Produkte lassen sich gemeinsam verschieben.

Der bestehende „Alle auswählen"-Knopf in der Auswahlleiste bleibt unverändert.

## Umsetzung
Datei: `src/components/admin/catalog-tile-editor.tsx`

- Neue Zeile zwischen der Auswahlleiste und dem Produktlisten-Container (`p.cur &&`-Block, vor dem `divide-y`-Container):
  - Checkbox (wie die Zeilen-Checkboxen: `h-4 w-4 accent-primary`) mit Label `T("adm.selectAll")`.
  - Nur sichtbar, wenn die Kategorie Produkte enthält (`p.products.length > 0`).
  - `checked = p.products.length > 0 && selected.size === p.products.length`, `ref` für `indeterminate` (Teilauswahl).
  - onChange: bei „alle markiert" → `setSelected(new Set())`, sonst → `setSelected(new Set(p.products.map((x) => x.id)))` (inkl. Alias-Zeilen, wie beim bestehenden Knopf).
- Zustands-Reset bei Kategoriewechsel bleibt unverändert.
- Keine neuen i18n-Texte: `adm.selectAll` wird wiederverwendet. Keine Datenbankänderung.

## Prüfung
- Typprüfung (`tsgo --noEmit`).
- Browser-Test im Admin-Katalog: Master-Checkbox setzen → alle Zeilen markiert, Auswahlleiste erscheint; ein Produkt abwählen → Zwischenzustand (Strich); Master-Checkbox abwählen → Auswahl leer. Danach Zug-Test: markierte Produkte gemeinsam auf eine Kategorie-Kachel ziehen.
