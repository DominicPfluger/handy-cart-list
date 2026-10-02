# Rezept-Generator: Kategorien erst beim Antippen aufklappen

## Ziel
In einer geöffneten Zutaten-Ebene des Rezept-Generators werden die Zutaten einer Kategorie (z. B. „Kohlenhydrate") erst angezeigt, wenn man auf die Kategorie tippt/klickt. Mehrere Kategorien können gleichzeitig offen sein.

## Verhalten
- Jede Kategorie erscheint weiterhin als umrandeter Eintrag (gleicher Stil wie heute: abgerundete Umrandung, Emoji + Name).
- Tippt man die Kategorie, erscheinen ihre Zutaten direkt daneben in derselben Zeile (wie bisher, inkl. Zeilenumbruch auf schmalen Bildschirmen). Nochmal tippen klappt sie zu.
- Mehrere Kategorien können gleichzeitig aufgeklappt sein; jede ist unabhängig.
- Bereits ausgewählte Zutaten bleiben immer sichtbar: Sie erscheinen zusätzlich als eigener Block unter den Kategorien (auswählbar, zum Abwählen antippen) — unabhängig davon, ob ihre Kategorie offen oder zu ist.
- Die Begrenzung auf zunächst 10 Zutaten mit „Weitere anzeigen" gilt je geöffneter Kategorie (statt je Ebene); bereits Gewählte bleiben immer sichtbar.
- Die Suche innerhalb einer Ebene bleibt unverändert: Bei laufender Suche werden alle Treffer ohne Kategorien-Aufklapplogik angezeigt.
- Ohne Kategorien (Schritte ohne Zuordnungen) bleibt alles wie heute.
- Keine Änderungen an Auswahl-Logik, gespeicherten Rezepten, Admin-Zuordnung oder Daten.

## Technische Umsetzung
Nur `src/components/recipe-builder.tsx`:
- Neuer State `openGroups: Record<string, boolean>` (Schlüssel `${stepKey}:${groupId}`) statt nur einer offenen Kategorie.
- Im Gruppen-Rendering: Der Kategorie-Pill wird zum Button mit `aria-expanded`, der `openGroups` umschaltet; Produkte werden nur gerendert, wenn die Gruppe offen ist.
- Der „Weitere anzeigen"-Zähler `visibleCount` wird bei Kategorien auf den Gruppenschlüssel (`${stepKey}:${groupId}`) gesetzt, ohne Kategorien bleibt es der Schritt-Schlüssel; Reset bei Vorlagenwechsel (bestehender Effekt) ergänzt um `openGroups`.
- Ausgewählte Produkte werden nach den Gruppen als eigene Chip-Reihe gerendert (Klick = abwählen).
- Keine neuen UI-Texte — keine i18n-/Übersetzungsänderungen nötig.

## Prüfung
- Build-Fehlerprüfung.
- Browser-Test im Rezept-Generator (Smoothie-Vorlage): Kategorie zu → keine Zutaten sichtbar; Klick auf Kategorie → Zutaten erscheinen; zweite Kategorie zusätzlich öffnen; Auswahl aus zugeklappter Kategorie bleibt sichtbar; „Weitere anzeigen" funktioniert je Kategorie; Suche zeigt Treffer ohne Kategorie-Logik.
