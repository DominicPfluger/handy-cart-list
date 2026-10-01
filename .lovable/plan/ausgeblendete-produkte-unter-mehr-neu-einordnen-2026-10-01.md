# Ausgeblendete Produkte unter „Mehr" neu einordnen

## Ziel
Unter „Mehr" erscheint der Bereich „Ausgeblendete Produkte" neu zwischen „Erinnerungen" und „Nachhaltig einkaufen" statt ganz unten auf der Seite.

## Aktueller Stand
In `src/routes/mehr.tsx` stehen die Einstellungs-Zeilen „Erinnerungen" und „Nachhaltig einkaufen" gemeinsam in einer Liste (Zeilen 255–272). Die Bereiche „Ausgeblendete Kategorien" und „Ausgeblendete Produkte" folgen erst danach als eigene Abschnitte ganz unten (Zeilen 275–303).

## Umsetzung
- Die Zeilen-Liste aufteilen: zuerst „Erinnerungen", dann der Bereich „Ausgeblendete Produkte" (nur sichtbar, wenn es ausgeblendete Produkte gibt), danach „Nachhaltig einkaufen".
- „Ausgeblendete Kategorien" bleibt als eigener Abschnitt darunter (wie bisher).
- Keine neuen Texte nötig — bestehende Übersetzungen (`more.hiddenProducts`, `more.hiddenProductsHint`, `more.restore`) werden wiederverwendet.
- Optik bleibt gleich: gleiche Karten-/Zeilen-Optik wie bisher.

## Technische Details
- Einzige geänderte Datei: `src/routes/mehr.tsx` (Umordnen des Markups, keine Logik-Änderung).
- Verhalten unverändert: Wiederherstellen-Button, Sichtbarkeitsbedingung (`hiddenProducts.length > 0`).
- Danach: Build-Prüfung und Sichtkontrolle in der Vorschau.
