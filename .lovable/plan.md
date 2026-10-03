# Sammel-Löschen im Admin-Katalog (Produkte + leere Kategorien)

## Ziel
In der Admin-Kachelansicht können markierte Einträge auf einmal gelöscht werden: ausgewählte Produkte und ausgewählte Kategorien (nur wenn sie leer sind). Ein Löschen-Knopf erscheint in der Auswahlleiste, sobald mindestens ein Eintrag markiert ist.

## Verhalten
- **Produkte:** Wie bisher pro Checkbox markierbar (inkl. Alias-Zeilen — beim Löschen einer Alias-Zeile wird nur der Alias entfernt, nicht das Stammprodukt). Der Löschen-Knopf entfernt alle markierten Produkte auf einmal.
- **Kategorien:** Kategorien-Kacheln bekommen im Bearbeiten-Modus eine Checkbox (Alias-Kategorien: Checkbox entfernt nur den Alias). Kategorien werden nur gelöscht, wenn sie leer sind (keine Produkte, keine Unterkategorien) — wie beim bisherigen Einzel-Löschen. Nicht-leere markierte Kategorien werden übersprungen und in einer Meldung genannt.
- **Bestätigung:** Vor dem Löschen erscheint ein Bestätigungsdialog mit Anzahl und Art der Einträge (z. B. „5 Produkte und 2 Kategorien wirklich löschen?").
- **Aufräumen:** Beim Produkt-Löschen werden wie beim Einzel-Löschen auch zugehörige Überschriften-Anker und Übersetzungen entfernt; bei Kategorien deren Überschriften und Übersetzungen.
- Nach dem Löschen wird die Auswahl geleert und die Liste aktualisiert.

## Technische Umsetzung
- `src/components/admin/catalog-tile-editor.tsx`:
  - Auswahl-State von `Set<string>` (nur Produkt-IDs) auf Einträge mit Art erweitern: `Set<"product:<id>" | "department:<id>" | "alias:<id>" | "deptalias:<id>">` — oder zweites Set `selectedDepts` für Kategorien (einfacher, weniger Umbau).
  - Kategorien-Kachel: Checkbox im Bearbeiten-Modus (oben links), Alias-Kategorien ebenfalls markierbar.
  - Master-Checkbox „Alle auswählen" markiert Produkte **und** Kategorien der aktuellen Ansicht.
  - Auswahlleiste: zusätzlicher roter Knopf „Löschen" (`Trash2`-Icon), ruft neuen Callback `onDeleteSelected(productIds, deptIds, aliasIds, deptAliasIds)`.
- `src/routes/_authenticated/admin.tsx`:
  - Neue Funktion `deleteSelected(...)`: Bestätigungsdialog, dann nacheinander:
    - Aliasse: `product_aliases` / `department_aliases` per ID löschen.
    - Produkte: pro ID `product_headings` (before_product_id), `products`, `catalog_translations` löschen (gleiche Reihenfolge wie `remove`).
    - Kategorien: nur wenn leer (Prüfung auf Unterkategorien und Produkte), sonst überspringen und am Ende per Toast/Meldung auflisten; leere: `product_headings` (department_id), `departments`, `catalog_translations` löschen.
  - Danach Auswahl leeren und Katalog-Queries invalidieren.
- i18n: neue Schlüssel `adm.deleteSelected` („Auswahl löschen"), `adm.deleteSelectedConfirm` („{n} Einträge wirklich löschen?"), `adm.deleteSkippedNotEmpty` („{n} Kategorien nicht gelöscht, da nicht leer: {names}") in `src/i18n/de.ts` und allen 15 Sprachen in `messages.json`.

## Keine Änderungen
- Keine Datenbank-Änderung (bestehende Lösch-Regeln/RLS reichen).
- Einzel-Löschen (Papierkorb pro Zeile) bleibt unverändert.

## Verifikation
- Build/Typecheck.
- Browser-Test im Admin: mehrere Produkte + eine leere Testkategorie markieren → Löschen → Bestätigung → Einträge weg; nicht-leere Kategorie markieren → wird übersprungen mit Hinweis. Testdaten anschliessend bereinigt.
