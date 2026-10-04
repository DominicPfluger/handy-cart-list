# Listen-Popup: Formular „Neue Liste" nach oben

## Aktuell
Im Popup „Meine Listen" (`src/components/list-manager.tsx`) steht das Erstellen-Formular (Name-Eingabe „Neue Liste", Ladenauswahl-Dropdown, „Erstellen"-Button) unterhalb der Listen-Einträge am unteren Rand.

## Änderung
Der gesamte Formular-Block (Name-Eingabe + Ladenauswahl inkl. „+ Neuer Laden"-Formular + „Erstellen"-Button) wird direkt unter die Kopfzeile (Titel „Meine Listen" / „Fertig") verschoben und erscheint damit oberhalb der Listen-Einträge und Vorlagen. Layout und Verhalten bleiben unverändert (keine funktionalen Anpassungen, keine neuen Texte).

## Umsetzung
- In `src/components/list-manager.tsx` den JSX-Block `<div className="mt-5 flex gap-2">…</div>` (Formular, ca. Zeilen 294–351) oberhalb des `<DndContext>`-Blocks verschieben.
- Typprüfung `bunx tsgo --noEmit`, kurzer Browser-Check des Popups.
