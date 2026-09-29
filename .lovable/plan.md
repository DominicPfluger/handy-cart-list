# Kategorien lokal entfernen

- In der Abteilungsansicht erhält jede Kategorie und Abteilung eine dezente Entfernen-Aktion. Vor dem Entfernen erscheint eine Bestätigung mit dem Hinweis, dass auch enthaltene Unterkategorien und Produkte aus dieser Ansicht verschwinden.
- Vorgegebene Katalogkategorien werden **nur auf diesem Gerät ausgeblendet**, niemals für andere Personen gelöscht. Selbst erstellte Kategorien werden lokal samt eigenen Unterkategorien und Produkten gelöscht. Bereits hinzugefügte Artikel in Einkaufslisten und Favoriten bleiben erhalten.
- Unter den Einstellungen in **Mehr** können ausgeblendete Katalogkategorien wieder sichtbar gemacht werden, damit ein versehentliches Entfernen rückgängig gemacht werden kann.
- Die Anzeige nach dem Entfernen und Wiederherstellen auf einem schmalen Bildschirm prüfen; Sortieren und Öffnen von Kategorien sollen weiterhin funktionieren.

## Technische Umsetzung

Der gemeinsame Katalog wird mit persönlichen, lokal gespeicherten Ergänzungen zusammengeführt. Für vorgegebene Kategorien wird eine lokale Liste ausgeblendeter IDs gespeichert; alle Nachkommen und zugehörigen Produkte werden in der Abteilungsansicht ausgefiltert, auch in der Suche. Die bestehende Löschfunktion für selbst erstellte Kategorien wird wiederverwendet. Die Entfernen-Aktion wird von der Kachel-Navigation und dem langen Druck zum Sortieren getrennt. Beschriftungen und Bestätigungstexte werden in den vorhandenen Sprachvarianten ergänzt. Es sind keine Änderungen an gemeinsamen Katalogdaten oder an der Datenbank nötig.
