# Ernährungs- und Länderküchenfilter für Non-Food/Near-Food aussetzen

## Ergebnis
- Wenn Ernährungsformen oder Länderküchen ausgewählt sind, bleiben Non-Food- und Near-Food-Abteilungen mit ihren Produkten sichtbar. Die Auswahl bleibt gespeichert und wirkt weiterhin auf Lebensmittel.
- Körperpflege, Haushalt und Tierbedarf sind ausdrücklich eingeschlossen. Weitere eindeutig nicht essbare Bereiche wie Apotheke & Drogerie, Büroartikel, Autozubehör, Elektronik, Kleidung & Textilien, Küchenutensilien und Tabak & Dampfen werden ebenfalls ausgenommen. Gemischte Bereiche wie Party-Artikel bleiben produktabhängig gefiltert, damit essbare Artikel dort nicht pauschal durchrutschen.
- Die Filter-Schaltflächen bleiben erreichbar; die Ausnahme greift automatisch innerhalb der Abteilungsansicht, auch bei Suche und Unterkategorien.

## Technische Umsetzung
- Im Katalog sind Abteilungen über `parentId` verschachtelt; die Filterung erfolgt derzeit produktweise in der Abteilungsansicht. Die Ausnahme wird anhand der obersten Abteilung des Produkts ermittelt, ohne die gespeicherten Filter oder Katalogdaten zu ändern.
- Produktfilter und das Ausblenden leerer Kategorien gemeinsam anpassen, damit ausgenommene Bereiche nicht weiterhin verschwinden.
- Auf schmalem und breitem Bildschirm mit aktiver Ernährungsform und Länderküche prüfen: Lebensmittel werden gefiltert, ausgenommene Bereiche bleiben sichtbar, Zurücksetzen funktioniert unverändert.
