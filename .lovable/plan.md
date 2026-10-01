# Rezept-Ersteller: Zutaten-Auswahl im Admin-Panel per Checkbox

## Ziel

Die Zutaten, die im Rezept-Ersteller pro Schritt zur Auswahl stehen (z. B. „Proteinquelle", „Stärkebeilage"), werden nicht mehr fest im Code hinterlegt, sondern im Admin-Panel verwaltet: Admins wählen pro Rezept-Kategorie und Schritt die erlaubten Produkte per Checkbox aus dem Katalog aus.

## Umsetzung

### 1. Datenbank (Migration)

- Neue Tabelle `recipe_ingredients`:
  - `template_id` (Text, z. B. `menu`, `pizza`)
  - `step_key` (Text, z. B. `protein`, `starch`)
  - `product_id` (Verweis auf das Produkt)
  - `sort_order` (Reihenfolge der Anzeige)
  - Eindeutig pro Kombination aus Vorlage, Schritt und Produkt
- Zugriffsregeln: Alle dürfen lesen (der Rezept-Ersteller ist öffentlich), nur Admins dürfen ändern.
- Erstbefüllung: Die bisher im Code hinterlegten Zutatenlisten werden als Startwerte in die Tabelle übernommen, damit sich für Nutzer nichts ändert.

### 2. Admin-Panel: neuer Bereich „🍽️ Rezept-Zutaten"

- Auswahl der Rezept-Kategorie (Müsli, Smoothie, Salat, Pizza, Pfanne, Menü, Dessert).
- Darunter die Schritte der Kategorie (z. B. Menü: Proteinquelle, Stärkebeilage, Gemüsebeilage, Sauce).
- Pro Schritt eine durchsuchbare Produktliste mit **Checkboxen**: Häkchen = Produkt erscheint in diesem Schritt im Rezept-Ersteller.
- Änderungen werden sofort gespeichert (Server-Funktionen `saveRecipeIngredient` / `removeRecipeIngredient`, Admin-geschützt wie die übrigen Katalog-Funktionen).
- Reihenfolge innerhalb eines Schritts per Drag & Drop bzw. ▲▼ wie im restlichen Admin-Panel.

### 3. Rezept-Ersteller lädt aus dem Backend

- `recipe-builder.tsx` lädt die Zutaten je Vorlage/Schritt aus der Datenbank (mit dem Katalog zusammen), statt aus `recipe-templates.ts`.
- Fallback: Ist für eine Vorlage/Schritt-Kombination nichts in der Datenbank, greifen die bisherigen Standardlisten aus dem Code (so bleibt die Seite auch bei leerer Tabelle nutzbar).
- Die „Beliebten Rezept-Kreationen" bleiben vorerst im Code; sie zeigen nur Kombinationen, deren Zutaten weiterhin zugewiesen sind.

### 4. Technische Details

- Migration: `CREATE TABLE public.recipe_ingredients` + GRANTs (SELECT für alle, Schreiben nur Admin-Rolle) + RLS-Policies, analog zu `product_cuisines`.
- Neue Server-Funktionen in `src/lib/admin.functions.ts`; Laden in `src/lib/catalog.functions.ts` bzw. eigener Abfrage im Rezept-Builder.
- Neue Admin-Komponente `src/components/recipe-admin.tsx`, eingebunden in `src/routes/_authenticated/admin.tsx`.
- Schritt-Namen (Proteinquelle etc.) bleiben übersetzt über die vorhandenen i18n-Schlüssel; in der Datenbank wird nur die Zuordnung Produkt ↔ Schritt gespeichert.

## Nicht Teil dieser Änderung

- Keine Änderung an gespeicherten Rezepten der Nutzer.
- Keine KI-Vorschläge für Rezept-Zutaten (kann später ergänzt werden).
