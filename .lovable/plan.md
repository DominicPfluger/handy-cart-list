# KI-Bilder für Varianten: Optionen-Dialog und „Alle auf einmal"

Ort: Admin → Produkt bearbeiten → Abschnitt „Varianten".

## Was sich ändert

1. **Optionen-Dialog pro Variante**
   - Der Menüpunkt „KI-Bild" am Bild-Knopf einer Variante öffnet statt der einfachen Rückfrage denselben Dialog wie unter „Pflege → Produkte ohne Bild": Bildbeschreibung, Stil, Hintergrund, Ansicht, Anzahl sowie die Wahl „ein Bild (Icon daraus abgeleitet, 1 Credit)" oder „zwei unterschiedliche Bilder (2 Credits)".
   - Die Bildbeschreibung ist mit „<Variante> von <Produkt>" vorausgefüllt.

2. **„KI-Bilder für alle Varianten ohne Bild"**
   - Neuer Knopf über der Variantenliste (nur sichtbar, wenn gespeicherte Varianten ohne Bild existieren), zeigt die Anzahl.
   - Öffnet denselben Optionen-Dialog (ohne Beschreibungsfeld je Variante; Beschreibung wird pro Variante automatisch gebildet), danach Abarbeitung nacheinander mit Fortschritt „3 / 8" und Abbrechen-Knopf.
   - Fehler bei einer Variante werden gemeldet, die übrigen laufen weiter.
   - Nur bereits gespeicherte Varianten (wie beim bestehenden Bild-Knopf).

KI-Bildregeln bleiben: keine Kräuter, Zusätze oder Gefässe.

## Technische Details

- `generateVariantImage` (product-media.functions.ts) erhält optional `hint`, `opts` (style/background/view/count) und `iconOnly`; reicht sie an `generateProductImage` weiter. Bei `iconOnly` Speicherpfad unter `variant-icons/`.
- Ein Bild: wie bisher Icon clientseitig via `makeProductIcon` ableiten. Zwei Bilder: zweiter Aufruf mit `iconOnly`, Ergebnis komprimiert als `icon_path` in `product_variant_images` speichern.
- Dialog als wiederverwendbare Komponente `variant-ai-dialog.tsx` auf Basis von `AiImageOptionSelects` + `DEFAULT_AI_IMAGE_OPTS`; genutzt von `VariantImageButton` und dem neuen Sammel-Knopf in `admin.tsx`.
- Sammel-Knopf liest `admin-variant-images` (gleicher Query-Key) für die Ermittlung fehlender Bilder; Abbruch per Ref-Flag zwischen den Varianten.
- Neue i18n-Schlüssel `adm.variantAi.*` in de.ts + messages.json für alle 16 Sprachen.
- Prüfung: Typprüfung, Build, Browsertest mit einer Variante; Testbild danach wieder entfernen.
