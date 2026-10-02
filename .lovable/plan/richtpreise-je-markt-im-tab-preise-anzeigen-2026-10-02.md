# Richtpreise je Markt im Tab „Preise" anzeigen

## Was du siehst
- Unter den Länder-Kacheln im Tab „Preise" erscheint neu ein Abschnitt „Richtpreise", mit je einer aufklappbaren Zeile pro Land: Flagge, Kürzel und Anzahl der Preise, rechts ein Pfeil ▼.
- Die Preise werden erst geladen, wenn du ein Land aufklappst. Zugeklappt wird nichts geladen.
- Beim Aufklappen kommen die ersten 30 Preise: Produktname, Preis, Packungsgrösse, Preis pro 100 g, 100 ml, kg oder l und das Datum.
- Scrollst du ans Ende der Liste, lädt die App automatisch die nächsten 30. Zusätzlich gibt es einen Knopf „Mehr laden".
- Ein Suchfeld im aufgeklappten Land filtert nach Produktname, ebenfalls Stück für Stück geladen.
- Hat ein Land keine Preise, steht dort „Noch keine Richtpreise".

## Technische Details
- Neue Serverfunktion `listReferencePrices` in `src/lib/product-media.functions.ts`: Prüft, ob du Admin bist. Nimmt `market`, `q`, `offset` und `limit` (Standard 30) entgegen. Liest `product_reference_prices` mit Join auf `products(name)`, sortiert nach Name und nutzt `.range()`. Rückgabe sind die Einträge und `hasMore`.
- In `catalog-media-panel.tsx` (Abschnitt `prices`): neue Komponente `MarketPriceList` pro Markt, die `useInfiniteQuery` nutzt. Sie startet erst bei geöffnetem Land (`enabled: open`). Ein IntersectionObserver-Platzhalter am Listenende ruft `fetchNextPage` auf.
- Die Zahlen auf den Zeilen kommen aus dem bestehenden `catalogMediaStatus.markets`. Es gibt keine zusätzliche Abfrage.
- Preise werden mit dem vorhandenen `formatRefPrice` dargestellt.
- Neue Übersetzungs-Schlüssel `price.list*` in de.ts und allen Locales von messages.json.
- Es gibt keine Änderung an der Datenbank.
