# Laden-Auswahl neben der Suche in der Abteilungsansicht

## Ziel
Das Laden-Symbol neben der Suchmaske in der Abteilungsansicht soll nicht mehr die Markt-Auswahl (Länder) öffnen, sondern eine Auswahl der **Läden** des aktuell gewählten Marktes — so wie sie in den Einstellungen unter „Abteilungen ordnen & umbenennen" für den gewählten, lokalisierten Markt festgelegt sind.

## Aktueller Stand (geprüft)
- `src/routes/abteilungen.tsx`: Store-Icon (Zeile ~496) öffnet `MarketPickerSheet` (Markt-/Länder-Wahl).
- `src/components/market-picker-sheet.tsx`: listet Märkte (Länder) + „Automatisch".
- `src/hooks/use-stores.ts`: `useStores()` liefert genau die gewünschte Liste — „Standard" + Läden des gewählten Marktes (Tabelle `supermarkets`, gefiltert nach `market_code` des aktiven Marktes) + eigene Läden.
- `src/hooks/use-group-order.ts`: `useGroupOrder().store` (aktiver Laden, `shoppi:active-store`) und `setStore(id)` zum Umschalten; Änderungen synchronisieren sich app-weit über das Event `shoppi:list-group-order-changed`.

## Umsetzung
1. **Neue Komponente `src/components/store-picker-sheet.tsx`** (analog zum MarketPickerSheet, gleiches Bottom-Sheet-Design):
   - Datenquelle: `useStores()` (Läden des gewählten Marktes + eigene Läden + „Standard").
   - Markiert den aktuell aktiven Laden (`useGroupOrder().store`) mit Häkchen.
   - Tippen auf einen Laden: `setStore(id)` und Sheet schliessen.
   - Titel: bestehender Text „Laden" (lm.store), kein neuer Übersetzungsschlüssel nötig.
2. **`src/routes/abteilungen.tsx`**: Store-Icon öffnet künftig `StorePickerSheet` statt `MarketPickerSheet` (Import und State-Namen entsprechend umbenennen).
3. **Wirkung**: Die Wahl gilt sofort und app-weit — Abteilungs-Reihenfolge, pro-Laden-Umbenennungen und ausgeblendete Abteilungen folgen dem gewählten Laden (bestehende Logik über `shoppi:active-store`).
4. Die Markt-/Länder-Wahl bleibt unverändert unter „Mehr → Markt" erreichbar.

## Technische Details
- Keine Datenbank-Änderungen, keine neuen i18n-Schlüssel (lm.store / store.default existieren).
- Reine Frontend-Änderung: 1 neue Datei, 1 angepasste Route.
- `MarketPickerSheet` bleibt bestehen (wird ggf. anderweitig genutzt), wird aber in der Abteilungsansicht nicht mehr verwendet.

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`).
- Browser-Test: Abteilungsansicht → Laden-Symbol → Sheet zeigt Läden des Marktes; Wahl eines Ladens ändert sofort die Abteilungs-Reihenfolge gemäss den Einstellungen.
