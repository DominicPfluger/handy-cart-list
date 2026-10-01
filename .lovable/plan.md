# KI-Bilder in Standardgrösse erzeugen

## Aktuell
`generateProductImage` in `src/lib/product-media.server.ts` fordert die Bilder mit `size: "1024x1024"` an — alle Produkt- und Kategoriebilder (KI-Bild-Button in der Kachel-Ansicht, „5 Bilder erzeugen", „Alle Bilder erzeugen") sind daher gross.

## Änderung
- Anfragegrösse von `1024x1024` auf `512x512` reduzieren (gleiche Funktion deckt Produkte **und** Kategorien ab, keine weiteren Stellen nötig).
- Alles andere bleibt unverändert: transparenter Hintergrund, WebP, Kompression 75, Qualität „medium", Stichwort-Feld, Grossansicht im Admin.

## Nutzen
- Kleinere Dateien (ca. ein Viertel), schnellere Erzeugung, weniger KI-Guthaben pro Bild.
- Die 512er-Auflösung reicht für die Anzeige in der App (Kacheln, Listen, Produktseite) locker aus.

## Verifikation
- Build-Log prüfen.
- Ein Testbild im Admin-Bereich erzeugen und in der Vorschau prüfen (Kachel + Grossansicht).
