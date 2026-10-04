# Leere Kategorien: Baumsortierung + aufklappbare Zeilen

## Ist-Zustand (geprüft)
Im Pflege-Tab unter „Datenlücken" listet die Karte „Leere Kategorien" (`emptyDepts` in `catalog-health-panel.tsx`) alle Endkategorien ohne Produkte als flache Liste. Ein Klick auf eine Zeile springt sofort in den Katalog-Kachelmodus.

## Änderung
- **Sortierung nach Abteilungsansicht:** Die Liste folgt der Baumreihenfolge der Abteilungen (`deptTreeOrder` aus `src/lib/dept-order.ts`, wie bei den Kategorien-Dropdowns), statt der bisherigen Reihenfolge.
- **Aufklappbare Zeilen:** Jede Zeile lässt sich einzeln auf- und zuklappen (Chevron). Aufgeklappt zeigt die Zeile:
  - den vollständigen Kategoriepfad (z. B. „Frischmarkt › Gemüse › …"),
  - den Knopf „Im Katalog öffnen" (bisheriges Sprungziel in den Kachelmodus),
  - den Knopf „Bearbeiten" ist nicht nötig — Kategorien haben keinen Bearbeitungsdialog hier; nur Öffnen.
- Ein Klick auf die Zeile klappt nur noch auf/zu und navigiert nicht mehr sofort.

## Technik
- `src/components/admin/catalog-health-panel.tsx`: `emptyDepts`-Items mit `deptTreeOrder` sortieren; lokaler State für aufgeklappte Zeilen-IDs; Zeilen-UI um Chevron + Detailbereich erweitern.
- i18n: kein neuer Schlüssel nötig (vorhandene Texte wiederverwenden), ausser für „Im Katalog öffnen" — vorhandenen Schlüssel prüfen/wiederverwenden.
- Prüfung: `bunx tsgo --noEmit`, Build-Log, Browser-Check im Pflege-Tab.
