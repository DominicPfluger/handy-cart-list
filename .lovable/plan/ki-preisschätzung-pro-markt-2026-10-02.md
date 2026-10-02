# KI-Preisschätzung pro Markt

## Ziel
In der aufklappbaren Liste „Preise je Markt" (Admin-Dialog „Produkt bearbeiten") bekommt jeder Markt einen eigenen KI-Schätz-Knopf. So lässt sich gezielt ein einzelner Markt schätzen, statt immer alle Märkte auf einmal — das spart Credits.

## Umsetzung

1. **Neuer Server-Aufruf für einen Markt**
   - Neue Funktion `estimateProductPrice` (ein Produkt, ein Markt), die die bestehende KI-Schätzung (`estimatePrices`) für genau diesen Markt aufruft.
   - Gibt Preis, Währung und Mengen-Angabe zurück, ohne etwas zu speichern.

2. **Knopf pro Markt-Zeile**
   - In jeder Zeile der Liste „Preise je Markt" erscheint rechts neben dem Zahlenfeld ein kleiner ✨-Knopf.
   - Klick: KI schätzt nur diesen Markt, der Wert erscheint im Feld (noch nicht gespeichert).
   - Während der Schätzung ist der Knopf gesperrt und zeigt einen Ladezustand; Fehler werden als Hinweis angezeigt.
   - Beim aktuell gewählten Markt bleibt das Feld weiterhin mit dem Preisfeld oben synchron.

3. **Speichern bleibt wie bisher**
   - Übernommen wird der geschätzte Wert erst mit „Speichern" — zusammen mit allen manuell eingetragenen Preisen.
   - Der Knopf „✨ Alle schätzen" bleibt unverändert erhalten.

4. **Beschriftungen**
   - Tooltip/Beschriftung des Knopfs in Deutsch und allen 15 App-Sprachen.

## Nicht Teil davon
- Keine automatische Schätzung beim Öffnen des Dialogs (Credits sparen).
- Keine Änderung an der Datenbank oder an „✨ Alle schätzen".

## Technische Details
- `src/lib/product-media.functions.ts`: neue `createServerFn` `estimateProductPrice` (Input: productId, market), nutzt `estimatePrices` aus `product-media.server.ts`.
- `src/components/admin/catalog-tile-editor.tsx`: ✨-Knopf je Markt-Zeile im `mpOpen`-Block, State für laufende Schätzung pro Markt, Ergebnis in `mp[market]` schreiben (beim aktuellen Markt auch ins Preisfeld).
- i18n: neuer Schlüssel in `de.ts` + `messages.json` (15 Lokale).
- Prüfung: `bunx tsgo --noEmit`, danach Browser-Test im Admin-Dialog.
