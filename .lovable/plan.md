# Kategorie-Dropdown beim Produkt hinzufügen (Admin)

## Was sich ändert
Beide Produkt-Anlage-Formulare im Admin-Katalog bekommen ein Dropdown „Kategorie", in dem die Zielkategorie frei gewählt werden kann. Bisher landen neue Produkte immer in der gerade geöffneten Kategorie.

Das Dropdown listet alle Kategorien mit vollständigem Pfad auf (z. B. „Frischmarkt › Gemüse › Fruchtgemüse"), alphabetisch sortiert. Vorausgewählt ist die aktuell geöffnete Kategorie — es ändert sich also nichts, wenn man das Dropdown nicht anfasst.

## 1. Dialog „+ Neues Produkt" (catalog-tile-editor.tsx, ItemSheet)
- Neues Select über dem Namensfeld (nur im Anlage-Modus eines Produkts, nicht beim Bearbeiten und nicht bei Kategorien).
- Optionen: alle Kategorien aus `depts` mit Pfad-Label (über `parent_id` hochlaufen), alphabetisch sortiert.
- Speichern: Insert mit `department_id` der gewählten Kategorie statt `p.cur`. `sort_order` = Anzahl Produkte der gewählten Kategorie + 1 (bei fremder Kategorie per Datenbank-Abfrage des höchsten `sort_order` + 1, sonst wie bisher `p.products.length + 1`).

## 2. Formular „+ Mehrere Produkte" (admin.tsx, BulkAddForm)
- Neues Select „Kategorie" mit denselben Pfad-Optionen; Auswahl wird an `handleBulkSubmit` als Kategorie-ID übergeben.
- Bisher: alle Zeilen von `handleBulkSubmit` nutzen `cur` und die Positions-/Verschiebe-Logik der geöffneten Kategorie.
- Neu:
  - Gewählte Kategorie = geöffnete Kategorie → Verhalten genau wie bisher (Positionsauswahl mit Überschriften, Produkte nach hinten schieben).
  - Andere Kategorie gewählt → Einfügeposition „Am Ende" (höchster `sort_order` + 1 in der gewählten Kategorie, per Abfrage); die Positions-Auswahl mit Überschriften wird ausgeblendet, da Überschriften kategoriebezogen sind. Markt-Beschränkung, Emoji, Menge/Einheit, Übersetzen und KI-Bilder funktionieren unverändert für die gewählte Kategorie.

## Neue Übersetzung
Ein Schlüssel `adm.category` = „Kategorie" in `src/i18n/de.ts` und allen 15 Sprachen in `messages.json` (z. B. en „Category", fr „Catégorie", it „Categoria").

## Keine Datenbank-Änderung
Nur Frontend-Anpassungen in `src/components/admin/catalog-tile-editor.tsx` und `src/routes/_authenticated/admin.tsx`.

## Verifikation
Build prüfen; im Browser: über „+ Neues Produkt" ein Testprodukt in einer anderen Kategorie anlegen (erscheint dort am Ende) und über „+ Mehrere Produkte" Produkte in der aktuellen Kategorie wie gewohnt anlegen; danach Testprodukte wieder löschen.
