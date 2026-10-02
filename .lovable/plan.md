# Preis schätzen im Produkt-Bearbeiten-Fenster

Im Bearbeiten-Fenster eines Produkts (Admin → Katalog → Stift auf einer Produkt-Kachel) kann der Richtpreis per Knopfdruck von der KI geschätzt werden.

## Umsetzung

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

## Nicht geändert

- Speichern-Logik und bestehende Preis-Schätzung im Tab „Preise" (einzeln/pro Kategorie) bleiben unberührt.
- Keine Datenbankänderung.

## Verifikation

Build prüfen, dann in der Vorschau: Produkt öffnen → „✨ Schätzen" → Preis erscheint im Feld → Speichern → Preis ist in der Datenbank.
