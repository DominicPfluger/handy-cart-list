# Rezept-Admin: ganze Unterkategorien per Checkbox übernehmen

## Ziel
Im Admin-Panel unter „Rezept-Zutaten" → „+ Aus Katalog" kann man neu eine ganze Unterkategorie per Checkbox auswählen. Alle Produkte dieser Unterkategorie werden dann in einem Schritt übernommen (bzw. entfernt), ohne sie einzeln anklicken zu müssen.

## Aktueller Stand
Der Katalog-Picker in `src/components/recipe-admin.tsx` zeigt Unterkategorien als Schaltflächen, die man erst öffnen muss; darin kann man Produkte einzeln abhaken oder über „Alle auswählen" alle Produkte der geöffneten Kategorie markieren. Eine Auswahl direkt auf Unterkategorie-Ebene gibt es nicht.

## Umsetzung
- Jede Unterkategorie-Zeile im Picker erhält links eine **Checkbox**:
  - Haken setzen → alle Produkte dieser Unterkategorie (inkl. Produkte in tieferen Unter-Unterkategorien) werden zur Auswahl hinzugefügt.
  - Haken entfernen → alle Produkte dieser Unterkategorie werden aus der Auswahl entfernt.
  - Teilauswahl (nur einige Produkte der Kategorie sind gewählt) wird als „teilweise markiert" dargestellt.
- Der Kategoriename bleibt weiterhin klickbar und öffnet die Unterkategorie wie bisher (für Einzelauswahl).
- „Übernehmen (X)" funktioniert unverändert: neu gewählte Produkte werden ans Ende des Schritts angehängt, abgewählte entfernt.
- Keine neuen Texte nötig (Checkboxen sind beschriftungslos; vorhandene Tasten bleiben).

## Technische Details
- Einzige geänderte Datei: `src/components/recipe-admin.tsx`.
- Neue Hilfsfunktion `deptProductIds(deptId)`: sammelt rekursiv alle Produkt-IDs einer Kategorie inkl. Unterkategorien (über `depts`/`prods`).
- Unterkategorie-Zeile wird von reiner Schaltfläche zu Zeile mit Checkbox + klickbarem Namen; `togglePick` bleibt für Einzelprodukte.
- Danach: Build-Prüfung und Sichtkontrolle in der Vorschau (Admin → Rezept-Zutaten → Pfannengericht → + Aus Katalog).
