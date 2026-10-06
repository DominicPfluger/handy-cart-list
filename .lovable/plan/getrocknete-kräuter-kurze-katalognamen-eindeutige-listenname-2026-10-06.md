# Getrocknete Kräuter: kurze Katalognamen, eindeutige Listennamen

## Ziel
In der Kategorie **„Getrocknete Kräuter“** stehen die Kräuter im Katalog wieder ohne den Zusatz „getrocknet“, zum Beispiel **„Petersilie“** statt **„Petersilie getrocknet“**. Auf einer Einkaufsliste bleibt die Form eindeutig und erscheint als **„Petersilie getrocknet“**.

## Umsetzung
1. Die 24 aktuell mit „getrocknet“ endenden Produktnamen der Kategorie bereinigen. Andere Begriffe wie „Rosmarin gemahlen“, „Lorbeerblätter“ oder „Zitronengras“ bleiben unverändert.
2. Die bereinigten Produktnamen für alle 16 unterstützten Sprachvarianten ergänzen, damit im Katalog keine deutschen Rückfallnamen in anderen Sprachen erscheinen.
3. Eine gemeinsame Regel für Listennamen einführen: Produkte aus „Getrocknete Kräuter“ erhalten beim Hinzufügen den lokalisierten Zusatz für „getrocknet“. Varianten und Marken behalten ihre bisherige Darstellung; der Zusatz wird eindeutig und nur einmal ergänzt.
4. Diese Regel auf alle Wege zur Einkaufsliste anwenden: Produktdialog, Schnell-Hinzufügen, Favoriten, Scanner sowie Rezept- und Generator-Zutaten. Freitext-Einträge und Produkte aus anderen Kategorien bleiben unverändert.
5. Bereits gespeicherte Listeneinträge nicht pauschal umbenennen: vorhandene Namen bleiben stabil, neue Einträge verwenden die neue Regel. Beim erneuten Hinzufügen wird weiterhin korrekt mengenmässig zusammengeführt.

## Technische Details
- Die Kategorie wird über ihre feste Katalog-ID erkannt, nicht über den übersetzten Kategorienamen.
- Der Listenzusatz wird über die bestehende Übersetzungsschicht für alle 16 Locales bereitgestellt.
- Die Katalognamen werden als Datenänderung aktualisiert; die App-Logik wird zentral gekapselt und von allen Hinzufügen-Abläufen verwendet.

## Prüfung
- In der Kategorie und Produktsuche erscheinen kurze Namen ohne „getrocknet“.
- Derselbe Artikel erscheint nach dem Hinzufügen mit lokalisiertem „getrocknet“ auf der Einkaufsliste.
- Schnell-Hinzufügen, Favoriten, Scanner und Rezepte liefern denselben Namen.
- Andere getrocknete Produkte wie Trockenfrüchte oder getrocknete Tomaten werden nicht verändert.
- Mengen-Zusammenführung, Varianten und Marken funktionieren weiterhin.
