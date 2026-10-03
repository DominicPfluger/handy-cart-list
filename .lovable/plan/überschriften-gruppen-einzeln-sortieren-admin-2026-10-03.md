# Überschriften-Gruppen einzeln sortieren (Admin)

## Ziel
Im Admin-Bereich kann heute nur die ganze Kategorie nach den Sortier-Kriterien (Beliebtheit, Marktrelevanz, Preis, Alphabetisch, Ähnlichkeit) sortiert werden — Überschriften-Gruppen bleiben dabei erhalten. Neu soll jede Überschrift einen eigenen Sortieren-Knopf bekommen, der nur die Einträge unterhalb dieser Überschrift sortiert.

## Umsetzung

1. **Knopf in der Überschriften-Zeile** (`src/components/admin/catalog-tile-editor.tsx`)
   - Neuer kleiner „↕“-Knopf direkt in jeder Überschriften-Zeile (neben den vorhandenen Bearbeiten-/Löschen-Symbolen), nur im Bearbeiten-Modus sichtbar.
   - Neuer Callback `onSortHeading?: (headingId: string) => void` in den Props.

2. **Sortierlogik pro Gruppe** (`src/routes/_authenticated/admin.tsx`)
   - Neue Funktion `sortHeadingGroup(headingId)`:
     - Findet die Gruppe: alle Produkte ab dem Anker-Produkt der Überschrift bis zur nächsten Überschrift (bzw. Listenende), Alias-Einträge bleiben an ihrem Stammprodukt.
     - Nutzt das aktuell im Sortier-Dropdown gewählte Kriterium (`sortBy`): bei „Alphabetisch" lokale Sortierung, sonst die bestehende KI-Rangfolge (`rank`-Serverfunktion) mit Pfad und ggf. Markt.
     - Bestätigungsdialog wie bei der Gesamt-Sortierung (`adm.sortConfirm`).
     - Speichert die neue Reihenfolge per `saveOrder` und hängt die Überschrift an das neue erste Produkt ihrer Gruppe (`saveH`), falls sich dieses geändert hat.
   - `sortProducts` wird refaktoriert, sodass beide Funktionen denselben Sortier-Kern teilen (keine doppelte Logik).

3. **Übersetzungen** (`src/i18n/de.ts` + `messages.json`, alle 16 Sprachen)
   - `adm.sortGroup` = „Gruppe sortieren" (Tooltip/aria-label des Knopfs).

## Technische Details
- Keine Datenbankänderung nötig; Reihenfolge bleibt `products.sort_order`, Anker bleibt `product_headings.before_product_id`.
- KI-Sortierung verbraucht Credits — daher Bestätigungsdialog wie bisher.
- Verifikation: Typecheck/Build + Browser-Test im Admin-Panel (Kategorie mit Überschriften öffnen, Gruppe alphabetisch sortieren, Reihenfolge und Anker prüfen).
