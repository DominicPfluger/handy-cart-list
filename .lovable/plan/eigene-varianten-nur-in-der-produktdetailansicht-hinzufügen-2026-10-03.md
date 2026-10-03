# Eigene Varianten nur in der Produktdetailansicht hinzufügen

## Ergebnis
- In der Abteilungsansicht verschwindet „Eigene Variante hinzufügen“ unter dem Produktnamen sowie das Eingabefeld in der aufgeklappten Variantenliste. Vorhandene Katalog- und eigene Varianten bleiben dort sichtbar und mit Herz, Blitz und Plus verwendbar.
- Die Produktdetailansicht bekommt für alle Nutzer einen Bereich zum Anlegen und Entfernen eigener Varianten – auch wenn ein Produkt bisher keine Varianten hat. Doppelte oder leere Namen werden abgefangen.
- Eigene Varianten bleiben wie bisher nur auf dem jeweiligen Gerät gespeichert. Admins können die gemeinsamen Katalogvarianten weiterhin getrennt bearbeiten; das Entfernen einer eigenen Variante verändert weder den Katalog noch bereits hinzugefügte Listeneinträge.
- Der Weg von der Abteilungsansicht zur Produktdetailansicht bleibt auch bei Produkten ohne Varianten erreichbar.

## Technische Umsetzung
- In der Abteilungsansicht nur die Anlage-Eingabe und den „Eigene Variante hinzufügen“-Auslöser entfernen; die Anzeige und Aktionen bestehender Varianten beibehalten. Den Detailzugang für Produkte ohne Varianten sichtbar machen.
- In der Produktdetailansicht den vorhandenen gerätelokalen Variantenspeicher für Hinzufügen/Entfernen nutzen. Persönliche und gemeinsame Varianten im selben Bereich unterscheiden, damit nur persönliche Varianten für Nutzer löschbar sind und die bisherigen Admin-Aktionen ausschließlich gemeinsame Varianten bearbeiten.
- Bestehende Übersetzungen für Eingabe, Dublettenmeldung und Entfernen wiederverwenden; Admin-Beschriftung und Speichern gemeinsamer Varianten unverändert lassen.
- Auf schmalem und breitem Bildschirm prüfen: Variante in Details anlegen, in der Abteilungsansicht verwenden, neu laden, in Details entfernen; Produkt ohne Varianten und Admin-Fall prüfen.
