# Richtpreise je Markt manuell im Produkt-Dialog

## Ziel
Im Admin-Dialog „Produkt bearbeiten“ lassen sich die Richtpreise für jeden aktiven Markt selbst eintragen, ohne KI. Die KI-Schätzung bleibt als freiwilliger Knopf erhalten.

## Bedienung
- Unter dem bisherigen Preisfeld erscheint eine aufklappbare Liste „Preise je Markt“.
- Je aktivem Markt eine Zeile: Flagge, Marktname, Währung, Zahlenfeld mit dem gespeicherten Preis (leer, wenn keiner da ist).
- Beim Öffnen werden die vorhandenen Preise geladen (nur Datenbank, keine Credits).
- Speichern übernimmt alle geänderten Felder; ein geleertes Feld entfernt den Preis dieses Marktes.
- Das Preisfeld des aktuellen Marktes oben bleibt mit der Zeile in der Liste synchron.
- „✨ Alle schätzen“ füllt die Felder nur vor; gespeichert wird wie bisher bzw. beim Speichern.
- Beschriftungen in Deutsch und allen 15 App-Sprachen.

## Nicht Teil
Keine Datenbank-Änderung, keine automatische KI beim Öffnen, keine Änderung an Mehrfachanlage oder Preise-Tab.

## Technische Details
- `catalog-tile-editor.tsx` ItemSheet: State `marketPrices: Record<market, string>`, beim Öffnen `product_reference_prices` für das Produkt laden; Marktliste aus `markets` (enabled, sort_order), Währung aus `markets.currency`.
- Save: geänderte Einträge per `upsert` (onConflict product_id,market, observed_at now), geleerte per `delete`; danach Preis-Query invalidieren.
- Bestehendes Einzelfeld für `currentMarket()` auf denselben State abbilden.
- i18n-Schlüssel `tile.marketPrices`, `tile.marketPricesHint`.
