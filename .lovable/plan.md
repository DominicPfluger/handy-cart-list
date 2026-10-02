# Alias-Produkt in der Kachel-Ansicht hinzufügen

## Ziel
Im Admin-Panel (Kachel-Ansicht, geöffnete Kategorie) gibt es direkt nach dem Knopf „Neues Produkt" einen neuen Knopf **„+ Alias-Produkt"**. Damit lässt sich ein bestehendes Produkt aus einer anderen Kategorie zusätzlich an dieser Stelle anzeigen — ohne erst den Bearbeiten-Dialog des Produkts öffnen zu müssen.

## Umsetzung

1. **Neuer Knopf** in der Button-Zeile der Kachel-Ansicht (`catalog-tile-editor.tsx`), direkt nach „+ Neues Produkt" und vor „+ Mehrere Produkte". Nur sichtbar, wenn eine Kategorie geöffnet ist (`p.cur`).

2. **Auswahl-Dialog** (analog zum bestehenden Alias-Kategorie-Dialog):
   - Suchfeld, das alle Produkte des Katalogs durchsucht (Name in der aktuellen Katalogsprache).
   - Ausgeschlossen: Produkte, die bereits in dieser Kategorie liegen (eigene oder bereits verlinkte Alias-Produkte).
   - Klick auf ein Produkt legt den Alias an und schliesst den Dialog.

3. **Anlegen** in `admin.tsx`: Eintrag in `product_aliases` (product_id, department_id = offene Kategorie, sort_order = Ende der Liste), danach Alias-Abfrage neu laden. Das Alias-Produkt erscheint sofort in der Kachel-Liste — mit gestricheltem Rahmen und „· Alias"-Hinweis, wie die bestehenden Alias-Einträge.

4. **Bestehendes Verhalten bleibt:** Alias-Produkte sind per Drag & Drop verschiebbar, per Klick öffnet sich das Originalprodukt, per ✕ wird nur die Verknüpfung entfernt (mit Bestätigung). Die Alias-Verwaltung im Produkt-Bearbeiten-Dialog bleibt unverändert.

5. **Beschriftungen** in Deutsch und allen 15 App-Sprachen ergänzen (Knopf, Dialog-Titel, Suchfeld-Platzhalter, Erfolgsmeldung).

## Nicht Teil
- Keine Datenbank-Änderung (`product_aliases` existiert bereits).
- Kein Anlegen neuer Produkte über diesen Dialog — nur Verknüpfen bestehender.

## Technische Details
- `catalog-tile-editor.tsx`: neue Props `productAliasOptions?: { id: string; label: string }[]` und `onAddProductAlias?: (productId: string) => void`; State `prodAliasPick`/`prodAliasSearch`; Picker-Dialog wie beim Alias-Kategorie-Picker (Zeilen ~320ff als Vorlage).
- `admin.tsx`: `productAliasOptions` aus `data.prods` (alle Produkte, gefiltert: nicht `department_id === cur`, nicht bereits in `aliasQ.data` für `cur`); `onAddProductAlias` führt `supabase.from("product_aliases").insert(...)` aus und invalidiert `ALIAS_KEY`.
- i18n: neue Schlüssel `tile.newProdAlias`, `tile.pickProdAlias`, `tile.prodAliasSearch` in `de.ts` + `messages.json` (15 Locales).

## Prüfung
- Typecheck + Build.
- Browser-Test (Playwright): Kategorie öffnen → „+ Alias-Produkt" → Produkt suchen und wählen → Alias-Kachel erscheint → per ✕ wieder entfernen.
