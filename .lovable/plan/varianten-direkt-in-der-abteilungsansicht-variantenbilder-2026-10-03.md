# Varianten direkt in der Abteilungsansicht + Variantenbilder

## Was sich ändert
- **Abteilungsansicht:** Tippt man auf ein Produkt mit Varianten, klappt darunter (eingerückt) die Variantenliste auf, statt die Produktseite zu öffnen. Erneutes Tippen klappt sie zu. Produkte ohne Varianten öffnen wie bisher die Produktseite.
- Jede Variantenzeile zeigt Bild (oder Produkt-Symbol als Ersatz), übersetzten Namen und einen „+“-Knopf, der das Produkt mit dieser Variante direkt auf die Liste setzt (wie die bestehende Variantenauswahl im Hinzufügen-Dialog).
- Ein kleiner Pfeil (▾/▴) neben dem Produktnamen zeigt, dass Varianten vorhanden sind; der Weg zur Produktseite bleibt über einen „Details“-Eintrag am Ende der aufgeklappten Liste erhalten.
- **Admin:** Im Produkt-Bearbeiten-Dialog erhält jede Variante ein Bildfeld (hochladen, löschen, KI-Bild mit Bestätigung vor Credits; Stilregel: ohne Kräuter, Zusätze, Gefässe). Kleines Symbolbild wird wie bei Produkten automatisch verkleinert.

## Technische Details
- Neue Tabelle `product_variant_images` (product_id → products, variant text, image_path, icon_path, unique(product_id, variant)); GRANT SELECT an anon/authenticated, ALL an service_role; RLS: Lesen für alle, Schreiben nur `has_role(auth.uid(),'admin')`. Bilder im bestehenden Produktbild-Speicher.
- Katalog-Abfrage (`catalog.functions.ts` / `catalog-query.ts`) liefert pro Produkt `variantImages: Record<variant, {image, icon}>`; Anzeige über bestehenden Icon-Cache.
- `abteilungen.tsx`: State `expandedId`; Klick-Handler Zeile ~647 verzweigt nach `variants.length`; Variantenzeilen nutzen `quickAdd` mit Variante (Format „Name · Variante“ wie bestehend).
- Admin-Upload/Icon-Kompression analog zur Produktbild-Logik in `admin.tsx`.
- Neue UI-Texte (z. B. „Details“, „Variantenbild“) in de.ts + allen 15 Lokalen.
