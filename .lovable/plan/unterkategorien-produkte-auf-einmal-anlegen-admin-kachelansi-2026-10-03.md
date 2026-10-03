# Unterkategorien + Produkte auf einmal anlegen (Admin-Kachelansicht)

## Was der Nutzer sieht
In der Bearbeiten-Leiste der Kachelansicht kommt neben „+ Mehrere Produkte" ein neuer Knopf **„📂 Kategorien & Produkte anlegen"** (sichtbar, wenn eine Kategorie geöffnet ist). Er öffnet einen Dialog mit einem grossen Textfeld.

Eingaberegel:
- Die **erste Zeile** eines Blocks ist die Überschrift = neue Unterkategorie (in der aktuell geöffneten Kategorie).
- Die folgenden Zeilen sind die Produkte dieser Unterkategorie.
- Eine **Leerzeile** beendet den Block; die nächste Textzeile ist wieder eine neue Unterkategorie.

```text
Fruchtgemüse
Tomaten
Gurken

Blattgemüse
Spinat
Rucola
```

Unter dem Textfeld erscheint eine Live-Vorschau: „2 Unterkategorien, 4 Produkte" mit Liste. Existiert eine Unterkategorie gleichen Namens bereits, wird sie wiederverwendet (Hinweis „vorhanden"); doppelte Produktnamen innerhalb einer Unterkategorie werden ignoriert. Knöpfe „Anlegen" und „Abbrechen".

Nach dem Anlegen: Unterkategorien am Ende der aktuellen Kategorie, Produkte in Eingabereihenfolge, automatische Übersetzung in alle Sprachen im Hintergrund (wie bisher), Erfolgsmeldung mit Anzahl.

## Technische Details
- `catalog-tile-editor.tsx`: neue Prop `onBulkTree`, Knopf neben `adm.multi`.
- `admin.tsx`: neue Komponente `BulkTreeForm` (Textarea, Parser: Blöcke per `/\n\s*\n/`, erste Zeile = Name, Rest = Produkte, trim/dedupe), Funktion `createTree(blocks)`: pro Block bestehende Unterkategorie (`parent_id = cur`, Name case-insensitiv) suchen oder `departments.insert` mit `sort_order` = max+1; Produkte per `products.insert` (Emoji-Fallback wie BulkAdd, `sort_order` fortlaufend ab max+1); danach `translateIds` für neue Kategorien und Produkte, Daten neu laden.
- Schreibrechte über bestehende Admin-RLS, keine DB-Änderung.
- Neue i18n-Schlüssel `adm.bulkTree`, `adm.bulkTreeHint`, `adm.bulkTreePreview`, `adm.bulkTreeDone` in de.ts + allen 15 Sprachen.
- Test: im Browser zwei Blöcke anlegen, Ergebnis prüfen, Testdaten wieder löschen.
