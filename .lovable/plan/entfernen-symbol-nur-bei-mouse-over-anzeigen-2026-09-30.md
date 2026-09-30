# Entfernen-Symbol nur bei Mouse-Over anzeigen

## Ziel
Das Papierkorb-Symbol auf den Kategorie-Kacheln in der Abteilungsansicht ist standardmässig unsichtbar und erscheint erst, wenn die Maus über der Kachel ist.

## Umsetzung
In `src/routes/abteilungen.tsx` (Kategorie-Kacheln, ca. Zeile 384–411):

- Dem äusseren Kachel-Container die Klasse `group` geben.
- Dem Entfernen-Button `opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100` geben, damit er nur bei Mouse-Over (oder Tastatur-Fokus) sichtbar ist.
- Auf Touch-Geräten (kein Hover) bleibt der Button sichtbar, damit die Funktion dort erreichbar bleibt — Umsetzung über eine Hover-Media-Query-Variante (`[@media(hover:hover)]:opacity-0`), sodass die Unsichtbarkeit nur auf Geräten mit Maus greift.

Keine weiteren Änderungen; Bestätigungsdialog und Wiederherstellung unter „Mehr" bleiben unverändert.
