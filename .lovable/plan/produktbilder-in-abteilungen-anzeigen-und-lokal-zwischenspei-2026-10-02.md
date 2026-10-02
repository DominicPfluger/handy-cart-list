# Produktbilder in Abteilungen anzeigen und lokal zwischenspeichern

## Ergebnis
- In der Einzelansicht einer Abteilung erscheinen vorhandene Produktbilder zuverlässig als kleine Bilder neben den Produkten, sofern unter „Mehr“ **Pixelgrafiken** gewählt ist. Beim Laden eines Bildes oder bei einem Bildfehler bleibt das bisherige Symbol als Ersatz sichtbar.
- Jedes angezeigte Bild wird beim ersten Bedarf vom Server geladen und anschliessend auf diesem Gerät gespeichert. Beim erneuten Öffnen der Abteilung oder der App kommt dasselbe Bild aus dem Cache; neue oder ausgetauschte Bilder werden weiterhin erkannt.
- Es werden keine Bilder für Produkte erfunden, für die noch keine Bilddatei existiert. Derzeit haben 80 von 3’623 Katalogprodukten ein hinterlegtes kleines Produktbild; für die übrigen bleiben Symbole sichtbar.

## Umsetzung
1. Die Bildzuordnung in der Abteilungseinzelansicht und beim Wechsel zwischen **Pixelgrafiken** und **SVG-Grafiken** korrigieren: Vorhandenes kleines Produktbild verwenden, bei noch fehlender Bildadresse sowie Ladefehler zum Symbol zurückfallen, ohne leere oder defekte Kacheln.
2. Den bestehenden Bild-Cache so anpassen, dass wechselnde zeitlich begrenzte Bildadressen nicht zu mehrfachen Downloads derselben Bilddatei führen. Bilder erst beim Anzeigen laden und anhand des stabilen Bildpfads auf dem Gerät wiederverwenden; Cachegrenzen für den Gerätespeicher beibehalten.
3. Bei neuen, entfernten und neu generierten Bildern den Cache gezielt aktualisieren; abgelaufene Bildadressen rechtzeitig erneuern, ohne gespeicherte Bilddateien unnötig erneut herunterzuladen.
4. In Abteilungen mit und ohne hinterlegte Bilder auf Smartphone und Desktop prüfen: erster Abruf, erneutes Öffnen, Neuladen der App, Offline-Wiederanzeige bereits geladener Bilder und Fallback bei fehlendem Bild.

## Technische Hinweise
- Katalogprodukte erhalten `imagePath` und `iconPath`; die kleinen Listenbilder nutzen signierte Adressen aus einer separaten Abfrage. Diese Adressen laufen nach 60 Minuten ab und werden bisher regelmässig erneuert.
- Es existiert bereits ein Service-Worker-Cache für Bilddateien. Er wird für stabile Pfade und Cache-Treffer auch bei neuer Signatur angepasst, statt Bilddateien im Arbeitsspeicher der Seite zu duplizieren.
- Das Erzeugen zusätzlicher Produktbilder und Änderungen an den grossen Produktfotos sind nicht Teil dieser Aufgabe.
