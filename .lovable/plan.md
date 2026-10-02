# Rezept-Generator: nur noch eine Gruppenebene

## Ziel
Die Untergruppen (z. B. Pasta, Reis, Kartoffeln unter Kohlenhydrate; Fleisch, Fisch, Vegetarisch unter Proteine) fallen weg. Es bleiben nur die Hauptgruppen. Zutaten ordnest du im Admin wie früher von Hand einer Hauptgruppe zu. Im Rezept-Generator haben alle Hauptgruppen ein Icon.

## Änderungen
1. **Bestehende Zuordnungen übernehmen:** Zutaten, die heute einer Untergruppe zugeordnet sind, kommen automatisch in deren Hauptgruppe (Pasta → Kohlenhydrate, Fleisch → Proteine usw.). Danach werden die 7 Untergruppen gelöscht. Es gehen keine Zuordnungen verloren.
2. **Rezept-Generator:** Pro Schritt erscheinen nur die Hauptgruppen als aufklappbare Zeilen, jede mit ihrem Icon vor dem Namen, auch die Sammelgruppe „Weitere“ (🧺). Schritte ohne zugeordnete Gruppen zeigen weiterhin die flache Liste.
3. **Admin (Rezepte & Küchen):** Die Gruppenverwaltung zeigt eine flache Liste: anlegen, umbenennen, Icon setzen, löschen und per Drag & Drop sortieren. Die Auswahl einer übergeordneten Gruppe entfällt. Die Gruppen-Auswahl pro Zutat bietet nur noch Hauptgruppen.

## Technische Details
- Migration: `UPDATE recipe_ingredients SET group_id = parent_id` für alle Untergruppen, danach `DELETE FROM recipe_groups WHERE parent_id IS NOT NULL`. Die Spalte `parent_id` bleibt vorerst bestehen, wird aber nicht mehr verwendet.
- `recipe-builder.tsx`: Gruppen filtern auf `parentId == null`. Emoji-Fallback 🧺 für „other“.
- `recipe-admin.tsx`: Eltern-Select und verschachtelte Darstellung entfernen; Sortierung über alle Gruppen.
- Prüfung per Playwright: Generator auf 390 px und 1280 px, Admin-Zuweisung speichern.
