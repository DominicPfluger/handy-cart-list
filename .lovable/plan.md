# Massen-Zuordnung von Rezept-Kategorien in der Zutaten-Zuweisung

Im Admin-Panel (Tab „Rezepte & Küchen" → „Zutaten-Zuweisung") können mehrere zugewiesene Zutaten gleichzeitig einer Rezept-Kategorie (Oberkategorie) zugeordnet werden — statt jede Zeile einzeln über ihr Auswahlfeld zu ändern.

## Umsetzung

**Datei: `src/components/recipe-admin.tsx`**

1. **Auswahl-Checkbox pro Zeile:** Jede zugewiesene Zutat bekommt eine eigene Auswahl-Checkbox (neu, zusätzlich zur bestehenden Zuweisungs-Checkbox). Zustand: `selRows: Set<string>` (Zeilen-IDs), wird beim Vorlagenwechsel zurückgesetzt.

2. **„Alle" im Bereichs-Kopf:** Pro Zutatenbereich eine Checkbox, die alle Zeilen dieses Bereichs auswählt/abwählt (mit Zwischenzustand bei Teilauswahl).

3. **Aktionsleiste bei Auswahl:** Sobald mindestens eine Zeile gewählt ist, erscheint eine Leiste mit:
   - Zähler („3 ausgewählt")
   - Auswahlfeld mit den Rezept-Kategorien der gewählten Vorlage (inkl. „— keine Kategorie")
   - Knopf „Zuweisen": setzt `group_id` für alle gewählten Zeilen in einer Datenbank-Abfrage (`update … in (ids)`)
   - Knopf „Auswahl aufheben"

4. **Bestehendes bleibt:** Das Einzel-Auswahlfeld pro Zeile, Drag & Drop, ▲/▼-Sortierung und die Zuweisungs-Checkbox bleiben unverändert.

5. **Übersetzungen:** Neue Texte (`adm.bulkAssign`, `adm.selectedCount` o. ä.) in `de.ts` und allen 15 weiteren Sprachen.

## Technisch

- Kein Datenbank-Schema-Change; nutzt das vorhandene `group_id`-Feld in `recipe_ingredients`.
- Keine KI-Aufrufe, keine Credits.
- Danach: Typprüfung, Build, kurzer Browser-Test (mehrere Zeilen wählen → Kategorie zuweisen → prüfen, dass alle Zeilen die neue Kategorie zeigen).
