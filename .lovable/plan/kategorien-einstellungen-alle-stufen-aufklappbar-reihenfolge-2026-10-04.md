# Kategorien-Einstellungen: alle Stufen aufklappbar + Reihenfolge pro Laden

## Was du bekommst
- In „Kategorien ordnen & umbenennen" lässt sich jede Stufe aufklappen: Hauptkategorie, darin Unterkategorien, darin wiederum deren Unterkategorien usw. Mehrere Kategorien können gleichzeitig offen sein.
- Auf jeder Stufe: Griff zum Verschieben, Stift zum Umbenennen, Papierkorb zum Entfernen.
- Oben im Bereich eine **Laden-Auswahl** (Standard, Läden deines Marktes, eigene Läden, „+ Neuer Laden"), wie bisher bei „Abteilungs-Reihenfolge".
- Die Reihenfolge der **Hauptkategorien** wird pro Laden gespeichert und gilt in der Einkaufsliste für Listen dieses Ladens. Unterkategorien gelten für alle Läden gleich.
- „Reihenfolge zurücksetzen" setzt die Reihenfolge des gewählten Ladens zurück.
- Der bisherige separate Bereich „Abteilungs-Reihenfolge" entfällt, damit es nur noch einen Ort gibt. Eigene Läden anlegen, bearbeiten und löschen wandert mit in den neuen Bereich.
- Alles bleibt nur auf deinem Gerät gespeichert.

## Technische Details
- `category-order-settings.tsx`: rekursive Zeilen-Komponente mit `expanded: Set<string>`, je Ebene eigener `DndContext`/`SortableContext`.
- Hauptebene: Reihenfolge aus `useGroupOrder` (`all[store]`, `saveFor`, `resetFor`, `applyGroupOrder`) — dieselben Schlüssel wie die Listen-Sortierung; Unterebenen über `useDepartmentOrder.move`.
- Laden-Auswahl und Laden-Formulare (`StoreFields`, add/update/removeCustomStore) aus `store-order-settings.tsx` übernehmen; danach `StoreOrderSettings` aus `mehr.tsx` entfernen und Datei löschen.
- Ausblenden: Kategorien weiterhin über `hideDepartment` (gilt überall); das Ausblenden pro Laden (`hideFor`) bleibt in den Daten erhalten, wird aber in der Liste weiter berücksichtigt.
- Keine Datenbankänderung, keine neuen Texte nötig (vorhandene `store.*`-Texte).
