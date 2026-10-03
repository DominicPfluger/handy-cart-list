# Doppelte Varianten-Eingabe entfernen

Auf der Produktdetailseite erscheinen für angemeldete Admins derzeit zwei Eingabefelder zum Hinzufügen von Varianten: eines für eigene Varianten auf diesem Gerät und eines für gemeinsame Katalogvarianten. Das wirkt wie eine doppelte Funktion.

## Umsetzung
- Das zusätzliche Eingabefeld für gemeinsame Varianten von der Produktdetailseite entfernen. Dort bleibt nur „Eigene Variante hinzufügen“ für alle Nutzer sichtbar.
- Gemeinsame Varianten können weiterhin im Admin-Panel verwaltet werden; die bereits angezeigten Varianten und ihre Löschmöglichkeiten bleiben unverändert.
- Die Produktdetailseite mit einem Admin-Konto prüfen, damit nur noch ein Feld zum Hinzufügen erscheint und persönliche Varianten weiterhin angelegt werden können.

## Technisch
- Nur die überflüssige Admin-Eingabe und ihren zugehörigen Zustand/Speicheraufruf in der Produktdetailseite entfernen; keine Änderung an Katalogdaten oder Admin-Verwaltung.
