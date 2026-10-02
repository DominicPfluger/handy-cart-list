# Zutatenkategorien im Rezept-Generator verwalten

## Ergebnis
- Im Admin-Panel lassen sich die Zutatenbereiche jeder Rezeptvorlage, etwa „Belag“, „Sauce“ und „Käse“ bei Pizza, direkt bei der gewählten Vorlage verwalten: anlegen, umbenennen, Emoji und Auswahlgrenzen ändern, Reihenfolge ändern und nach Bestätigung löschen. Die bestehende Zuordnung von Produkten zu diesen Bereichen bleibt nutzbar.
- Die kleineren grau hinterlegten Kategorien im Rezept-Generator erhalten einen sichtbaren Aufklapp-Pfeil. Ihre Zutaten erscheinen erst nach Antippen; mehrere Kategorien können gleichzeitig offen sein, und ausgewählte Zutaten bleiben sichtbar.
- Alle grauen Kategorie-Felder eines Zutatenbereichs stehen ohne Zeilenumbruch in einer seitlich scrollbareren Reihe – auch auf dem Handy. Die eingeblendeten Zutaten stehen direkt darunter innerhalb desselben Bereichs; die bestehende Begrenzung auf zehn mit „Weitere anzeigen“ bleibt erhalten.

## Technische Umsetzung
- Die vorhandene Verwaltung der `recipe_steps` in `recipe-admin.tsx` für die gewählte Vorlage unmittelbar zugänglich machen und verständlich als Zutatenbereiche kennzeichnen. Vorhandene Speichern-, Löschen- und Sortierwege weiterverwenden; keine neue Datenstruktur oder automatische KI-Aktion.
- Die vorhandenen `openGroups` in `recipe-builder.tsx` beibehalten. Kategorie-Schalter mit `aria-expanded` und Pfeilsymbol ausstatten; Kategorie-Schalter in einer horizontalen `overflow-x-auto`-/`flex-nowrap`-Reihe anzeigen, aufgeklappte Zutaten darunter pro Kategorie in derselben Ansicht darstellen. Such- und Auswahlverhalten erhalten.
- Nur falls neue Beschriftungen nötig werden, diese in Deutsch und den übrigen vorhandenen Sprachen ergänzen. Darstellung und Bedienung auf Handy und Desktop prüfen.
