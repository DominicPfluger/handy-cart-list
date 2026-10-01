# Rezept-Ersteller: flache Zutatenauswahl ohne Unterkategorien

## Was sich ändert

**Rezept-Ersteller (App)**
- Pro Schritt (z. B. „Stärkebeilage") erscheinen die verfügbaren Zutaten wieder direkt als auswählbare Chips — keine Ober-/Unterkategorie-Schaltflächen mehr.
- Alle Zutaten werden geladen, aber zunächst höchstens **20** angezeigt. Darunter: „Alle X anzeigen ▾" klappt den Rest aus, „Weniger ▴" klappt wieder ein. Bereits gewählte Zutaten bleiben immer sichtbar.
- Reihenfolge = die im Admin-Panel festgelegte Reihenfolge (▲▼ bzw. Sortierung) — die wichtigsten stehen damit oben in den ersten 20.
- Limits, Mehrfachauswahl, „beliebig viele" und beliebte Kombinationen bleiben unverändert.

**Admin-Panel → „Rezept-Zutaten"**
- Der Bereich „Rezept-Kategorien" (eigene Ober-/Unterkategorien anlegen) und die Kategorie-Auswahl neben jeder Zutat bzw. die „Ziel-Kategorie" im Katalog-Dialog werden entfernt.
- Die Verwaltung der verfügbaren Artikel bleibt per Checkbox:
  - „+ Aus Katalog": Katalog-Kategorie öffnen, einzelne Produkte anhaken,
  - Checkbox an jeder Kategorie/Unterkategorie wählt alle enthaltenen Produkte auf einmal (inkl. Teilauswahl-Anzeige),
  - „Alle / Keine auswählen", „Übernehmen", Suche, ▲▼, Entfernen bleiben.
- Zugeordnete Zutaten werden als einfache Liste pro Schritt angezeigt.
- Neu pro Schritt: Auswahl **„Sortieren nach…"** mit „Beliebtheit" (wie häufig die Zutat allgemein für dieses Gericht verwendet wird) und „Relevanz" (wie gut sie zum Schritt und zur Rezept-Kategorie passt). Die KI schlägt die Reihenfolge vor, nach Bestätigung wird sie für alle Nutzer gespeichert. Danach weiterhin mit ▲▼ feinjustierbar.

## Technische Details
- `src/components/recipe-builder.tsx`: Gruppierungslogik (groupById, groupOfIng, Root/Sub-Gruppen-Rendering ~Z. 375–420) entfernen; Zutaten flach nach `sortOrder` rendern; State `expanded[stepKey]`, Limit 20 (gewählte immer zusätzlich zeigen). `groupLabel/groupEmoji` beim Hinzufügen zur Einkaufsliste aus der Katalog-Abteilung des Produkts beziehen.
- Neue Server-Funktion `sortRecipeIngredients` in `admin.functions.ts` (Admin-Check, Lovable AI, Kriterium `popularity|relevance`, Eingabe: Rezept-Vorlage, Schritt-Titel, Produktnamen) → liefert geordnete IDs; Admin schreibt `sort_order` per Browser-Client (RLS `has_role`).
- i18n: neue Keys (`rk.showAll`, `rk.showLess`, `adm.recipeSort*`) in de.ts + 15 Locales.
- `src/components/recipe-admin.tsx`: Gruppen-UI, `saveRecipeGroup`/`deleteRecipeGroup`-Aufrufe, Gruppen-Select und `pickerGroup` entfernen; Insert ohne `group_id`.
- Datenbank bleibt unverändert (Tabelle `recipe_groups` und Spalte `group_id` werden nur nicht mehr genutzt — keine Datenlöschung). Optional später aufräumen.
- Ungenutzte i18n-Keys (`adm.recipeGroup*`, `rk.otherGroup`) dürfen bleiben.
- Project-knowledge-Regel zu `recipe_groups` in AGENTS.md entsprechend ersetzen.
