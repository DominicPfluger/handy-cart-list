# Listen-Verwaltung: Vorlagen sortierbar machen

## Ausgangslage
Im Dialog „Listen bearbeiten" (src/components/list-manager.tsx) haben die normalen Listen bereits einen Zieh-Griff (Drag & Drop) und einen Löschen-Knopf. Der Bereich **Vorlagen** darunter hat zwar einen Löschen-Knopf, aber **keine Sortiermöglichkeit** — Vorlagen erscheinen in fester Reihenfolge.

## Ziel
Der Vorlagen-Bereich bekommt denselben Komfort wie die Listen darüber:

1. **Zieh-Griff (Drag & Drop)** pro Vorlage — Reihenfolge per Ziehen ändern, wird sofort gespeichert (`sort_order` in `shopping_lists`).
2. **Löschen-Knopf** bleibt pro Vorlage sichtbar (mit Bestätigungsfrage, wie bisher).

## Umsetzung (src/components/list-manager.tsx + src/hooks/use-shopping-list.ts)

1. **Vorlagen-Zeile sortierbar machen:**
   - Vorlagen-Liste in einen eigenen `DndContext`/`SortableContext` einbetten (gleiches Muster wie bei den Listen, `@dnd-kit` ist bereits im Einsatz).
   - Jede Vorlagen-Zeile bekommt links denselben Zieh-Griff (Punkte-Symbol) wie die Listen-Zeilen.
   - Beim Loslassen: neue Reihenfolge berechnen und `sort_order` aller Vorlagen neu speichern.

2. **Hook erweitern (use-shopping-list.ts):**
   - Neue Funktion `reorderTemplates(fromId, toId)` nach dem Muster des bestehenden `reorderLists` — optimistisch im State, dann `sort_order` in der Datenbank aktualisieren.
   - In `mehr.tsx` (bzw. wo ListManager eingebunden ist) als `onReorderTemplates` durchreichen.

3. **Löschen:** Der bestehende Löschen-Knopf pro Vorlage bleibt unverändert (Papierkorb-Symbol + Bestätigungsdialog).

## Technisch
- Keine Datenbankänderung (`sort_order` existiert bereits auf `shopping_lists`).
- Keine neuen Texte nötig (bestehende i18n-Schlüssel `lm.move`, `lm.deleteTemplate` reichen).

## Prüfung
- Typprüfung + Build.
- Browser-Test: Zwei Vorlagen anlegen, per Ziehen umsortieren, Reihenfolge nach Neuladen prüfen; Löschen mit Bestätigung testen; Testdaten aufräumen.
