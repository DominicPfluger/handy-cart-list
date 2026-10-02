# Zweite Ebene für Zutaten im Rezept-Generator

## Ergebnis
Bei der Zutatenauswahl erscheinen innerhalb eines Rezeptschritts zuerst passende Gruppen wie „Nudeln“ oder „Salat“. Ein Tipp darauf öffnet die zugeordneten Sorten; mit „Zurück“ geht es zur Gruppenübersicht. Die Auswahl von Zutaten bleibt beim Wechsel zwischen Gruppen erhalten.

## Umsetzung
1. **Generator:** Zutaten eines Rezeptschritts nach ihren zugewiesenen Gruppen anzeigen. Gruppen ohne passende Zutaten nach Ernährungsform-, Küchen- oder Favoritenfilter ausblenden; ausgewählte Zutaten weiterhin sichtbar halten. Nicht gruppierte Zutaten unter „Weitere“ zeigen. Für Schritte ohne Gruppen die bisherige flache Auswahl beibehalten. Auswahlgrenzen, Überraschungsfunktion, gespeicherte Rezepte und Einkaufslisten bleiben unverändert.
2. **Admin-Panel → Rezepte & Küchen → Rezept-Generator Zutaten zuweisen:** Gruppen anlegen, umbenennen, löschen und sortieren; einer Zutat pro Rezeptschritt eine Gruppe zuweisen oder diese Zuordnung entfernen. Bestehende Suche, Katalogauswahl und Produktsortierung bleiben nutzbar. Vor dem Löschen einer Gruppe anzeigen, welche Zuordnungen zu „Weitere“ wechseln; Gruppen mit Untergruppen ausdrücklich bestätigen.
3. **Sprachen & Prüfung:** Gruppennamen über die vorhandene automatische Übersetzung für Katalogeinträge lokalisieren. Im angemeldeten Admin-Bereich eine Gruppe anlegen und Zutaten zuweisen, dann auf Handy und Desktop im Generator Gruppen öffnen, Zutaten wählen, zurücknavigieren und das Ergebnis prüfen.

## Technische Details
Die vorhandenen `recipe_groups` und `recipe_ingredients.group_id` bilden die neue Ebene bereits ab; der Katalog lädt Gruppen samt Übersetzungen. Die Admin-Ansicht verwendet die bestehenden geschützten Funktionen für Gruppen und die vorhandenen RLS-geschützten Zutatenzuordnungen. Eine neue Tabelle oder Schemaänderung ist nicht nötig. Der derzeitige Generator und Admin nutzen die Gruppenzuordnung noch nicht; 137 von 339 vorhandenen Zutatenzuordnungen sind bereits gruppiert, die übrigen bleiben über „Weitere“ erreichbar. Gruppen werden aus den Zutaten eines jeweiligen Rezeptschritts abgeleitet, damit nur relevante Gruppen erscheinen.
