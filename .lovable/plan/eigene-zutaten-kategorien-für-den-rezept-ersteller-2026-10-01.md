# Eigene Zutaten-Kategorien für den Rezept-Ersteller

## Ziel
Der Rezept-Ersteller gruppiert die Zutaten nicht mehr nach den Abteilungs-Kategorien des Katalogs. Stattdessen gibt es eigene Rezept-Kategorien, die du im Admin-Panel selbst anlegst und verwaltest.

## Was du bekommst

**Admin-Panel → „Rezept-Zutaten" → neuer Bereich „Rezept-Kategorien"**
- Kategorien anlegen, umbenennen (mit Emoji), sortieren (▲▼ und Drag & Drop) und löschen (mit Bestätigung).
- Zwei Ebenen: Oberkategorie (z. B. „Kohlenhydrate") und darunter Unterkategorien (z. B. „Reis", „Pasta").
- Die Kategorien gelten für alle Rezept-Arten (Müsli, Salat, Pfanne …). So pflegst du sie nur einmal.
- Neue Namen werden automatisch in alle 15 Sprachen übersetzt. Manuelle Übersetzungen bleiben geschützt.

**Zutaten zuordnen**
- Bei jeder Zutat in einem Rezept-Schritt gibt es eine Auswahl „Kategorie", in der du die Rezept-Kategorie festlegst.
- Beim Hinzufügen über „+ Aus Katalog" kannst du eine Ziel-Kategorie wählen, die dann für alle angehakten Produkte gilt.
- Zutaten ohne Kategorie erscheinen im Rezept-Ersteller unter „Weitere".

**Rezept-Ersteller (für Nutzer)**
- Die Ablauf bleibt gleich: Oberkategorie antippen → Unterkategorien → Zutaten mit Checkbox. Angezeigt werden aber die eigenen Rezept-Kategorien statt der Abteilungen.
- Leere Kategorien werden ausgeblendet. Es werden weiterhin nur die Zutaten gezeigt, die für den Schritt voreingestellt sind.

**Start-Befüllung**
- Ich lege einige Startkategorien an, z. B. Kohlenhydrate (Reis, Pasta, Kartoffeln), Proteine (Fleisch, Fisch, Vegetarisch), Gemüse, Früchte, Saucen, Gewürze, Milchprodukte und Toppings. Die bestehenden Zutaten ordne ich passend zu, und du kannst danach alles anpassen.

## Technische Details
- Neue Tabelle `recipe_groups`: id, parent_id (selbstreferenzierend, null = Oberkategorie), name, emoji, sort_order, Zeitstempel und Trigger für updated_at. Grants für anon/authenticated (Lesen) und service_role. RLS: öffentlich lesbar, Schreiben nur mit `has_role(auth.uid(),'admin')`.
- `recipe_ingredients` erhält `group_id uuid null` mit Verweis auf `recipe_groups` (on delete set null).
- Für den CHECK auf `catalog_translations.entity_type` kommt `recipe_group` dazu. Die Übersetzung läuft über den bestehenden Pfad in `translate.server.ts`.
- `catalog.functions.ts` und `catalog-query.ts` laden `recipeGroups`, und `groupId` kommt in `RecipeIngredient` dazu.
- `recipe-builder.tsx`: Die Gruppierung läuft über `groupId` und `parent_id` statt über `rootDeptOf`. Fallback ist „Weitere".
- `recipe-admin.tsx`: Neu sind die Gruppen-Verwaltung, eine Gruppen-Auswahl pro Zutat und eine Ziel-Gruppe im Picker.
- Neue i18n-Keys kommen in `de.ts` und alle 15 Locales.
- Die Startkategorien und ihre Zuordnung werden per SQL eingefügt.
