# Produktbilder in Abteilungen und Einkaufsliste als kleine Icons

## Ergebnis
- In der Abteilungsansicht zeigt jedes Produkt links sein hinterlegtes Bild statt des Emojis. In der Einkaufsliste erscheint dasselbe Bild links vom Eintrag, sofern dieser mit einem Katalogprodukt verknüpft ist. Ohne Bild bleiben die bisherigen Emojis sichtbar; manuell eingegebene Artikel bleiben unverändert.
- Das grosse Produktbild bleibt für die Produktseite und die Bild-Grossansicht erhalten. Für kleine Listenbilder entsteht zusätzlich eine eigene, transparente, quadratische WebP-Version in Icon-Grösse (ca. 64 × 64 Pixel). Die Kompression zielt auf wenige KB pro Bild; falls ein Motiv das nicht ohne unbrauchbare Qualität erlaubt, hat ein erkennbares Icon Vorrang vor einer starren Dateigrenze.

## Umsetzung
1. Für Produkte einen separaten Icon-Pfad speichern und kleine Icons im vorhandenen Bildspeicher ablegen. Katalog-Laden und Bildadressen erweitern, sodass die Abteilungsansicht und Einkaufsliste die kleine Datei laden, während Detailansicht und Admin-Grossansicht das bisherige grosse Bild behalten.
2. Beim Hochladen eines Produktbildes im Admin-Fenster die Icon-Datei im Browser aus dem vorbereiteten Bild erzeugen und komprimieren, dann beide Versionen speichern. Bei einem KI-generierten Einzelbild sowie bei der Stapelerzeugung nach dem Speichern des grossen Bildes das Icon ebenfalls erzeugen und zuweisen. Auch bei der Auswahl eines vorhandenen Bildes aus der Galerie ein passendes Icon für das Produkt anlegen. Kategorie-Bilder bleiben unverändert.
3. Für bereits vorhandene Produktbilder eine nachholbare, stapelweise Icon-Aufbereitung im Admin-Bereich „Bilder“ vorsehen; bis zur fertigen Umstellung vorübergehend das vorhandene Bild anzeigen, danach nur noch das kleine Icon. Abgebrochene Aufbereitung kann fortgesetzt werden. Bei fehlgeschlagener Icon-Erzeugung den Fehler sichtbar melden und das Produktbild nicht als vollständig verarbeitet ausgeben.
4. Für bestehende Listenartikel das aktuelle Bild über ihre Produktverknüpfung beziehen, statt eine möglicherweise abgelaufene gespeicherte Bildadresse zu verwenden. Bilder sollen nach Hochladen oder KI-Erzeugung beim nächsten Laden der Ansichten sichtbar werden; Bildwechsel dürfen keine veralteten Icons hinterlassen.

## Technische Hinweise
- Eine neue nullable Spalte für den Icon-Pfad in `products` plus Migration; bestehende Bildpfade und Zugriffsregeln bleiben erhalten. Kein neuer Bilddienst und keine Änderung an Kategorie-Icons.
- Icon-Umwandlung per Canvas im Admin-Browser (Transparenz erhalten, `object-contain` statt hartem Zuschnitt); kein natives Bildverarbeitungsmodul im Server. Einzel- und Stapelabläufe nutzen dieselbe Hilfsfunktion.
- Prüfen: bestehendes KI-Bild, neues Upload- und KI-Bild, Galeriebild, Listenartikel nach Neuladen sowie Emoji-Fallback; Icon-Dateigrössen und Anzeige auf Handy/Desktop kontrollieren.
