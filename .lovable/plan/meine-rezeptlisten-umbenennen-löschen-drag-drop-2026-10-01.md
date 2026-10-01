# Meine Rezeptlisten: Umbenennen, Löschen, Drag & Drop

## Was der Nutzer bekommt
1. **Umbenennen per Tippen** – Tippen auf den Rezeptnamen macht ihn direkt bearbeitbar (Eingabefeld). Enter oder Wegtippen speichert, Esc bricht ab.
   - Zum Öffnen des Rezepts gibt es neu links das Rezept-Symbol (Tippen darauf öffnet es im Generator).
   - Bei eigenen Rezepten wird der Titel überall geändert (auch auf der geteilten Seite). Bei Rezepten anderer Leute ist der neue Name nur in deiner eigenen Liste sichtbar.
2. **Löschen** – das bestehende ✕ bleibt; neu mit „Rückgängig“-Hinweis, damit nichts versehentlich verloren geht.
3. **Drag & Drop** – jedes Rezept bekommt einen Griff (⋮⋮). Damit lässt es sich innerhalb eines Ordners verschieben und in einen anderen Ordner ziehen (auch in einen leeren). Die Reihenfolge bleibt gespeichert, auf allen Geräten.
   - Das bisherige Auswahlfeld „Verschieben“ fällt weg (ersetzt durch Drag & Drop).
4. Neue Texte in allen 16 Sprachen.

## Technische Details
- Migration: `recipe_saves` erhält `custom_title text` (persönlicher Name) und `sort_order integer default 0`. Die bestehende Regel „nur eigene Einträge“ bleibt.
- Umbenennen: eigenes Rezept → `recipes.title` aktualisieren; fremdes → `recipe_saves.custom_title`. Anzeige: `custom_title ?? title`.
- Laden in `use-saved-recipes.ts` sortiert nach `sort_order`, dann Datum; neue Funktionen `renameSaved`, `reorderSaved(folderId, orderedSaveIds)` (setzt folder_id + sort_order), optimistische Anzeige.
- Löschen mit sonner-Toast „Rückgängig“ (stellt den Eintrag mit Ordner/Position wieder her).
- Drag & Drop mit dem bereits genutzten @dnd-kit (DndContext über alle Ordner, ein SortableContext je Ordner, Ablegen auf leeren Ordner möglich, Touch-Sensor mit kurzer Verzögerung fürs Handy).
- Änderungen in `recipe-builder.tsx` (Bereich „Meine Rezeptlisten“), i18n in de.ts + messages.json.
