# Pflege: Produkte ohne Bild

## Was du bekommst
Im Admin unter **Pflege** ein neuer Bereich **„Produkte ohne Bild"**:
- Liste aller Produkte, denen das grosse Vorschaubild oder das kleine Icon fehlt (Filter: „Ohne Vorschaubild", „Ohne Icon", „Beides fehlt").
- Jede Zeile: **links das grosse Bild**, **daneben das kleine Icon** (fehlt etwas, ein grauer Platzhalter mit Symbol), dann Produktname und Kategorie-Pfad.
- Ganz rechts ein **KI-Zauberstab-Knopf**: erzeugt das fehlende Bild automatisch (Vorschaubild und daraus das kleine Icon). Während der Erstellung dreht sich der Knopf; danach erscheinen die Bilder sofort und die Zeile verschwindet aus der Liste.
- Oben zusätzlich „Alle 30 erzeugen" für die gerade geladene Seite (nacheinander, mit Fortschritt und Abbrechen).
- Es werden **nur 30 Produkte auf einmal** geladen; darunter „Weitere 30 laden". Bilder werden erst beim Sichtbarwerden geladen.
- Klick auf den Namen öffnet den bestehenden Bearbeiten-Dialog.
- KI-Bilder folgen der gespeicherten Regel: ohne Kräuter, Zusätze und Gefässe.

## Technische Details
- Neue Komponente `src/components/admin/missing-images-panel.tsx`, eingebunden in `CatalogHealthPanel` (Tab „health").
- Datenquelle: bereits geladene `d.prods` (image_path/icon_path) filtern, nach Abteilungsreihenfolge sortieren, clientseitig in 30er-Schritten paginieren; Signed-URLs nur für die sichtbaren 30 holen (`getCatalogImageUrls`).
- KI: bestehende Server-Funktion `generateImageFor` (kind product); danach das vorhandene Icon-Kompressions-Helper im Browser für `icon_path` nutzen (gleicher Weg wie im Bearbeiten-Dialog). Fehlt nur das Icon, Icon aus vorhandenem Vorschaubild komprimieren statt neu zu generieren.
- Fehler (z. B. KI-Guthaben 402/429) als Toast, Batch stoppt.
- Neue Texte in de.ts + allen Locales von messages.json.
