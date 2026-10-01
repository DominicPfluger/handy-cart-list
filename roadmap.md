# Roadmap

## Erledigt
- KI-Produktbilder: Admin-Panel „KI-Bilder & Richtpreise" erzeugt stapelweise Bilder (5 pro Lauf) → Storage catalog-images/products/{id}.png, image_path gesetzt. Verifiziert: 5 Bilder erzeugt.
- KI-Richtpreise pro Markt: 50 pro Lauf, upsert in product_reference_prices. Verifiziert: 50 Preise für DE gespeichert.
- Preisanzeige in Abteilungsansicht war bereits vorhanden (useReferencePrices).
- Bildergalerie im Admin: durchsuchbar, seitenweise (30/Seite), signierte URLs. Verifiziert: 47 Produkte mit Bild angezeigt.

## Hinweis
- 3590 Produkte total; Bilder/Preise entstehen stapelweise durch wiederholtes Tippen im Admin.

## Abgebrochen
- Vorrats-Verwaltung — vom Nutzer abgebrochen, nicht umsetzen
