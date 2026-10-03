# Marktwahl in „Mehr“ wirksam machen

Die Marktwahl ist in „Mehr“ bereits vorhanden. Richtpreise reagieren auf die Auswahl, aber die Produktliste, ihre Marktreihenfolge und marktbezogene Marken verwenden derzeit weiterhin das Land der eingestellten Sprache.

## Umsetzung

1. Die bestehende Marktwahl beibehalten: „Automatisch (aus Sprache)“ oder ein aktivierter Markt. Die Sprache und ihre Übersetzungen bleiben unabhängig davon unverändert.
2. Produkt-Sichtbarkeit und -Reihenfolge sowie Markierungen für fremde Märkte an die tatsächliche Marktwahl koppeln. Marktabhängige Marken in Suche, Produktdetail und Hinzufügen-Dialog ebenfalls nach dem gewählten Markt bestimmen.
3. Prüfen, dass ein Marktwechsel ohne Neuladen die Abteilungsansicht, Produktsuche, Detailseite, Marken und Richtpreise aktualisiert; „Automatisch“ soll wieder dem Sprachland folgen.

## Technische Hinweise

- Die vorhandene gerätelokale Markteinstellung und die Liste aktivierter Märkte weiterverwenden; keine Änderung an gespeicherten Produktdaten oder an der Verwaltung der Märkte.
- Den reaktiven Markt-Hook in der Katalogaufbereitung und bei Markenverwendungen nutzen; die gewählte Sprache nur für Namen und Zahlenformatierung verwenden.