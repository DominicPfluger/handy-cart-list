# Ausblenden-Symbol im Kachelmodus + Laden-Löschen nur als Ausblenden

## Ziel

1. Im Kachelmodus erscheint neben dem Stift-Symbol ein Auge-Symbol, mit dem sich eine Kategorie (und ein Produkt) direkt aus- und wieder einblenden lässt — ohne den Bearbeiten-Dialog zu öffnen.
2. Wenn ein Laden gewählt ist (Laden-Admin), führt „Löschen" einer Kategorie oder eines Produkts nie zum globalen Löschen, sondern blendet den Eintrag nur für diesen Laden aus.

## Aktueller Stand (geprüft)

- `admin.tsx`: Bei gewähltem Laden leitet `remove` bereits auf `storeToggleHidden` um (Zeile ~1073) — der Katalog bleibt global unberührt. Der Bearbeiten-Dialog nutzt denselben `remove`-Pfad, ist also ebenfalls sicher.
- `catalog-tile-editor.tsx`: Kategorien-Zeilen (Liste ~588, Kacheln ~523) und Produkt-Zeilen (~785) haben Stift- und Lösch-Knöpfe, aber kein Schnell-Ausblenden-Symbol.
- Ausgeblendete Einträge bekommen im Laden-Modus bereits ein 🚫 vor dem Namen (`nmStore`).

## Umsetzung

### 1. Neues Auge-Symbol im Kachelmodus (`catalog-tile-editor.tsx`)

- Neue optionale Prop `onToggleHidden?: (kind: "department" | "product", id: string) => void` und `isHidden?: (id: string) => boolean`.
- Kategorien: Auge-Knopf (Eye / EyeOff aus lucide) direkt neben dem Stift — in der Listenansicht und in der Kachelansicht.
- Produkte: Auge-Knopf in der Zeilen-Aktionsleiste neben dem Stift.
- Ausgeblendete Zeilen/Kacheln werden abgedunkelt dargestellt (z. B. `opacity-50`), damit man sieht, was ausgeblendet ist, und sie per Klick wieder einblenden kann.
- Der Knopf erscheint nur, wenn `onToggleHidden` übergeben wird (also im Laden-Modus) — im globalen Katalog ändert sich nichts.

### 2. Laden-Modus verdrahten (`admin.tsx`)

- `onToggleHidden={storeId ? storeToggleHidden : undefined}` und `isHidden={(id) => Boolean(ovOf(id)?.hidden)}` an `CatalogTileEditor` übergeben.
- Bestehendes Verhalten bleibt: Der Lösch-Knopf (Papierkorb) ruft im Laden-Modus `storeToggleHidden` auf — als Sicherheit wird der Titel/Tooltip des Papierkorbs im Laden-Modus auf „Ausblenden" geändert, damit klar ist, dass nichts global gelöscht wird.

### 3. i18n (`de.ts`)

- Neue Schlüssel: `adm.hide` („Ausblenden"), `adm.unhide` („Wieder einblenden"). Andere Sprachen fallen auf Deutsch zurück (Admin ist German-first).

## Technische Details

- Dateien: `src/components/admin/catalog-tile-editor.tsx`, `src/routes/_authenticated/admin.tsx`, `src/i18n/de.ts`.
- Keine Datenbank-Änderung nötig — `store_department_overrides`/`store_product_overrides` mit `hidden`-Flag existieren bereits.
- Kein globaler Löschpfad für Laden-Admins: `remove` bleibt im Laden-Modus auf `storeToggleHidden` umgeleitet.
