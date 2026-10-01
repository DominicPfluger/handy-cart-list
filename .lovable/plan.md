# Rezept-Ersteller: flache Zutatenauswahl ohne Unterkategorien

## Was sich ändert

**Rezept-Ersteller (App)**
- Pro Schritt (z. B. „Stärkebeilage") erscheinen die verfügbaren Zutaten wieder direkt als auswählbare Chips — keine Ober-/Unterkategorie-Schaltflächen mehr zum Aufklappen.
- Reihenfolge = die im Admin-Panel festgelegte Reihenfolge (▲▼).
- Limits, Mehrfachauswahl, „beliebig viele" und beliebte Kombinationen bleiben unverändert.

**Admin-Panel → „Rezept-Zutaten"**
- Der Bereich „Rezept-Kategorien" (eigene Ober-/Unterkategorien anlegen) und die Kategorie-Auswahl neben jeder Zutat bzw. die „Ziel-Kategorie" im Katalog-Dialog werden entfernt.
- Die Verwaltung der verfügbaren Artikel bleibt per Checkbox:
  - „+ Aus Katalog": Katalog-Kategorie öffnen, einzelne Produkte anhaken,
  - Checkbox an jeder Kategorie/Unterkategorie wählt alle enthaltenen Produkte auf einmal (inkl. Teilauswahl-Anzeige),
  - „Alle / Keine auswählen", „Übernehmen", Suche, ▲▼, Entfernen bleiben.
- Zugeordnete Zutaten werden als einfache Liste pro Schritt angezeigt.

## Technische Details
- `src/components/recipe-builder.tsx`: Gruppierungslogik (groupById, groupOfIng, Root/Sub-Gruppen-Rendering ~Z. 375–420) entfernen; Zutaten flach nach `sortOrder` rendern. `groupLabel/groupEmoji` beim Hinzufügen zur Einkaufsliste wieder aus der Katalog-Abteilung des Produkts beziehen (wie vor der Gruppenfunktion).
- `src/components/recipe-admin.tsx`: Gruppen-UI, `saveRecipeGroup`/`deleteRecipeGroup`-Aufrufe, Gruppen-Select und `pickerGroup` entfernen; Insert ohne `group_id`.
- Datenbank bleibt unverändert (Tabelle `recipe_groups` und Spalte `group_id` werden nur nicht mehr genutzt — keine Datenlöschung). Optional später aufräumen.
- Ungenutzte i18n-Keys (`adm.recipeGroup*`, `rk.otherGroup`) dürfen bleiben.
- Project-knowledge-Regel zu `recipe_groups` in AGENTS.md entsprechend ersetzen.
