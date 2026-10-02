# Preis schätzen im Produkt-Fenster (alle Märkte) + Tab „Vorlese-Texte"

## Teil 1: Preis schätzen für alle Märkte im Produkt-Bearbeiten-Fenster

Im Bearbeiten-Fenster eines Produkts (Admin → Katalog → Stift auf einer Produkt-Kachel) schätzt ein Knopfdruck den Richtpreis für **alle eingerichteten Märkte gleichzeitig** (alle aktiven Länder aus „Märkte verwalten").

1. **Neue Server-Funktion `estimateProductPricesAllMarkets`** in `src/lib/product-media.functions.ts` (Admin-geschützt):
   - Eingabe: `productId`.
   - Lädt das Produkt (Name, Menge, Einheit) und alle aktiven Märkte.
   - Schätzt pro Markt parallel über die bestehende `estimatePrices`-Funktion und speichert alle Ergebnisse in den Richtpreisen (bestehende Preise werden überschrieben).
   - Rückgabe: Liste `{ market, price, currency, unit_price, unit_basis }` plus Anzahl Fehler.

2. **Button im Bearbeiten-Fenster** (`src/components/admin/catalog-tile-editor.tsx`):
   - Neben dem Richtpreis-Feld: **„✨ Preise für alle Märkte schätzen"** (nur bei bereits gespeicherten Produkten).
   - Rückfrage vor dem Start (verbraucht KI-Guthaben, überschreibt vorhandene Preise).
   - Nach Abschluss erscheint im Fenster eine kompakte Liste mit Flagge, Markt und Preis (z. B. „🇨🇭 CH · CHF 2.40 · CHF 0.48/100 g"); das Preis-Feld zeigt den Wert des aktuell gewählten Markts.
   - Ladezustand während der Schätzung; Fehler einzelner Märkte werden gemeldet, erfolgreiche bleiben gespeichert.
   - Preis-Anzeigen in der App werden danach aktualisiert.

3. **Übersetzungen**: Neue Schlüssel `tile.estimateAll`, `tile.estimateAllConfirm`, `tile.estimateAllDone` in `src/i18n/de.ts` und allen 15 Locales in `messages.json`.

## Teil 2: Vorlese-Texte als eigener Tab

- Neuer Tab **„Vorlese-Texte"** ganz am Ende der Admin-Navigation (nach „Mehr") in `src/routes/_authenticated/admin.tsx`.
- Der Tab öffnet die bestehende Seite `/vorlese-texte`.
- Der bisherige Link „Vorlese-Texte" im Tab „Mehr" wird entfernt.
- Neuer i18n-Schlüssel `adm.tab.speech` („Vorlese-Texte") in allen 16 Sprachen.

## Nicht geändert

- Manuelle Preis-Eingabe + Speichern sowie die Schätzungen im Tab „Preise" bleiben.
- Die Seite `/vorlese-texte` selbst bleibt unverändert.
- Keine Datenbankänderung.

## Verifikation

Build prüfen, dann in der Vorschau: Produkt öffnen → „✨ Preise für alle Märkte schätzen" → Liste mit allen Märkten erscheint, Preise in der Datenbank. Tab „Vorlese-Texte" → Seite lädt.
