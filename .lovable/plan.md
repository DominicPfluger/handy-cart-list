# Admin-Katalog: Kategorien in der Listenansicht auswählen und löschen

## Ziel
In der neuen Listenansicht der Kategorien (Admin-Panel → Katalog) lassen sich Kategorien per Checkbox markieren, alle auf einmal auswählen und gemeinsam löschen — analog zur bestehenden Mehrfachauswahl bei Produkten.

## Umsetzung

1. **Checkboxen in der Kategorien-Listenansicht** (`src/components/admin/catalog-tile-editor.tsx`)
   - Jede Kategorie-Zeile erhält links eine Checkbox (wie bei den Produktzeilen).
   - Eigene Auswahl-Menge für Kategorien (getrennt von der Produkt-Auswahl), zurückgesetzt beim Wechsel der Kategorie.

2. **„Alle auswählen" für Kategorien**
   - Checkbox-Zeile oberhalb der Kategorien-Liste (nur in der Listenansicht), mit indeterminate-Zustand wie bei Produkten.

3. **Löschen der markierten Kategorien**
   - Aktionsleiste (wie bei Produkten): Anzahl markierter Einträge, „Alle auswählen", „Auswahl aufheben", „Markierte löschen".
   - Löschen mit Bestätigungsdialog; Alias-Kategorien werden über den bestehenden Alias-Entfernen-Callback entfernt, echte Kategorien über den bestehenden Lösch-Callback (`remove("department", …)`).
   - Hinweis im Bestätigungsdialog, dass enthaltene Unterkategorien/Produkte ebenfalls betroffen sind (gleiches Verhalten wie beim Einzel-Löschen).

4. **Texte** in `src/i18n/de.ts` ergänzen (z. B. Bestätigungstext für Mehrfach-Löschung von Kategorien); Übersetzungen laufen über den bestehenden Auto-Übersetzungsmechanismus.

## Technische Details
- Keine Datenbankänderungen; die Löschlogik nutzt die vorhandenen Callbacks aus `admin.tsx`.
- Die Mehrfach-Löschung führt die bestehenden Einzel-Löschaufrufe nacheinander aus (ein Bestätigungsdialog gesamt), damit Verhalten und Fehlerbehandlung identisch bleiben.
- Kachelansicht bleibt unverändert.

## Prüfung
- Typprüfung + Build.
- Browser-Test: Kategorien markieren, „Alle auswählen", Löschen mit Bestätigung, Alias-Kategorie in der Auswahl.
