# Varianten in „Produkte ohne Bild" aufklappbar anzeigen

## Ziel
Im Admin-Panel unter „Bilder → Produkte ohne Bild" sollen die Varianten eines Produkts direkt unter dem Produkt-eintrag sichtbar sein — aufklappbar pro Produkt.

## Umsetzung

### 1. Aufklappbare Varianten-Zeile (`src/components/admin/missing-images-panel.tsx`)
- Produkte mit Varianten (`prods` enthält bereits `variants: string[]`) bekommen einen kleinen Aufklapp-Knopf (Pfeil) mit der Anzahl der Varianten, z. B. „3 Varianten".
- Aufgeklappt erscheint unter dem Produkteintrag eine eingerückte Liste der Varianten:
  - kleines Vorschaubild (oder Platzhalter-Icon, wenn keins vorhanden)
  - Variantenname
  - der vorhandene `VariantImageButton` (KI-Bild erzeugen/löschen pro Variante, inkl. Optionen-Dialog) — wird wiederverwendet, keine neue Logik.
- Variantenbilder kommen aus der Tabelle `product_variant_images` (Bild + Icon pro Variante); die Bild-URLs werden wie bisher über signierte Links geladen.

### 2. Übersetzungen
- Neuer Text „n Varianten" (`adm.noImg.variants`) in `de.ts` und `messages.json` (alle 16 Sprachen).

### 3. Prüfung
- Typprüfung (`bunx tsgo --noEmit`), Build-Log und Browser-Test im Bilder-Tab: Produkt mit Varianten aufklappen, Variante mit Bild und ohne Bild prüfen.

## Technische Details
- Daten: `products.variants` (Namen) + `product_variant_images` (image_path/icon_path), Abfrage pro sichtbarer Produktseite (max. 5 Produkte × deren Varianten).
- Wiederverwendung: `VariantImageButton` aus `src/components/admin/variant-image-button.tsx` (enthält bereits KI-Generierung mit Optionen-Dialog und Löschen).
- Keine Änderungen an Datenbank oder bestehenden Filtern; die Varianten-Anzeige ist rein ergänzend.
