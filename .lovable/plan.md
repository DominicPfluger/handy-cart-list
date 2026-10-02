# Produktbild im Admin-Dialog löschen oder neu generieren

## Ergebnis
Im Dialog **Produkt bearbeiten** gibt es direkt beim Bild zwei eindeutige Aktionen: **Bild entfernen** und **Bild neu generieren**. Nach jeder Aktion ist das Ergebnis sofort in der Vorschau und im Katalog sichtbar; das Produkt selbst bleibt erhalten.

## Umsetzung
1. **Bild entfernen:** Nur das Produktbild und sein kleines Listen-Icon vom Produkt lösen, nicht den Produkteintrag löschen. Vorher bestätigen lassen; falls eine Bilddatei auch anderswo verwendet wird, diese nicht mitlöschen.
2. **Neu generieren:** Die vorhandene KI-Bilderzeugung für genau dieses Produkt nutzen, auch wenn bereits ein Bild vorhanden ist. Das kleine Listen-Icon passend zum neuen Bild erneut erstellen. Währenddessen die Aktion sperren und Erfolg oder Fehler anzeigen.
3. Die Bildvorschau und Katalogdaten nach beiden Aktionen aktualisieren, damit keine alte zwischengespeicherte Grafik stehen bleibt. Beschriftungen in den vorhandenen Sprachen ergänzen und die Anzeige auf schmalen und breiten Bildschirmen prüfen.

## Technische Hinweise
Der Dialog besitzt bereits einen **KI-Bild**-Knopf, aber keine Aktion zum Entfernen. Die bestehende Bildgenerierung ersetzt `image_path` und setzt `icon_path` zurück; anschliessend erstellt die Oberfläche das kleine Icon neu. Beim Entfernen werden beide Bildverknüpfungen zurückgesetzt; gemeinsam genutzte Bildergalerie-Dateien dürfen nicht pauschal gelöscht werden. Die neue Bedienung gilt für vorhandene Produkte im Bearbeiten-Dialog, nicht für Kategorien oder die Mehrfachanlage.
