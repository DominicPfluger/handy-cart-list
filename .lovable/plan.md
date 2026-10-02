# Rezept-Generator vereinfachen

## Ergebnis
- Pro Rezeptvorlage erscheinen Zutaten-Ebenen wie „Flüssigkeit“ und „Früchte“ als einzige aufklappbare Ebene. Darunter stehen direkt die zugeordneten Produkte; zusätzliche Untergruppen entfallen.
- Produkte werden je Zutaten-Ebene im Admin-Bereich bewusst manuell hinzugefügt oder entfernt. Bereits zugeordnete Produkte bleiben erhalten. Ohne Zuordnung erscheint eine leere Ebene statt einer automatisch eingesetzten Standardliste.
- Das grüne Häkchen am Ebenentitel wird durch ein passendes Emoji ersetzt. Auswahl und Fortschritt bleiben über die gewählten Produkte und die bestehende Fortschrittsanzeige erkennbar.

## Technische Umsetzung
- Die vorhandenen Emojis der Zutaten-Ebenen aus der Admin-Verwaltung bis zur Generator-Ansicht durchreichen; für ältere Ebenen ohne Emoji passende Standard-Emojis vorsehen.
- Die zusätzliche Gruppierung innerhalb der Ebene im Generator entfernen und die Produkte direkt anzeigen. Die Admin-Zuordnung pro Ebene beibehalten, aber die nicht mehr benötigte Untergruppen-Verwaltung in diesem Rezeptbereich ausblenden; bestehende Gruppendaten nicht löschen.
- Den eingebauten Zutaten-Fallback bei datenbankverwalteten Vorlagen unterbinden, damit nur manuell zugewiesene Produkte erscheinen. Auswahlregeln, Suche, Filter, Speichern und Listenübernahme unverändert lassen.
- Die Darstellung auf Mobilgerät und Desktop sowie eine manuelle Produktzuordnung und anschliessende Auswahl im Generator prüfen, ohne KI-Aufrufe auszulösen.
