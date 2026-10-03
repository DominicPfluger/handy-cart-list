# Rezept-Admin: „Aus Katalog“ neben Suche, KI-Vorschläge entfernen

## Ziel
In der Zutaten-Zuweisung (Admin → Rezept-Generator) wird der geöffnete „Aus Katalog“-Bereich kompakter, und der Knopf „✨ Passende Produkte vorschlagen“ entfällt komplett.

## Änderungen

### 1. „Aus Katalog“ links neben dem Suchfeld
- Im geöffneten Katalog-Bereich steht die Titelzeile (Zurück-Pfeil + „Aus Katalog“ bzw. der gewählte Kategoriepfad) neu in **derselben Zeile wie das Suchfeld**: links die Beschriftung (mit Zurück-Pfeil), rechts das Suchfeld, das den restlichen Platz einnimmt.
- Verhalten bleibt gleich: Suchen, Kategorien durchblättern, Abhaken, „Übernehmen/Abbrechen“ unverändert.

### 2. „Passende Produkte vorschlagen“ entfernen
- Der ✨-Knopf unter jeder Zutaten-Kategorie wird entfernt.
- Der gesamte zugehörige Ablauf wird entfernt: Bestätigungsdialog, Vorschlagsliste zum Abhaken, „Übernehmen“ der Vorschläge.
- Die nicht mehr benutzte Server-Funktion `suggestRecipeStepProducts` in `src/lib/admin.functions.ts` wird ebenfalls entfernt (keine KI-Aufrufe mehr aus diesem Bereich, keine Credits).
- Ungenutzte Texte (`adm.stepSuggest`, `adm.stepSuggestConfirm`, `adm.stepSuggestDone`) werden in allen 16 Sprachen entfernt.

## Technische Details
- Datei: `src/components/recipe-admin.tsx` (Picker-Kopfzeile + Suchfeld in eine Flex-Zeile; Entfernen von `startSuggest`, `applySuggest`, `suggestStep`/`suggestPicks`-State, Vorschlags-Panel, ✨-Knopf, Import/ServerFn).
- Datei: `src/lib/admin.functions.ts` (Funktion `suggestRecipeStepProducts` löschen).
- Dateien: `src/i18n/de.ts` + `src/i18n/messages.json` (drei ungenutzte Schlüssel entfernen).
- Keine Datenbankänderung, keine neuen Texte.
- Prüfung: Typprüfung, Build, Browser-Test (Katalog-Bereich öffnen, Suche nutzen, ✨-Knopf weg).
