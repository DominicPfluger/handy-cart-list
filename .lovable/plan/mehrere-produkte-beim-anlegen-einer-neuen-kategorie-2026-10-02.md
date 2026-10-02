# Mehrere Produkte beim Anlegen einer neuen Kategorie

## Ziel
Beim Anlegen einer **neuen** Kategorie im Admin-Panel (Kachel-Ansicht, „+ Neue Kategorie") kannst du optional direkt mehrere Produkte mit anlegen — über ein mehrzeiliges Textfeld, ein Produktname pro Zeile.

## Umsetzung

### 1. Dialog „Neue Kategorie" erweitern (`src/components/admin/catalog-tile-editor.tsx`)
- Nur beim **Neu-Anlegen** einer Kategorie (nicht beim Bearbeiten, nicht bei Produkten) erscheint unter dem Namen-Feld ein Textarea „Produkte (ein Name pro Zeile)".
- Das Feld ist optional: bleibt es leer, verhält sich alles wie bisher.
- Leere Zeilen und doppelte Namen werden beim Speichern ignoriert.

### 2. Speichern (`save()` im ItemSheet)
- Zuerst wird die Kategorie wie bisher angelegt (inkl. automatischer Übersetzung).
- Danach werden die eingetragenen Produkte in einem Schritt in der neuen Kategorie angelegt — gleicher Weg wie die bestehende Mehrfachanlage: Standardmenge 1 Stück, fortlaufende Sortierung, keine Preise/Bilder.
- Anschliessend laufen die neuen Produkte durch die vorhandene automatische Übersetzung (`translateIds`), wie bei der Mehrfachanlage.
- Erfolg/Fehler werden wie gewohnt als Meldung angezeigt; der Dialog schliesst erst nach Abschluss.

### 3. Texte (`src/i18n/de.ts` + `src/i18n/messages.json`)
- Neue Beschriftungen (Textarea-Titel, Platzhalter, Hinweis „n Produkte erkannt") in Deutsch und allen 15 vorhandenen Sprachen.

## Nicht Teil dieser Änderung
- Kein KI-Bild und keine Preisschätzung für die so angelegten Produkte (das bleibt der Einzel-Anlage vorbehalten, um Credits zu sparen).
- Keine Änderung am bestehenden Knopf „Mehrere Produkte hinzufügen" oder am Bearbeiten-Dialog.

## Prüfung
- Build + Typecheck.
- Browser-Test: neue Kategorie mit 3 Produktzeilen anlegen → Kategorie und Produkte erscheinen in der Kachel-Ansicht; leeres Textfeld → nur Kategorie.
