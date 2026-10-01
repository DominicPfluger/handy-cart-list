# Preiskategorien für Produkte

## Ziel
Jedes Katalogprodukt erhält eine Preiskategorie in fünf Stufen: **billig, günstig, preiswert, teuer, exquisit**. Admins pflegen sie im Katalog-Verwalten; Nutzer sehen sie beim Produkt und können danach filtern.

## Umsetzung

### 1. Datenbank
- Neue Spalte `price_category` an `products` (Text, leer = keine Angabe).
- Erlaubte Werte: `budget`, `cheap`, `moderate`, `expensive`, `premium` (gespeichert als Schlüssel, Anzeige übersetzt).
- Keine neuen Tabellen nötig; bestehende Lese- und Schreibrechte gelten weiter.

### 2. Admin-Panel (Katalog verwalten)
- Im Produkt-Bearbeiten-Fenster: Auswahl der Preiskategorie über fünf Chips (💶 bis 💎), tippbar, abwählbar.
- Bei den Vorschlägen („✨ Vorschläge") vergibt die KI neuen Produkten direkt eine passende Preiskategorie.
- Markt-Admins dürfen die Kategorie bei Produkten ihres Markts ändern (gleiche Rechte wie bisher).

### 3. Anzeige für Nutzer
- Im Produkt-Hinzufügen-Fenster: kleine Kennzeichnung neben dem Namen, z. B. „💶 günstig".
- In der Abteilungsansicht: optionaler Filter „Preis" neben den Ernährungsfiltern — ein Tipp auf eine Stufe zeigt nur Produkte dieser Stufe (kombinierbar mit Bio/Diät/Küche).
- Auf der Einkaufsliste erscheint keine Preisangabe (Liste bleibt schlank).

### 4. Übersetzung
- Die fünf Stufen-Namen werden in alle 16 Sprachen übersetzt (de.ts + messages.json).
- Produkte ohne Kategorie zeigen nichts an.

### 5. Erstbefüllung
- Die KI schätzt für alle bestehenden Produkte eine passende Preiskategorie (z. B. Discounter-Grundware → billig/günstig, Trüffel → exquisit). Admins können danach einzeln korrigieren.

## Technische Details
- Migration: `ALTER TABLE products ADD COLUMN price_category text` + Kommentar; bestehende GRANTs/RLS bleiben.
- `src/lib/catalog.functions.ts`: Feld im Select und im Typ ergänzen.
- `src/routes/_authenticated/admin.tsx`: Chips im Produkt-Dialog, KI-Vorschlag erweitern.
- `src/components/catalog-product-dialog.tsx` + Abteilungsansicht: Anzeige + Filter.
- i18n-Schlüssel: `price.budget` … `price.premium`, `filter.price`.
- Erstbefüllung über Lovable AI Gateway in Paketen, wie bei den Produkt-Icons.

## Nicht enthalten
- Keine echten Preise/Beträge (wären markt- und ladenabhängig) — nur die Einordnung.
