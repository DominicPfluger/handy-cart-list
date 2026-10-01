# Kategorien in der Abteilungsansicht umbenennen

## Ausgangslage
- Produkte lassen sich in der Abteilungsansicht bereits umbenennen (Tipp auf den Produktnamen oeffnet den Umbenennen-Dialog).
- Kategorien lassen sich heute nur indirekt umbenennen: man muss die Kategorie oeffnen und dann im Pfad oben auf den letzten Namen tippen.
- Der Umbenennen-Dialog unterstuetzt Kategorien bereits (Art "department"), inkl. "Zuruecksetzen" bei eigenem Namen und "Loeschen" bei selbst erstellten Kategorien.

## Was sich aendert
- Jede Kategorie-Kachel in der Abteilungsansicht bekommt eine Umbenennen-Moeglichkeit direkt auf der Kachel:
  - Ein Stift-Symbol neben dem vorhandenen Papierkorb-Symbol (oben rechts auf der Kachel).
  - Wie der Papierkorb erscheint der Stift nur bei Mausberuehrung (Hover) bzw. ist auf Touch-Geraeten dauerhaft sichtbar, damit er dort auch ohne Maus erreichbar ist.
  - Ein Tipp darauf oeffnet den vorhandenen Umbenennen-Dialog mit dem Kategorienamen.
- Im Dialog wie bei Produkten:
  - Neuer Name wird nur auf diesem Geraet gespeichert (persoenliche Umbenennung), der Originalname wird darunter angezeigt.
  - "Zuruecksetzen" stellt den Katalognamen wieder her.
  - Bei selbst erstellten Kategorien bleibt "Loeschen" verfuegbar (mit Bestaetigung).
- Alias-Kategorien (zusaetzlich eingeblendete Kategorien) koennen ebenfalls umbenannt werden; die Umbenennung gilt ueberall, wo die Kategorie erscheint.
- Umbenennungen gelten nur lokal auf dem Geraet (wie bisher bei Produkten). Globale Namensaenderungen bleiben dem Admin-Panel vorbehalten.

## Technische Umsetzung
- `src/routes/abteilungen.tsx`: Stift-Button (PencilIcon aus `src/components/icons.tsx`, falls vorhanden, sonst neues Icon) neben dem Trash-Button auf der Kategorie-Kachel; Klick ruft `openRename(department, "department")` auf.
- `src/components/rename-dialog.tsx`: keine Aenderung noetig — unterstuetzt `kind: "department"` bereits.
- i18n: vorhandene Schluessel (`rename.*`) werden wiederverwendet; kein neuer Text noetig.
- Keine Datenbankaenderung.
