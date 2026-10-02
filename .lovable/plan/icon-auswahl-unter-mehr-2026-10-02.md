# Icon-Auswahl unter „Mehr“

## Ziel
Unter „Mehr“ kann man zwischen den generierten Bildern für Abteilungen und Produkte und den bisherigen Symbolen wählen. Die Auswahl ändert die kleinen Katalog- und Listen-Icons, nicht die grossen Produktfotos oder Bilder im Admin-Bereich.

## Umsetzung
1. In den Einstellungen unter „Mehr“ eine übersichtliche Auswahl mit zwei Optionen ergänzen: „Generierte Bilder“ und „Bisherige Symbole“. Die aktuelle Auswahl ist erkennbar; ein Wechsel wirkt sofort.
2. Die Einstellung auf dem jeweiligen Gerät speichern und für Abteilungen, Produkte und zugehörige kleine Icons in Abteilungsansicht, Einkaufsliste, Favoriten und weiteren App-Ansichten einheitlich anwenden. Fehlt ein generiertes Bild, bleibt das vorhandene Symbol sichtbar.
3. Bezeichnungen in die bestehende Sprachverwaltung aufnehmen und die Umschaltung auf Smartphone und Desktop prüfen.

## Technische Hinweise
- Der Katalog liefert bereits Abteilungsbilder sowie separate, komprimierte Produkt-Icons; diese werden für die Bildoption wiederverwendet. Es werden keine neuen Bilder erzeugt oder Datenbankeinträge verändert.
- Ein vollständiges SVG-Set für Abteilungen und Produkte ist derzeit nicht vorhanden. Gemäss Auswahl des Nutzers verwendet die Alternative deshalb die bisherigen Symbole (überwiegend Emoji, vereinzelt vorhandene SVG-Grafik), nicht ein neu gezeichnetes SVG-Set.
- Die Einstellung wird wie andere persönliche Darstellungspräferenzen lokal auf dem Gerät gehalten und mit einem gemeinsamen reaktiven Zugriff für die betroffenen Ansichten bereitgestellt.
