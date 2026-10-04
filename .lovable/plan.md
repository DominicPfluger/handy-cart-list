# Abteilungsansicht: Stift-Icon neben Löschen-Icon anzeigen

## Aktuell
In der Abteilungsansicht (`src/routes/abteilungen.tsx`, Kategorie-Kacheln) sitzt der Stift-Button (Umbenennen) oben **links** auf der Kachel, das Papierkorb-Icon oben **rechts**.

## Änderung
- Stift-Button von `absolute left-1 top-1` auf `absolute right-11 top-1` umstellen — er erscheint dann direkt links neben dem Papierkorb-Icon in der oberen rechten Ecke.
- Alles andere (Verhalten, Tooltip, Hover-Einblendung, Styling) bleibt unverändert.

## Verifikation
- Browser-Test der Abteilungsansicht: Beide Icons oben rechts nebeneinander, Stift öffnet weiterhin den Umbenennen-Dialog.
- Typprüfung/Build fehlerfrei.
