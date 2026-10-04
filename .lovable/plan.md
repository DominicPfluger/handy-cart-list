# Grüner Statusbalken im Kaufmodus

## Ausgangslage
Der Kaufmodus (`src/components/purchase-mode.tsx`) enthält bereits einen kleinen Fortschrittsbalken im Kopfbereich (Zeilen 65–67). Er ist schmal und neben Titel/Zähler versteckt — daher kaum sichtbar.

## Geplant
1. **Balken prominent machen:** Der Fortschrittsbalken wird als durchgehend grüner Balken (Primärfarbe) ganz oben am Bildschirmrand über die volle Breite angezeigt — gut sichtbar auch beim Einkaufen mit einer Hand.
2. **Feinschliff:** Balken etwas höher (ca. 6 px), weiche Animation beim Fortschritt bleibt, Zähler „erledigt/gesamt" bleibt im Kopf.
3. **Prüfung:** Im Browser den Kaufmodus öffnen, Artikel abhaken und kontrollieren, dass der grüne Balken sichtbar mitwächst.

## Technisch
- Nur `src/components/purchase-mode.tsx`: vorhandener Balken aus dem Kopf an den oberen Rand verschieben (volle Breite, `bg-primary`, Höhe ~1.5, abgerundet), Kopfbereich entsprechend vereinfachen.
- Keine neuen Einstellungen, keine Datenänderung.
