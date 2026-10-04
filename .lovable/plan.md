# Pflege: Beide Bilder gleichzeitig per KI erzeugen

## Ziel
Im Admin-Panel unter „Pflege" → „Produkte ohne Bild" soll es möglich sein, für ein Produkt **beide Bilder gleichzeitig per KI** zu erzeugen: das grosse Produktbild und das kleine Vorschaubild (Icon) als zwei eigenständige KI-Bilder — statt das Icon nur aus dem grossen Bild abzuleiten.

## Aktueller Stand (geprüft)
- Der Zauberstab pro Zeile (`fix` in `src/components/admin/missing-images-panel.tsx`) erzeugt nur das grosse Bild per KI und leitet das Icon daraus ab (`saveProductIconFromPath`).
- Die Server-Funktion `generateImageFor` (`src/lib/product-media.functions.ts`) kennt bereits `iconOnly: true` — erzeugt ein separates KI-Icon, schreibt aber noch nicht in die Datenbank (gibt nur den Pfad zurück).

## Umsetzung

1. **Server-Funktion erweitern** (`product-media.functions.ts`)
   - Bei `iconOnly: true` wird der erzeugte Pfad direkt als `icon_path` am Produkt gespeichert (bisher nur Rückgabe des Pfads).

2. **Pflege-Panel** (`missing-images-panel.tsx`)
   - Pro Zeile ein **zweiter Button** (z. B. Doppel-Zauberstab / „Beide per KI"): erzeugt nacheinander das grosse Bild **und** ein eigenes KI-Icon und speichert beide.
   - Der bestehende Zauberstab behält sein Verhalten (grosses Bild per KI, Icon daraus abgeleitet) — kostet nur eine KI-Erzeugung.
   - Beim **Stapel-Lauf** („Alle n mit KI erzeugen") eine kleine Auswahl: „Icon aus Bild ableiten" (1 KI-Bild pro Produkt) oder „Icon separat per KI" (2 KI-Bilder pro Produkt). Fortschritt und Abbrechen bleiben wie bisher.
   - Tooltips/Beschriftungen machen den Unterschied und den doppelten KI-Verbrauch klar.

3. **Texte** (`src/i18n/de.ts` + `messages.json`, alle 16 Sprachen)
   - Neue Schlüssel für „Beide Bilder per KI erzeugen", die Stapel-Option und Hinweis auf doppelten KI-Verbrauch.

## Hinweis
„Beide per KI" verbraucht pro Produkt **zwei** KI-Bilder (Guthaben). Der bestehende Modus mit abgeleitetem Icon bleibt die sparsame Standardoption.

## Prüfung
- Typprüfung und Build.
- Browser-Test im Admin → Pflege: Einzelprodukt mit beiden KI-Bildern erzeugen, beide Vorschauen erscheinen; Stapel-Option sichtbar.
