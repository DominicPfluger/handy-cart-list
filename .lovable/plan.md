# Kategorien unter Einstellungen ordnen und umbenennen

## Abteilungsansicht (vereinfacht)
- Kategorie-Kacheln lassen sich nicht mehr per langem Drücken verschieben.
- Der Stift zum Umbenennen auf den Kacheln fällt weg, ebenso das Umbenennen über den Pfad oben.
- Bleibt erhalten: Kategorien öffnen, Papierkorb (lokal ausblenden), „+ Kategorie", Produkte verschieben und umbenennen.
- Hinweistext unter den Kacheln wird angepasst (kein Hinweis mehr aufs Verschieben von Kategorien).

## Neu unter Mehr / Einstellungen: „Kategorien ordnen & umbenennen"
- Einklappbarer Bereich wie „Abteilungs-Reihenfolge".
- Liste der Hauptkategorien mit Griff zum Verschieben (Drag & Drop).
- Jede Hauptkategorie lässt sich aufklappen; darin ihre Unterkategorien, ebenfalls per Griff sortierbar.
- Stift neben jeder (Unter-)Kategorie öffnet den bekannten Umbenennen-Dialog (eigener Name, Zurücksetzen, bei selbst erstellten Löschen).
- Knopf „Reihenfolge zurücksetzen".
- Alles bleibt nur auf deinem Gerät gespeichert; die Reihenfolge wirkt wie bisher in Abteilungen, Liste und Favoriten.

## Technische Details
- `src/routes/abteilungen.tsx`: Department-Drag (startPress für Kacheln, `move`-Zweige im Drop-Handler), Rename-Button, Breadcrumb-Rename und ggf. ungenutzte Imports entfernen; Produkt-Drag bleibt.
- Neue Komponente `src/components/category-order-settings.tsx`: nutzt `useDepartmentOrder` (`move`, `reset`) und `useCatalog`, dnd-kit wie `store-order-settings.tsx`, verschachtelte SortableContexts je Eltern-Ebene; `RenameDialog` + `useCustomNames`.
- Einbinden in `src/routes/mehr.tsx` direkt unter `StoreOrderSettings`.
- Neue Texte (`catOrder.title`, `catOrder.hint`, `catOrder.reset`, angepasster `dept.tip`) in `de.ts` und allen Locale-Dateien.
- Keine Datenbankänderung.
