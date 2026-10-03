# Rezept-Admin: Vorlagen & Zutatenbereiche per Drag & Drop sortieren

## Ziel
Im Admin-Panel unter „Rezept-Generator" → „Rezept-Verwaltung" (Bereich „Vorlagen & Oberkategorien") sollen Vorlagen und Zutatenbereiche per Ziehen mit der Maus sortiert werden. Die Pfeil-Knöpfe (▲/▼) entfallen. Die grauen Oberkategorien sind bereits per Drag & Drop sortierbar und bleiben unverändert.

## Umsetzung (src/components/recipe-admin.tsx)

1. **Vorlagen-Liste** (Zeilen ~282–293):
   - Jede Vorlagen-Zeile wird ziehbar (Drag-Handle „⠿" am Zeilenanfang, wie bei den Oberkategorien).
   - Neue Funktion `reorderTpl(sourceId, target)` nach dem Muster von `reorderGroup`: Liste neu anordnen, `sort_order` für alle Einträge neu speichern, Daten neu laden.
   - Die beiden Pfeil-Knöpfe und die Funktion `moveTpl` werden entfernt.

2. **Zutatenbereiche/Schritte-Liste** (Zeilen ~349–350):
   - Gleiches Muster: Drag-Handle pro Schritt-Zeile, neue Funktion `reorderStep(sourceId, target)` mit Neuvergabe von `sort_order` (nur innerhalb der gewählten Vorlage).
   - Die Pfeil-Knöpfe und `moveStep` entfallen.

3. **Unverändert:** Oberkategorien (bereits Drag & Drop), beliebte Kombinationen, Bearbeiten/Löschen/Aktiv-Schalter, Formulare.

## Technisch
- HTML5 Drag & Drop (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) wie bei den Oberkategorien — keine neue Bibliothek.
- Keine Datenbankänderung, keine neuen Texte (bestehende i18n-Schlüssel reichen).
- `sort_order`-Updates laufen über die bestehende Admin-Berechtigung (RLS).

## Prüfung
- Typprüfung + Build.
- Browser-Test: Vorlage per Ziehen an andere Position, Schritt per Ziehen verschieben, Reihenfolge nach Neuladen prüfen; Pfeile sind weg.
