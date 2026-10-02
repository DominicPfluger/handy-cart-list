# Titel (Überschriften) in Listen- und Kachelmodus

## Ausgangslage
- Listenmodus: Überschriften gibt es schon (Knopf „+ Überschrift" in der Werkzeugleiste, Ziehen auf ein Produkt verschiebt sie).
- Kachelmodus: Überschriften werden weder angezeigt noch können sie angelegt oder verschoben werden.

## Was gebaut wird
1. **Knopf „+ Titel" direkt oberhalb der Produktliste** – in beiden Modi gleich platziert. Tippen öffnet ein Eingabefeld; der neue Titel landet über dem ersten Produkt der Kategorie und wird automatisch in alle Sprachen übersetzt.
2. **Kachelmodus zeigt Titel** als fette Zwischenzeilen zwischen den Produkten (wie in der App).
3. **Drag & Drop in beiden Modi:** Titel greifen und über einem Produkt loslassen – der Titel steht danach direkt über diesem Produkt. Produkte lassen sich weiterhin unter einen Titel ziehen.
4. **Titel bearbeiten/löschen** im Kachelmodus per Antippen (Name ändern, Löschen), wie bei Produkten.

## Technische Details
- Daten: bestehende Tabelle `product_headings` (`department_id`, `before_product_id`), bestehende Serverfunktionen `saveHeading`/`deleteHeading`; keine Datenbankänderung.
- `admin.tsx`: Knopf aus der Werkzeugleiste über die Produkt-Sektion verschieben; `headings`, `moveHeading`, Anlegen/Löschen als Props an `catalog-tile-editor.tsx` reichen.
- `catalog-tile-editor.tsx`: Titelzeilen vor dem jeweiligen `before_product_id` rendern; Pointer-Drag um `kind: "heading"` erweitern (Drop auf Produkt → `moveHeading`).
- i18n: ggf. neuer Key für „Titel" in `de.ts` + allen Lokalen.
