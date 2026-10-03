# Aktionsleiste pro Zutatenbereich anzeigen

## Ausgangslage
Im Admin-Panel („Rezepte & Küchen" → „Zutaten-Zuweisung") erscheint die Leiste mit Kategorie-Zuweisung, Löschen und Auswahl aufheben derzeit nur **einmal global** über allen Zutatenbereichen, sobald irgendwo Zeilen ausgewählt sind.

## Änderung (`src/components/recipe-admin.tsx`)
Die Leiste wird zusätzlich **oberhalb jedes Zutatenbereichs** angezeigt:

- Pro Zutatenbereich (z. B. „Teig", „Sauce") erscheint die Leiste direkt unter dem Bereichs-Aufklappkopf und über der Zeile „Alle auswählen", aber **nur wenn in diesem Bereich Zeilen ausgewählt sind**.
- Die Leiste eines Bereichs zeigt nur die Anzahl der **in diesem Bereich** ausgewählten Zutaten; die Knöpfe „Zuweisen", „Löschen" und „Auswahl aufheben" wirken nur auf die ausgewählten Zeilen dieses Bereichs.
- Die bestehende globale Leiste (über allen Bereichen) wird entfernt — es gibt nur noch die Leisten je Bereich. Sind in mehreren Bereichen Zeilen gewählt, erscheint in jedem davon eine Leiste.
- Das Kategorie-Auswahlfeld (Oberkategorie inkl. „keine Kategorie") verhält sich wie bisher; die Auswahl bleibt beim Wechsel zwischen Bereichen erhalten.
- Verhalten von Löschen (mit Bestätigungsdialog), Zuweisen und Auswahl aufheben bleibt unverändert; Drag & Drop, Sortierung und Einzelzuweisung bleiben unberührt.

## Sonstiges
- Keine Datenbankänderung, keine KI-Aufrufe, keine Credits.
- Keine neuen Texte nötig — vorhandene Übersetzungen (`adm.bulkSelected`, `adm.bulkAssign`, `adm.bulkDelete`, `adm.clearSelection`, `adm.recipeGroupNone`) werden wiederverwendet.

## Prüfung
- Typprüfung und Build.
- Browser-Test: Im Admin-Panel Zeilen in einem Bereich wählen → Leiste erscheint oberhalb dieses Bereichs; Zeilen in zwei Bereichen wählen → je eine Leiste; Zuweisen/Löschen wirkt nur auf den jeweiligen Bereich.
