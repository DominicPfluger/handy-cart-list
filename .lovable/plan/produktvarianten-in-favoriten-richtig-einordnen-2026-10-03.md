# Produktvarianten in Favoriten richtig einordnen

## Ziel
Favorisierte Produktvarianten erscheinen unter derselben Kategorie wie ihr Stammprodukt, statt unter „Weitere“. Ihre Variantenbezeichnung und ihr Variantenbild bleiben erhalten.

## Umsetzung
1. In der Favoritenansicht bei Varianten die Produkt-ID vor `::` für die Katalogzuordnung verwenden; den vollständigen Varianten-Schlüssel weiterhin für Favoritenstatus, Entfernen und Sortierung behalten.
2. Für die Anzeige die gespeicherte Variantenbezeichnung und – sofern vorhanden – das Varianten-Icon nutzen. Die gespeicherte Kategorie beziehungsweise eine passende Alias-Kategorie bei der Listenübernahme berücksichtigen.
3. „Schnell hinzufügen“, Hinzufügen mit Mengenangabe und „Alle Favoriten als neue Liste“ so prüfen und bei Bedarf anpassen, dass die Variante statt nur des Stammprodukts übernommen wird.
4. Im Browser eine favorisierte Variante auf der Abteilungsseite anlegen und ihre Kategorie, Darstellung und Listenübernahme in der Favoritenansicht überprüfen; normale Favoriten und Favoriten ohne Katalogeintrag bleiben unverändert.

## Technischer Hinweis
Varianten-Favoriten werden derzeit mit einem Schlüssel aus Produkt-ID und Variantenkennung (`produktId::variante`) gespeichert. Die Favoritenansicht sucht diesen ganzen Schlüssel als Katalogprodukt und behandelt die Variante deshalb als Eintrag ohne Kategorie.
