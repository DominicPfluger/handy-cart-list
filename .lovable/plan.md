# Preis schätzen im Produkt-Fenster + Tab „Vorlese-Texte"

## Teil 1: Preis schätzen im Produkt-Bearbeiten-Fenster

Im Bearbeiten-Fenster eines Produkts (Admin → Katalog → Stift auf einer Produkt-Kachel) kann der Richtpreis per Knopfdruck von der KI geschätzt werden.

1. **Neue Server-Funktion `estimateProductPrice`** in `src/lib/product-media.functions.ts` (Admin-geschützt wie `estimateCategoryPrices`):
   - Eingabe: `name`, `qty`, `unit`, `market` (kein Produkt-ID nötig — funktioniert auch vor dem ersten Speichern).
   - Ruft die bestehende `estimatePrices`-Funktion aus `product-media.server.ts` mit genau diesem einen Produkt auf.
   - Rückgabe: `{ price, pack_size, pack_unit, unit_price, unit_basis }` — ohne Datenbank-Schreibzugriff.

2. **Button im Bearbeiten-Fenster** (`src/components/admin/catalog-tile-editor.tsx`, ItemSheet):
   - Neben dem Richtpreis-Feld erscheint ein kompakter Button **„✨ Schätzen"** (nur bei Produkten, nicht bei Kategorien).
   - Er schätzt für den aktuell gewählten Markt (dasselbe `currentMarket()` wie das Preis-Feld) und berücksichtigt Name, Menge und Einheit aus dem Formular.
   - Der geschätzte Wert wird **ins Preis-Feld eingetragen, nicht sofort gespeichert** — du kannst ihn prüfen, anpassen und erst mit „Speichern" übernehmen (bestehende Upsert-Logik bleibt).
   - Während des Schätzens zeigt der Button einen Ladezustand; bei Fehlern erscheint die Fehlermeldung wie bei den anderen Aktionen.
   - Voraussetzung: Ein Name muss eingetragen sein (sonst Hinweis).

3. **Übersetzungen**: Neue Schlüssel `tile.estimatePrice` („Schätzen") und `tile.priceNameRequired` („Bitte zuerst einen Namen eingeben") in `src/i18n/de.ts` und allen 15 Locales in `messages.json`.

## Teil 2: Vorlese-Texte als eigener Tab

- Neuer Tab **„Vorlese-Texte"** ganz am Ende der Admin-Navigation (nach „Mehr") in `src/routes/_authenticated/admin.tsx`.
- Der Tab öffnet die bestehende Seite `/vorlese-texte` (gleiche Zielseite wie der bisherige Link).
- Der bisherige Link „Vorlese-Texte" im Tab „Mehr" wird entfernt, damit es ihn nicht doppelt gibt.
- Neuer i18n-Schlüssel `adm.tab.speech` („Vorlese-Texte") in allen 16 Sprachen.

## Nicht geändert

- Speichern-Logik und bestehende Preis-Schätzung im Tab „Preise" bleiben unberührt.
- Die Seite `/vorlese-texte` selbst bleibt unverändert.
- Keine Datenbankänderung.

## Verifikation

Build prüfen, dann in der Vorschau: Produkt öffnen → „✨ Schätzen" → Preis erscheint im Feld → Speichern. Tab „Vorlese-Texte" öffnen → Seite lädt.
