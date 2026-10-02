# Rezept-Generator vereinfachen

## Ergebnis
- Pro Rezeptvorlage erscheinen Zutaten-Ebenen wie „Flüssigkeit“ und „Früchte“ als einzige aufklappbare Ebene. Vorhandene Untergruppen bleiben erhalten, werden innerhalb der geöffneten Ebene aber inline mit ihrer Überschrift und den Produkten direkt darunter angezeigt — ohne weiteres Aufklappen.
- Pro Zutaten-Ebene zunächst höchstens zehn Produkte anzeigen, auch wenn sie auf mehrere Untergruppen verteilt sind. „Weitere anzeigen“ blendet die folgenden Produkte ein; gewählte Zutaten bleiben beim Zuklappen der zusätzlichen Produkte sichtbar.
- Produkte werden je Zutaten-Ebene im Admin-Bereich bewusst manuell hinzugefügt oder entfernt. Bereits zugeordnete Produkte bleiben erhalten. Ohne Zuordnung erscheint eine leere Ebene statt einer automatisch eingesetzten Standardliste.
- Das grüne Häkchen am Ebenentitel wird durch ein passendes Emoji ersetzt. Auswahl und Fortschritt bleiben über die gewählten Produkte und die bestehende Fortschrittsanzeige erkennbar.

## Technische Umsetzung
- Die vorhandenen Emojis der Zutaten-Ebenen aus der Admin-Verwaltung bis zur Generator-Ansicht durchreichen; für ältere Ebenen ohne Emoji passende Standard-Emojis vorsehen.
- Die zusätzliche Aufklappfunktion der Untergruppen im Generator entfernen; Untergruppen und ungruppierte Produkte direkt innerhalb der Ebene anzeigen. Die manuelle Admin-Zuordnung pro Ebene und die Untergruppen-Verwaltung beibehalten.
- Die bestehende Produkt-Paginierung auf zehn sichtbare Produkte pro Zutaten-Ebene umstellen und die Anzeige beim Wechsel der Rezeptvorlage passend zurücksetzen.
- Den eingebauten Zutaten-Fallback bei datenbankverwalteten Vorlagen unterbinden, damit nur manuell zugewiesene Produkte erscheinen. Auswahlregeln, Suche, Filter, Speichern und Listenübernahme unverändert lassen.
- Die Darstellung auf Mobilgerät und Desktop sowie eine manuelle Produktzuordnung und anschliessende Auswahl im Generator prüfen, ohne KI-Aufrufe auszulösen.
