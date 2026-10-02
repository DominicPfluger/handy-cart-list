# Roadmap

## Offen

## Erledigt
- Gewünschte Ernährungsformen unter „Mehr“ voreinstellen; Abteilungen und Rezept-Generator übernehmen die gerätelokale Auswahl.
- Produktbild im Admin-Produktdialog entfernen oder neu generieren; Listen-Icon und Vorschau werden aktualisiert.
- Geschätzte Summe am Ende der Einkaufsliste; fehlende Preise werden gezählt, statt als kostenlos dargestellt.
- Einzelne neue Katalogprodukte automatisch lokalisieren, bebildern und für Märkte schätzen; Mehrfachanlage unverändert.
- Rezept-Zutaten-Kategorien rahmenlos und ohne Anzahl/Pfeil aufklappbar; manuelle Gruppenpflege im Admin bleibt erhalten.
- Icon-Set unter „Mehr“ als Drop-down mit „Pixelgrafiken“ und „SVG-Grafiken“ in allen Sprachen.
- Icon-Auswahl unter „Mehr“: gerätelokal zwischen generierten Katalogbildern und bisherigen Symbolen wechseln; kleine Icons in App-Ansichten folgen der Auswahl.
- Rezept-Generator: Zutaten je Rezeptschritt nach admin-gepflegten Gruppen mit zweiter Auswahl-Ebene; nicht gruppierte Zutaten unter „Weitere“, bisherige flache Ansicht ohne Gruppen bleibt erhalten.
- Kleine Produkt-Icons: Abteilungen und Einkaufslisten verwenden separate komprimierte WebP-Icons; Upload, KI-Bilder und Galerie-Auswahl erstellen sie, bestehende Bilder lassen sich unter „Bilder“ nachträglich aufbereiten.
- KI-Produktbilder: Admin-Panel „KI-Bilder & Richtpreise" erzeugt stapelweise Bilder (5 pro Lauf) → Storage catalog-images/products/{id}.png, image_path gesetzt. Verifiziert: 5 Bilder erzeugt.
- KI-Richtpreise pro Markt: 50 pro Lauf, upsert in product_reference_prices. Verifiziert: 50 Preise für DE gespeichert.
- Preisanzeige in Abteilungsansicht war bereits vorhanden (useReferencePrices).
- Bildergalerie im Admin: durchsuchbar, seitenweise (30/Seite), signierte URLs. Verifiziert: 47 Produkte mit Bild angezeigt.

## Hinweis
- 3590 Produkte total; Bilder/Preise entstehen stapelweise durch wiederholtes Tippen im Admin.

## Abgebrochen
- Vorrats-Verwaltung — vom Nutzer abgebrochen, nicht umsetzen
