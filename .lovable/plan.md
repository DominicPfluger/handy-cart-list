# Produkte per Drag & Drop genau zwischen zwei Einträge verschieben

## Ziel
Im Admin-Katalog (Kachel-/Bearbeitungsansicht einer Kategorie) soll ein gezogenes Produkt exakt zwischen zwei Produkten abgelegt werden können. Während des Ziehens zeigt eine grüne Einfügelinie, wo das Produkt landet.

## Verhalten
- Beim Ziehen über ein Produkt: obere Hälfte -> Linie **über** dem Produkt, untere Hälfte -> Linie **darunter** (statt die ganze Zeile einzufärben).
- Loslassen setzt das Produkt genau an der Linie ein – nach oben wie nach unten korrekt (heute landet es beim Verschieben nach unten teils eine Position daneben).
- Ziehen über eine Überschrift: Linie direkt unter der Überschrift, Produkt wird erstes Produkt dieser Gruppe.
- Ablegen auf Kategorien / Pfadnavigation (in andere Kategorie verschieben) bleibt unverändert.
- Gilt wie bisher global oder – bei gewähltem Markt – nur für diesen Markt.

## Technische Details
Nur `src/components/admin/catalog-tile-editor.tsx`:
- `over` um Position erweitern (`before`/`after`), in `onMove` aus der Zeilenmitte berechnen.
- Produktzeile: statt `bg-primary-soft` eine 2px-Linie (`before:`/`after:`-Pseudo-Element bzw. absolut positionierter Balken in `bg-primary`) oben oder unten.
- `onUp`: Zielindex = `t.index + (after ? 1 : 0)`, minus 1 wenn `d.index < Ziel` (Entfernen verschiebt die Indizes); No-Op wenn Position gleich bleibt. Produkt auf Überschrift -> Index des Anker-Produkts der Überschrift.
- Kategorie-Kacheln behalten ihr bisheriges Verhalten (gleiche Index-Korrektur wird mit angewendet).
- Keine Datenbank- oder Übersetzungsänderung.

## Prüfung
Build prüfen, dann in der Vorschau in „Frische Kräuter" ein Produkt zwischen zwei andere ziehen (nach oben und nach unten), Reihenfolge nach Neuladen kontrollieren und Testkategorie zurücksetzen.
