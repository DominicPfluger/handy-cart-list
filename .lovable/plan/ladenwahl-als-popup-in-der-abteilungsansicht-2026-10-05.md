# Ladenwahl als Popup in der Abteilungsansicht

## Ziel
In der Abteilungsansicht öffnet das Laden-Symbol neben der Suchmaske nicht mehr ein Bottom-Sheet, sondern ein Popup direkt unterhalb des Symbols: Die verfügbaren Läden erscheinen als aufklappende Karte im Seitenfluss, die Abteilungen werden dabei nach unten geschoben (kein Overlay mehr).

## Umsetzung

**1. Neue Komponente `src/components/store-picker-inline.tsx`**
- Props: `open: boolean`, `onPick: (id: string) => void`.
- Nutzt `useStores()` und `useGroupOrder()` (store, setStore) wie bisher.
- Rendert eine Karte im Stil der App: `rounded-2xl border border-border bg-card shadow-sm`, kompakte Zeilen mit Emoji, Name, Häkchen beim aktiven Laden (gleiche Optik wie das bisherige Sheet, aber inline).
- Aufklapp-Animation: sanftes Höhen-/Opacity-Übergang beim Öffnen und Schliessen.

**2. Änderung in `src/routes/abteilungen.tsx`**
- Die Karte wird direkt unterhalb der Suchmaske (die das Laden-Symbol rechts enthält) in den Seitenfluss eingefügt — nur wenn `storeOpen` true ist. Die nachfolgende Abteilungsliste rückt dadurch automatisch nach unten.
- Klick auf das Store-Icon toggelt `storeOpen` (statt `setStore(true)`).
- Wahl eines Ladens: `setStore(id)` via `useGroupOrder`, danach `setStoreOpen(false)` — das Popup schliesst sich, die Abteilungen rutschen wieder hoch.
- Schliessen ohne Wahl: erneuter Klick auf das Icon oder Klick ausserhalb (dismiss beim Scrollen/Klick in den Seiteninhalt).
- `StorePickerSheet`-Import und -Nutzung entfernen; das Bottom-Sheet bleibt für andere Stellen unangetastet.

**3. Übersetzungen**
- Keine neuen Texte nötig — `store.label` existiert bereits in allen 16 Sprachen.

## Verifizierung
- Typprüfung (`bunx tsgo --noEmit`) und Build fehlerfrei.
- Browser-Check (Playwright): Icon tippen → Popup erscheint unter der Suchmaske, Abteilungen sind nach unten verschoben; Laden wählen → Popup schliesst, aktiver Laden markiert, `shoppi:active-store` gesetzt.
