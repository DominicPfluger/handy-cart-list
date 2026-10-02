# Produkte zwischen Überschriften zuverlässig verschieben

## Ursachen (im Code gefunden)
Eine Überschrift "hängt" technisch immer am ersten Produkt ihrer Gruppe. Daraus entstehen drei Fehler:
1. **Erstes Produkt einer Gruppe wegziehen:** Die Überschrift wandert mit dem Produkt mit und landet an der neuen Stelle – die restlichen Produkte rutschen unter die vorherige Überschrift.
2. **Ablegen auf der oberen Hälfte des ersten Produkts einer Gruppe:** Die grüne Linie erscheint unter der Überschrift, das Produkt landet aber über der Überschrift (in der vorherigen Gruppe).
3. **Produkt auf eine Überschrift ziehen:** Reihenfolge und Überschriften-Zuordnung werden in zwei getrennten, gleichzeitigen Schritten gespeichert; beim Ziehen nach unten landet das Produkt eine Stelle daneben.

## Neues Verhalten
- Die grüne Linie zeigt genau, wo das Produkt landet – inklusive unter welcher Überschrift.
- Linie unter einer Überschrift oder über dem ersten Produkt einer Gruppe = Produkt wird **erstes Produkt dieser Gruppe**.
- Linie unter dem letzten Produkt einer Gruppe = **letztes Produkt dieser Gruppe** (nicht in der nächsten).
- Wird das erste Produkt einer Gruppe weggezogen, bleibt die Überschrift an ihrer Stelle und das nächste Produkt wird erstes der Gruppe. Bleibt die Gruppe leer, steht die Überschrift vor dem nächsten Produkt (bzw. Hinweis, falls keins folgt).
- Funktioniert gleich nach oben und nach unten, global und bei gewähltem Markt, auch mit Alias-Produkten.

## Technische Details
- `catalog-tile-editor.tsx` `onUp` für Produkte: Ziel als `{ insertAt, headingId | null }` berechnen (Index in der Liste ohne das gezogene Produkt). Überschrift-Ziel oder obere Hälfte eines Anker-Produkts → Gruppe dieser Überschrift, Position = Gruppenanfang. Ein neuer Callback `onMoveProduct(productId, insertAt, headingId)` ersetzt `reorder` + `onSetHeadingAnchor` für diesen Fall.
- `admin.tsx` neue Funktion `moveProduct`: vor dem Verschieben je Überschrift die Gruppe (Produkt-Ids) ermitteln; Produkt entfernen und einfügen; danach jede Überschrift auf das erste eigene (nicht-Alias) Produkt ihrer Gruppe neu ankern, Ziel-Überschrift ggf. auf das verschobene Produkt. Nur geänderte Anker speichern, nacheinander nach `saveOrder`; optimistische Anzeige wie bisher.
- Einfügelinie bei Anker-Produkt obere Hälfte unter der Überschrift anzeigen (entspricht neuem Ergebnis).
- Keine Datenbank- oder Übersetzungsänderung.

## Prüfung
Playwright in einer Testkategorie mit zwei Überschriften: erstes Produkt einer Gruppe wegziehen, Produkt auf Überschrift, auf Gruppenanfang/-ende, nach oben und unten; Reihenfolge und Gruppen nach Neuladen kontrollieren; Testdaten zurücksetzen.
