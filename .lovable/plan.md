# Kategorie-Bezeichnung in der Abteilungsansicht wieder ermöglichen

## Ziel
In der Abteilungsansicht (Kacheln) kann eine Kategorie wieder umbenannt werden — wie früher über den Umbenennen-Dialog.

## Vorgehen
1. **Stift-Button an der Kategorie-Kachel**: Neben dem vorhandenen Papierkorb-Button (oben rechts) kommt ein Stift-Button (oben links), der den bestehenden `RenameDialog` öffnet. Erscheint bei Maus-Over bzw. Fokus, wie der Papierkorb.
2. **Dialog wieder einbinden**: `RenameDialog` und `RenameTarget` aus `../components/rename-dialog` importieren, State `renameTarget` hinzufügen und den Dialog am Seitenende rendern.
3. **Umbenennen-Logik**: Der Dialog nutzt weiterhin die vorhandene geräte-lokale Eigennamen-Funktion (`useCustomNames`) — eigener Name, Zurücksetzen und Löschen eigener Einträge sind bereits im Dialog enthalten.

## Technische Details
- Datei: `src/routes/abteilungen.tsx` (Kachel-Raster um Zeile 519–551)
- Wiederverwendet: `src/components/rename-dialog.tsx`, `src/hooks/use-custom-names.ts`, `PencilIcon` aus `../components/icons`
- Änderung gilt geräte-lokal (eigene Bezeichnungen), der gemeinsame Katalog bleibt unverändert
- Keine Datenbank- oder Übersetzungsänderungen nötig (i18n-Schlüssel `rename.*` existieren bereits)

## Prüfung
- Browser-Test: Stift an einer Kategorie klicken, Namen ändern, speichern, Kachel zeigt neuen Namen; Zurücksetzen stellt den Originalnamen wieder her
- Typprüfung und Build
