# Markt-Auswahl in der Abteilungsansicht

## Ziel
In der Abteilungsansicht (`/abteilungen`) erscheint neben der Suchmaske ein Icon, das eine Auswahl der verfügbaren Märkte öffnet. Der gewählte Markt filtert den Katalog sofort (gleiche Wirkung wie die Markt-Einstellung unter „Mehr").

## Umsetzung

**1. Icon in der Suchleiste** (`src/routes/abteilungen.tsx`, Suchleiste-Block ab Zeile 473)
- Rechts neben dem Sprachausgabe-Button ein Icon-Button (lucide `Store`-Icon) mit dem aktuell gewählten Markt als zugänglichem Label (aria-label, z. B. „Markt wählen: Deutschland").
- Klick öffnet einen Sheet (Bottom-Sheet, mobil gewohnt) bzw. Dialog mit der Marktliste.

**2. Markt-Auswahl-Dialog** (neue Komponente `src/components/market-picker-sheet.tsx`)
- Datenquelle: bestehendes `marketsQuery` aus `src/hooks/use-markets.ts` (Tabelle `markets`, nur `enabled`-Märkte, sortiert nach `sort_order`; Fallback auf die feste MARKETS-Liste wie sonst im Projekt).
- Auswahl: alle aktivierten Märkte als Liste mit Flagge, Name, Währung; der aktuell wirksame Markt ist hervorgehoben.
- Erster Eintrag „Automatisch (aus Sprache)" mit dem effektiven Markt in Klammern — identisch zur Auswahl unter „Mehr".
- Treffen einer Wahl ruft das bestehende `setMarketOverride(code | null)` auf; der Dialog schliesst sich.
- Kein neuer i18n-Schlüssel für die Marktnamen (kommen aus der DB); Titel/„Automatisch"-Label über bestehende bzw. minimal neue Schlüssel (`more.market`, `more.marketAuto` existieren bereits; nur ein neuer Schlüssel für den Dialog-Titel/aria-label, in de.ts + allen 15 Locale-JSONs).

**3. Keine Datenänderung**
- Der gewählte Markt bleibt geräte-lokal gespeichert (`shoppi:market`) und gilt App-weit — die Auswahl unter „Mehr → Markt" zeigt dieselbe Wahl an. Katalogsichtbarkeit, Marken und Referenzpreise reagieren automatisch, weil `useCatalog` reaktiv auf `useMarket` hört.

## Technische Details
- `useMarket()` ist reaktiv (`useSyncExternalStore`), therefore ändert sich die Abteilungsansicht (Sichtbarkeit, Sortierung, Marken) sofort nach der Wahl ohne Reload.
- Die Suche (Suchtreffer mit Markenzeichen) nutzt denselben `market`-Wert und passt sich mit an.
- Der Markt-Button wird beim aktiven Suchtext nicht ausgeblendet — bleibt immer erreichbar.
