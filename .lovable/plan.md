# Eigene Produktvarianten in der Abteilungsansicht

## Ergebnis
Nutzer können direkt unter einem Produkt eine eigene Variante anlegen. Die Variante erscheint anschliessend neben den vorhandenen Varianten und lässt sich mit Herz, Blitz oder Plus wie jede andere Variante verwenden. Eigene Varianten können auch wieder entfernt werden; vorgegebene Katalogvarianten bleiben unverändert.

## Umsetzung
1. In der aufgeklappten Variantenliste eine Eingabe mit Hinzufügen-Knopf ergänzen. Auch Produkte ohne bestehende Varianten lassen sich dazu aufklappen. Leere Namen und doppelte Varianten desselben Produkts werden abgefangen.
2. Eigene Varianten pro Produkt nur auf diesem Gerät speichern, entsprechend den bestehenden persönlichen Katalog-Anpassungen. Die gemeinsame Produktdatenbank und Admin-Varianten werden dadurch nicht verändert.
3. Eigene und vorgegebene Varianten für Anzeige, Suche, Favoriten, Schnell-Hinzufügen und den Produkt-hinzufügen-Dialog zusammenführen. Beim Löschen einer eigenen Variante bleibt ein bereits zur Einkaufsliste hinzugefügter Eintrag bestehen.
4. Neue Bedienungstexte in Deutsch und den vorhandenen App-Sprachen ergänzen; auf schmalen und breiten Bildschirmen die Anlegen-/Verwenden-/Entfernen-Abläufe prüfen.

## Technische Hinweise
Ein kleiner gerätelokaler Speicher mit React-Abonnement hält Varianten über Seitenwechsel und Neuladen aktuell. Die Varianten werden bei der Kataloganzeige pro Produkt ergänzt; Schreibrechte für den gemeinsamen Katalog bleiben ausschliesslich beim Admin. Bereits im Mengen-Dialog eingegebene freie Sorten bleiben weiterhin für einen einzelnen Hinzufüge-Vorgang möglich.
