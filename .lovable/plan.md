# KI-Sammel-Bilderstellung: Dialog mit ergänzenden Angaben

## Was sich ändert
Der Knopf „KI-Bilder für Kategorie erzeugen" im Admin-Katalog öffnet statt der einfachen Bestätigungsfrage einen Dialog:

- Info-Zeile: „Für N Produkte ohne Bild KI-Bilder erzeugen" (bzw. „alle N Produkte neu erzeugen", wenn alle schon ein Bild haben)
- Auswahl: **Nur fehlende Bilder** / **Alle Produkte neu erzeugen**
- Freitextfeld „Ergänzende Angaben" (max. 300 Zeichen), z. B. „auf Holzbrett, warmes Licht"
- Dieselben KI-Bild-Optionen wie beim Einzelbild (Stil, Hintergrund, Ansicht, Einzeln/Gruppe)
- Hinweis zum Credit-Verbrauch, Knöpfe „Erzeugen" und „Abbrechen"

Die Angaben gelten für alle Bilder dieses Durchlaufs. Fortschrittsanzeige und Icon-Erstellung bleiben wie bisher. Die gespeicherten Bildregeln (keine Kräuter, Zusätze, Gefässe) gelten weiterhin.

## Technische Details
- `catalog-tile-editor.tsx`: `generateAllImages` öffnet neuen State `genAllDlg`; Dialog nutzt `AiImageOptionSelects` + `DEFAULT_AI_IMAGE_OPTS` aus `ai-image-options.tsx`; beim Start werden `hint` und `opts` an `generateImageFor` übergeben (Server-Funktion unterstützt beides bereits — keine Server-/DB-Änderung).
- i18n: `tile.genAllTitle`, `tile.genAllMissing`, `tile.genAllEverything`, `tile.genAllHint`, `tile.genAllStart` in de.ts + 15 Sprachen.
