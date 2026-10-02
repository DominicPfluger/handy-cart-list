# Richtpreise pro Kategorie schätzen (Admin → Preise)

## Ziel
Im Admin-Tab „Preise" kann man eine Kategorie wählen und mit einem Knopfdruck die Richtpreise für **alle Produkte dieser Kategorie auf einmal** per KI schätzen lassen — für den aktuell gewählten Markt.

## Umsetzung

### 1. Neue Server-Funktion `estimateCategoryPrices` (`src/lib/product-media.functions.ts`)
- Eingabe: `market` (2 Zeichen) + `departmentId` (UUID).
- Admin-Prüfung via `assertAdmin` (wie bei `generateReferencePrices`).
- Lädt alle Produkte der Kategorie **inkl. aller Unterkategorien** (rekursiv über `departments.parent_id`).
- Optional: nur Produkte ohne vorhandenen Preis im Markt schätzen (Standard), mit Rückfrage „Alle neu schätzen?" wenn bereits Preise existieren.
- Nutzt die bestehende KI-Funktion `estimatePrices` aus `product-media.server.ts` (gleiche Logik wie `generateReferencePrices`: Preis, Packungsgrösse, Preis pro 100 g/ml).
- Speichert per `upsert` in `product_reference_prices` (onConflict `product_id,market`) — bestehende Preise werden dabei aktualisiert.
- Rückgabe: `{ done, total }` für die Erfolgsmeldung.

### 2. UI im Preise-Tab (`src/components/admin/catalog-media-panel.tsx`)
- Neuer Abschnitt unter dem bestehenden „Richtpreise erzeugen"-Block:
  - **Kategorie-Auswahl** (Dropdown mit allen Kategorien, eingerückt nach Hierarchie — Daten kommen aus dem bereits geladenen Katalog).
  - **Button „Preise für Kategorie schätzen"** (mit gewähltem Markt aus der Länder-Kachel oben).
- Rückfrage vor dem Start: „Preise für die Kategorie ‚X' (n Produkte) im Markt CH schätzen?" — bei bereits vorhandenen Preisen Hinweis, dass fehlende ergänzt werden.
- Fortschritt am Button („Schätze …"), Erfolgsmeldung „n Preise geschätzt".
- Nach Abschluss: Preis-Listen und Zähler aktualisieren (Query-Invalidierung).

### 3. Übersetzungen
- Neue Schlüssel `price.catEstimate*` in `src/i18n/de.ts` und allen 15 Locales von `messages.json`.

## Nicht geändert
- Bestehender Button „Richtpreise erzeugen" (ganzer Katalog, 50 pro Lauf) bleibt.
- Markt-Kacheln, aufklappbare Preis-Listen, Suche und Nachladen bleiben unverändert.
- Keine Datenbankänderung.

## Verifikation
- Build prüfen, dann in der Vorschau: Preise-Tab öffnen, Kategorie wählen, schätzen lassen und prüfen, dass die Preise in der Markt-Liste erscheinen.
