# Kategorien-Dropdowns: Reihenfolge wie in der Abteilungsansicht

## Ziel
Kategorien-Auswahllisten (Dropdowns) sollen nicht mehr alphabetisch sortiert sein, sondern der Katalog-Reihenfolge folgen — derselben Reihenfolge, die auch die Abteilungsansicht zeigt (Feld `sort_order` der Abteilungen, Oberkategorien vor ihren Unterkategorien).

## Betroffene Stellen
1. **Produkt anlegen/bearbeiten** (`src/components/admin/catalog-tile-editor.tsx`, `newDeptOpts`, Zeile ~682): Die Kategorie-Auswahl sortiert aktuell mit `localeCompare` alphabetisch.
2. **Pflege → Produkte ohne Bild** (`src/components/admin/missing-images-panel.tsx`, `catOptions`, Zeile ~40): Der Kategorienfilter sortiert ebenfalls alphabetisch.

## Umsetzung
- Die Abteilungen (`depts`) kommen bereits nach `sort_order` sortiert aus der Datenbank (`src/lib/catalog.functions.ts`).
- Neuer Sortier-Helper (lokal in beiden Komponenten oder kleine gemeinsame Funktion): Baum-Reihenfolge aufbauen — Oberkategorien in `sort_order`-Reihenfolge, darunter jeweils ihre Unterkategorien ebenfalls in `sort_order`-Reihenfolge. Die Pfad-Beschriftung („Frischmarkt › Früchte") bleibt unverändert, nur die Sortierung ändert sich.
- Die alphabetische Sortierung (`localeCompare`) entfällt an beiden Stellen.
- Keine Änderungen an Datenbank, i18n oder anderen Ansichten.

## Verifikation
- Typprüfung und Build fehlerfrei.
- Browser-Test als Admin: Beide Dropdowns zeigen die Kategorien in der Reihenfolge der Abteilungsansicht (z. B. Frischmarkt zuerst, Unterkategorien direkt unter ihrer Oberkategorie).
