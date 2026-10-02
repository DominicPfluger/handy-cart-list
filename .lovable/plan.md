# Rezeptgenerator: Kategorien und Zutaten in einer Zeile

Ja, das geht. Die Untergruppen innerhalb einer geöffneten Zutaten-Ebene werden als umrandete Einträge im gleichen Stil wie die Produkte dargestellt. Die Zutaten beginnen direkt neben der jeweiligen Kategorie-Bezeichnung statt in einer neuen Zeile.

## Umsetzung
- Jede Untergruppe erhält eine kompakte, umrandete Kennzeichnung mit Emoji und Namen; danach folgen ihre zugeordneten Produkt-Einträge unmittelbar im selben Zeilenfluss.
- Die Kategorie-Bezeichnung selbst bleibt zusammen und bricht nicht mitten im Text um. Auf schmalen Bildschirmen darf die gesamte Zeile bei Bedarf an einer sinnvollen Stelle umbrechen, ohne Text abzuschneiden.
- Bestehende Auswahl, Suche, Reihenfolge und die Begrenzung auf zunächst zehn Zutaten je Ebene mit „Weitere anzeigen“ bleiben unverändert.
- Darstellung auf schmalem und breitem Bildschirm sowie Auswahl eines Produkts prüfen.

## Technisches
- Ausschliesslich die Darstellung der Untergruppen im Rezeptgenerator anpassen; keine Änderungen an Zutaten-Zuordnung oder gespeicherten Rezepten.
- Vorhandene Farb- und Rahmentokens verwenden; keine neuen Texte oder Übersetzungen nötig.
