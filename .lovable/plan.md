# Überschriften in Unterkategorien umwandeln

## Was der Admin bekommt
In der Admin-Produktliste erscheint bei jeder Abteilung, die Überschriften enthält, ein Knopf **„Überschriften in Unterkategorien umwandeln"**.

Nach einer Bestätigungsfrage (mit Vorschau: „3 Unterkategorien, 24 Produkte werden verschoben"):
- Jede Überschrift wird zu einer neuen Unterkategorie dieser Abteilung (gleicher Name, Reihenfolge wie in der Liste).
- Alle Produkte unter einer Überschrift (bis zur nächsten Überschrift) werden in die neue Unterkategorie verschoben, Reihenfolge bleibt erhalten.
- Produkte vor der ersten Überschrift bleiben in der ursprünglichen Abteilung.
- Die Überschriften werden danach gelöscht.
- Existiert bereits eine Unterkategorie mit gleichem Namen, werden die Produkte dort angehängt statt eine Dublette anzulegen.
- Die neuen Unterkategorien werden automatisch in alle Sprachen übersetzt (wie bei neu angelegten Kategorien); Icon/Bild bleibt leer und kann später ergänzt werden.

## Was erhalten bleibt
- Verknüpfungen (Produkt erscheint zusätzlich an anderer Stelle) zeigen weiter auf dieselben Produkte; verknüpfte Einträge in der Abteilung werden nicht verschoben.
- Bestehende Einkaufslisten bleiben unverändert.

## Technische Details
- Neue Admin-Funktion in `src/routes/_authenticated/admin.tsx`: Gruppen aus `product_headings` (Anker `before_product_id`) und der sortierten Produktliste der Abteilung bilden (bestehende Gruppierungslogik wiederverwenden).
- Pro Gruppe: `departments` insert (parent_id = Abteilung, sort_order fortlaufend) oder vorhandene Unterkategorie gleichen Namens nutzen; `products.update({ department_id, sort_order })`; anschliessend Überschrift löschen. Schreiben über Browser-Client unter Admin-RLS, kein neues Schema.
- Danach `translateIds` für neue Kategorien, Katalog-Cache neu laden, Toast mit Ergebnis.
- i18n: neue Texte `adm.headingsToSub`, `adm.headingsToSubConfirm`, `adm.headingsToSubDone` in allen 16 Sprachen.
- Prüfung: Browser-Test an einer Abteilung mit Überschriften, Build fehlerfrei.
