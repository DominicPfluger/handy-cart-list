# Überschriften-Auswahl im Produkt-Bearbeiten-Dialog

## Ergebnis der Prüfung

Die gewünschte Funktion existiert bereits und muss nicht gebaut werden:

- Im Produkt-Bearbeiten-Dialog (Kachelansicht) gibt es das Drop-down „Überschrift" mit allen Überschriften der Kategorie plus „Keine Überschrift" (`src/components/admin/catalog-tile-editor.tsx`, ItemSheet).
- Dasselbe Drop-down gibt es im erweiterten Editor-Dialog (`src/routes/_authenticated/admin.tsx`, Editor).
- Beim Speichern wird das Produkt über `assignHeading` ans Ende der gewählten Überschriften-Gruppe verschoben; verankerte Überschriften werden korrekt auf das Folgeprodukt umgehängt.
- Das Drop-down erscheint nur, wenn die geöffnete Kategorie Überschriften enthält.

## Massnahme

Keine Code-Änderung nötig. Der Nutzer hat bestätigt, dass die vorhandene Funktion ausreicht.
