# Eigene Zutaten-Oberkategorien je Rezept-Art

## Ziel
Jede Rezept-Art (Smoothie, Pizza, Sandwich, Salat …) hat ihre eigenen Oberkategorien. Wenn du eine Oberkategorie bei Pizza umbenennst, löschst oder neu anlegst, ändert sich bei den anderen Rezept-Arten nichts.

## Was sich ändert
1. **Bestehende Kategorien übernehmen:** Jede heutige Oberkategorie wird für jede Rezept-Art kopiert, in der sie schon Zutaten hat. Beispiel: Nutzen Pizza und Salat „Käse“, bekommen beide ihr eigenes „Käse“. Die Zutaten bleiben dort, wo sie jetzt sind. Oberkategorien, die keine Rezept-Art nutzt, werden gelöscht.
2. **Admin-Panel, Bereich Rezept-Verwaltung:** Die Liste „Oberkategorien“ zeigt nur die Oberkategorien der gerade gewählten Rezept-Art. Dort kannst du sie anlegen, umbenennen, mit einem Emoji versehen, sortieren und löschen.
3. **Admin-Panel, Bereich Zutaten-Zuweisung:** In der Auswahl „Kategorie“ einer Zutat stehen nur die Oberkategorien der gewählten Rezept-Art.
4. **Rezept-Generator:** Für dich ändert sich nichts. Jede Rezept-Art zeigt ihre eigenen grauen Kategorien.
5. **Übersetzungen:** Neue Namen werden wie bisher automatisch in alle Sprachen übersetzt.

## Technische Details
- Migration: `recipe_groups` erhält `template_id text` (Verweis auf `recipe_templates`, `on delete cascade`) und einen Index darauf.
- Daten (run_sql): Für jede Kombination aus Gruppe und `template_id` in `recipe_ingredients` wird eine Kopie mit dieser `template_id` angelegt. Dabei werden auch Name, Emoji, Sortierung und Übersetzungen (`catalog_translations`, entity_type `recipe_group`) kopiert. Danach wird `recipe_ingredients.group_id` auf die Kopie umgehängt. Zum Schluss werden die alten Gruppen ohne `template_id` gelöscht. Anschliessend wird `template_id` auf NOT NULL gesetzt.
- `catalog.functions.ts` / `catalog-query.ts`: `templateId` kommt in den Typ `RecipeGroup`.
- `saveRecipeGroup` (admin.functions.ts) nimmt `templateId` entgegen.
- `recipe-admin.tsx`: Die Gruppen werden in der Verwaltung und in der Zuweisung nach der gewählten Vorlage gefiltert. Neue Gruppen bekommen die gewählte Vorlage.
- `recipe-builder.tsx`: Er filtert zusätzlich nach `templateId`. Das dient als Absicherung, weil die Zuordnung schon heute über die Zutaten erfolgt.
- Prüfung: Typcheck, Build und ein Browser-Test. Dabei wird bei Pizza eine Oberkategorie umbenannt und geprüft, dass Salat unverändert bleibt.
