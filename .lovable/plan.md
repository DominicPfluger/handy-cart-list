# Überschriften per Drag & Drop: Auswahl + genaues Einordnen

## 1. Rückfrage beim Verschieben einer Überschrift
Beim Loslassen einer Überschrift (mit Produkten darunter) erscheint ein kleines Fenster statt der bisherigen Ja/Nein-Abfrage:
- **Nur Überschrift** – der Titel wandert an die neue Stelle, die Produkte bleiben, wo sie sind (sie gehören dann zur vorherigen Überschrift).
- **Überschrift mit X Produkten** – ganze Gruppe wandert mit (bisheriges Verhalten).
- **Abbrechen**.
Leere Überschriften werden ohne Rückfrage verschoben.

## 2. Genaues Einordnen zwischen Produkten
- Beim Ziehen einer Überschrift erscheint dieselbe grüne Einfügelinie wie bei Produkten: obere Hälfte eines Produkts = davor, untere Hälfte = danach.
- Die Überschrift (bzw. Gruppe) landet exakt an der Linie – auch beim Verschieben nach unten (heute landet sie dort immer vor dem Zielprodukt, also eine Position daneben).
- Ablegen ganz unten (nach dem letzten Produkt): nur mit Gruppe möglich; „nur Überschrift" ist dort ausgegraut, da kein Produkt folgt.
- Produkt auf eine Überschrift ziehen: Linie unter der Überschrift, Produkt wird erstes Produkt dieser Gruppe – mit korrigierter Index-Berechnung beim Ziehen von oben nach unten.
- Alias-Produkte als Ziel: Die Überschrift wird vor das nächste eigene Produkt gesetzt statt den Drop zu ignorieren.

## Technische Details
- `catalog-tile-editor.tsx`: `onMove` berechnet `overPos` auch für `drag.kind === "heading"`; Linie an Produktzeilen anzeigen. `onUp` übergibt `(headingId, targetProductId, after)`. Produkt→Überschrift: Zielindex = Anker-Index, minus 1 wenn `d.index < t.index`.
- Neuer Dialog (shadcn `Dialog`) im Tile-Editor mit drei Knöpfen; Ergebnis `mode: "title" | "group"` an `onMoveHeading`.
- `admin.tsx` `moveHeading(headingId, targetId, after, mode)`: Anker = Produkt nach der Einfügestelle (bei Alias nächstes eigenes Produkt). `title`: nur `saveHeading` mit neuem Anker. `group`: Gruppe ausschneiden, an Einfügestelle einsetzen, `saveOrder` (global/Markt wie gehabt), Anker = erstes Gruppenprodukt. Konflikt (anderer Titel hat schon diesen Anker) → Toast.
- i18n: `adm.headingMoveTitle`, `adm.headingMoveOnly`, `adm.headingMoveGroup` in `de.ts` + 15 Locales; `adm.headingMoveConfirm` entfällt.
- Prüfung per Playwright: Überschrift nach oben/unten, beide Varianten, Reihenfolge nach Neuladen; Testdaten zurücksetzen.
