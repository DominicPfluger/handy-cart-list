# Plan: „Alle Suchtreffer auswählen" in der Zutaten-Zuweisung

## Ziel
Im Admin-Panel (Tab „Rezepte & Küchen" → Bereich „Zutaten-Zuweisung" → „Aus Katalog") bekommt die Katalogsuche eine Checkbox, mit der alle gerade angezeigten Suchtreffer auf einmal aus- oder abgewählt werden.

## Umsetzung
- In `src/components/recipe-admin.tsx` erscheint über der Trefferliste der Suche eine Zeile mit Checkbox „Alle auswählen" (nur sichtbar, wenn ein Suchbegriff eingegeben ist und Treffer vorhanden sind).
- Haken setzen: alle gefundenen Produkte werden zur Auswahl hinzugefügt; Haken entfernen: alle gefundenen Produkte werden wieder abgewählt. Bereits vorher gewählte Produkte ausserhalb der Suche bleiben unberührt.
- Die Checkbox zeigt einen Zwischenzustand (Strich), wenn nur ein Teil der Treffer ausgewählt ist — gleiches Verhalten wie bei den bestehenden Kategorie-Checkboxen.
- Danach wie gehabt mit „Übernehmen" die Auswahl speichern.

## Technische Details
- Datei: `src/components/recipe-admin.tsx` (Picker-Bereich, ~Zeile 800–830).
- Neue Hilfsfunktion analog zu `toggleDeptPick`: fügt/entfernt alle IDs aus `pickerMatches` in `pickerSel`.
- Bestehende Übersetzungen `adm.selectAll` / `adm.selectNone` werden wiederverwendet — keine neuen Texte nötig.
- Keine Datenbankänderung, keine KI-Aufrufe, keine Credits.

## Prüfung
- Typprüfung und Build.
- Browser-Test im Admin-Panel: Suche eingeben, Checkbox „Alle auswählen" anklicken, Zähler bei „Übernehmen" prüfen, wieder abwählen.
