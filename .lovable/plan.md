# Kleines Produktbild und Standardmenge je Einheit

## Ziel
Im Admin-Dialog „Produkt bearbeiten“ steht unter „Vorschaubild (gross)“ wieder der Bereich „Bild (klein)“. Er ist standardmässig zugeklappt und bleibt auch sichtbar, wenn noch kein eigenes kleines Bild vorhanden ist.

Bei den Standard-Einheiten erhält jede ausgewählte Mengeneinheit ihre eigene Standardmenge, zum Beispiel „1 Tube“ und „1 Glas“. Die Reihenfolge der Einheiten bleibt produktbezogen und bestimmt, welche Einheiten beim Hinzufügen zuerst erscheinen.

## Umsetzung
1. **Kleines Bild wieder anzeigen**
   - Den zugeklappten Bereich direkt unter dem grossen Vorschaubild in beiden Admin-Produktdialogen anzeigen.
   - Bei fehlendem kleinen Bild das Produktsymbol als Platzhalter zeigen, statt den gesamten Bereich auszublenden.
   - Vorhandene Upload- und KI-Bildaktionen beim Aufklappen unverändert verfügbar lassen.

2. **Standard-Einheiten als sortierte Zeilen darstellen**
   - Die bisherige reine Mehrfachauswahl durch eine kompakte Liste der gewählten Einheiten ersetzen.
   - Jede Zeile enthält die Mengeneinheit und ein Zahlenfeld für deren Standardmenge.
   - Einheiten lassen sich hinzufügen, entfernen und produktbezogen sortieren; die erste Zeile ist die primäre Standard-Einheit.
   - Ungültige oder leere Mengen werden vor dem Speichern abgefangen.

3. **Standardmengen speichern und verwenden**
   - Pro Produkt zusätzlich die Standardmenge je gewählter Einheit speichern; bestehende Produkte übernehmen ihre bisherige Standardmenge für die primäre Einheit.
   - Die vorhandenen Hauptfelder für Standardmenge und Standard-Einheit bleiben für bestehende Abläufe kompatibel und werden aus der ersten Zeile abgeleitet.
   - Im Dialog „Zur Einkaufsliste hinzufügen“ erscheinen die produktbezogenen Einheiten zuerst. Beim Wechsel der Einheit wird automatisch deren hinterlegte Standardmenge eingesetzt; eine danach manuell geänderte Menge wird nicht unerwartet überschrieben.
   - Alle übrigen Mengeneinheiten bleiben danach weiterhin auswählbar.

4. **Prüfung**
   - Produkt mit und ohne kleines Bild in Listen- und Kachelansicht öffnen und die zugeklappte Reihenfolge prüfen.
   - Für ein Produkt wie Senf mehrere Einheiten mit unterschiedlichen Mengen anlegen, sortieren, speichern und erneut öffnen.
   - Das Produkt zur Einkaufsliste hinzufügen und prüfen, dass Tube/Glas in der gespeicherten Reihenfolge erscheinen und jeweils die richtige Standardmenge einsetzen.
   - Darstellung auf schmalen und breiten Bildschirmen sowie bestehende Produkte ohne neue Mengenwerte prüfen.

## Technische Hinweise
- Die Produktdaten erhalten eine Zuordnung „Einheit → Standardmenge“; `default_unit` und `default_quantity` bleiben als kompatible Hauptwerte erhalten, `allowed_units` speichert weiterhin die Reihenfolge der zusätzlichen Einheiten.
- Katalog-Laden, Offline-Katalog und Produkttypen werden um diese Zuordnung ergänzt.
- Betroffen sind die beiden Admin-Produktdialoge, die Einheiten-Auswahl und der bestehende Hinzufügen-Dialog. Andere Mengenlogik, Varianten und Bilderzeugung bleiben unverändert.
- Neue und geänderte Beschriftungen werden in allen vorhandenen App-Sprachen ergänzt.
