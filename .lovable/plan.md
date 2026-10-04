# Bilder-Tab: Varianten aufklappbar + Produktbilder pro Kategorie

## Ziel
Zwei Ergänzungen im Admin-Panel unter „Bilder":

1. **Varianten aufklappbar** — bei „Produkte ohne Bild" lassen sich die Varianten eines Produkts direkt unter dem Produkteintrag aufklappen.
2. **Produktbilder der gewählten Kategorie** — unterhalb von „Produkte ohne Bild" erscheint eine Auflistung aller Produktbilder der im Kategorienfilter gewählten Kategorie.

## Umsetzung

### 1. Aufklappbare Varianten (`src/components/admin/missing-images-panel.tsx`)
- Produkte mit Varianten (`prods` enthält bereits `variants: string[]`) bekommen einen kleinen Aufklapp-Knopf (Pfeil) mit der Anzahl, z. B. „3 Varianten".
- Aufgeklappt erscheint unter dem Produkteintrag eine eingerückte Liste der Varianten:
  - kleines Vorschaubild (oder Platzhalter-Icon, wenn keins vorhanden)
  - Variantenname
  - der vorhandene `VariantImageButton` (KI-Bild erzeugen/löschen pro Variante, inkl. Optionen-Dialog) — wird wiederverwendet, keine neue Logik.
- Variantenbilder kommen aus `product_variant_images` (Bild + Icon pro Variante), geladen über signierte Links wie bisher.

### 2. Produktbilder der gewählten Kategorie (gleiche Datei)
- Neuer Abschnitt direkt unter „Produkte ohne Bild", sichtbar sobald im Kategorienfilter eine Kategorie gewählt ist (Unterkategorien eingeschlossen, wie beim bestehenden Filter).
- Kachel-Raster der Produkte dieser Kategorie, die ein Bild haben: grosses Bild, darunter Produktname; Klick auf eine Kachel öffnet den bekannten Bearbeitungsdialog (`onEdit`).
- Lädt zunächst eine begrenzte Anzahl (z. B. 24) mit „Mehr laden"-Knopf, um Ressourcen zu schonen.
- Ohne Kategoriewahl wird ein kurzer Hinweis angezeigt („Kategorie wählen, um Bilder zu sehen").

### 3. Übersetzungen
- Neue Texte (`adm.noImg.variants`, `adm.noImg.catImages`, `adm.noImg.catImagesHint`) in `de.ts` und `messages.json` (alle 16 Sprachen).

### 4. Prüfung
- Typprüfung (`bunx tsgo --noEmit`), Build-Log und Browser-Test im Bilder-Tab: Variante aufklappen, Kategorie wählen, Bilder-Raster prüfen.

## Technische Details
- Daten: `products.variants` + `product_variant_images` (Varianten), `products.image_path/icon_path` (Kategorie-Raster) — alles bereits über `prods` bzw. eine ergänzende Abfrage verfügbar.
- Wiederverwendung: `VariantImageButton` aus `src/components/admin/variant-image-button.tsx`; signierte URLs aus dem Bucket `catalog-images` wie im bestehenden Panel.
- Keine Datenbankänderungen; bestehende Filter und Batch-Funktionen bleiben unverändert.
