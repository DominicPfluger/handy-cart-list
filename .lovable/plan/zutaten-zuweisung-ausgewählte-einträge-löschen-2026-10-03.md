# Zutaten-Zuweisung: ausgewählte Einträge löschen

## Ziel
Im Admin-Panel (Tab „Rezepte & Küchen" → Bereich „Zutaten-Zuweisung") können mehrere zugewiesene Zutaten gleichzeitig aus dem Zutatenbereich entfernt werden — analog zur bestehenden Massen-Kategorie-Zuweisung.

## Umsetzung

**Datei: `src/components/recipe-admin.tsx`**

1. **Knopf „Löschen" in der Aktionsleiste:** Die bestehende Leiste bei Auswahl (Zähler, Kategorie-Auswahl, „Zuweisen", „Auswahl aufheben") erhält zusätzlich einen roten Knopf „Löschen" (destructive Variante). Er erscheint, sobald mindestens eine Zeile per Auswahl-Checkbox gewählt ist.

2. **Ablauf beim Klick:**
   - Bestätigungsdialog (window.confirm) mit Anzahl der zu entfernenden Zutaten — gleiche Confirm-Muster wie beim Löschen von Vorlagen/Schritten.
   - Nach Bestätigung: ein einziger Löschaufruf `delete().in("id", ids)` auf `recipe_ingredients` (gleiche Ebene wie `bulkAssignGroup`).
   - Danach Auswahl und Eingaben zurücksetzen; die vorhandene `run`-Hilfsfunktion aktualisiert die Liste automatisch.

3. **Bestehendes bleibt:** Einzelne Zuweisungen entfernen (Zuweisungs-Checkbox), Drag & Drop, ▲/▼-Sortierung, Massen-Kategorie-Zuweisung und „Alle auswählen" bleiben unverändert.

4. **Übersetzungen:** Neue Texte `adm.bulkDelete` („Löschen") und `adm.bulkDeleteConfirm` („{n} Zutaten aus dem Bereich entfernen?") in `de.ts` und allen 15 weiteren Sprachen in `messages.json`.

## Technische Details
- Kein Datenbank-Schema-Change; nutzt das vorhandene Löschen aus `recipe_ingredients` (bereits per RLS admin-geschützt).
- Keine KI-Aufrufe, keine Credits.
- Danach: Typprüfung, Build, kurzer Browser-Test (mehrere Zeilen wählen → Löschen → Bestätigen → Zeilen verschwinden, Zähler im Bereichs-Kopf aktualisiert sich).
