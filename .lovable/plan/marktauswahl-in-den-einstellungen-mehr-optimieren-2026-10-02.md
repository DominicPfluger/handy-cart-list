# Marktauswahl in den Einstellungen (Mehr) optimieren

## Ziel
Der Markt (Land) wird heute immer automatisch aus der App-Sprache abgeleitet (z. B. Deutsch-Schweiz → CH) und lässt sich nicht manuell festlegen. Künftig kann unter „Mehr" ein Markt voreingestellt werden, der dann überall in der App gilt.

## Umsetzung
1. **Neue Einstellung „Markt" unter „Mehr"**: Eine aufklappbare Auswahl (im Stil der bestehenden Icon-Set- und Ernährungsform-Zeilen) mit allen aktiven Märkten aus der Markt-Liste (Flagge, Name, Währung). Erste Option: „Automatisch (aus Sprache)" — das ist der bisherige Standard.
2. **Gerätelokale Speicherung**: Die Wahl wird auf diesem Gerät gespeichert (Schlüssel `shoppi:market`), wie die übrigen persönlichen Einstellungen.
3. **`currentMarket()` erweitern** (`src/hooks/use-reference-prices.ts`): Gibt den voreingestellten Markt zurück, falls gesetzt, sonst wie bisher den aus der Sprache abgeleiteten. Damit gilt die Voreinstellung automatisch für:
   - Richtpreise und die Preissumme in der Einkaufsliste,
   - Währungsanzeige,
   - Markt-bezogene Ansichten im Admin-Panel.
4. **Reaktivität**: Beim Wechsel des Marktes werden die Preis-Abfragen sofort neu geladen (Hook reagiert auf die Einstellung, nicht nur auf die Sprache).
5. **Übersetzungen**: Beschriftungen (`more.market`, `more.marketAuto` o. ä.) in `src/i18n/de.ts` und `src/i18n/messages.json` für alle vorhandenen Sprachen ergänzen.

## Technische Details
- `src/hooks/use-reference-prices.ts`: `currentMarket()` liest `localStorage["shoppi:market"]` (2-Buchstaben-Code) vor dem Locale-Fallback; neuer Hook `useMarket()` mit `useSyncExternalStore` (Muster wie `use-all-markets.ts`), damit `useReferencePrices` auf Änderungen reagiert.
- `src/routes/mehr.tsx`: neue `MarketRow`-Komponente, nutzt `useMarkets`/`marketsQuery` für die aktiven Märkte; Platzierung nahe der bestehenden „Alle Märkte"-Zeile.
- Keine Schema- oder Backend-Änderung nötig.
- Verifikation: Typecheck/Build; im Browser (Smartphone + Desktop) Markt wechseln und prüfen, dass Währung/Richtpreise in der Listenansicht umschalten und die Wahl nach Neuladen erhalten bleibt.
