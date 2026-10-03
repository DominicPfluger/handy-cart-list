# Produktbezeichnung auf der Detailseite ändern

- Neben dem Produktnamen auf der Detailseite einen Stift-Knopf anzeigen, der den vorhandenen Dialog „Bezeichnung ändern“ öffnet.
- Den aktuellen Namen und die ursprüngliche Katalogbezeichnung an den Dialog übergeben. Nach dem Speichern den geänderten Namen unmittelbar auf der Detailseite anzeigen; „Original wiederherstellen“ bleibt verfügbar.
- Die Änderung gilt wie bisher nur auf dem eigenen Gerät. In der Abteilungsansicht bleibt der Umbenennen-Knopf entfernt.
- Die Bedienung auf Mobilgeräten und die Namensänderung inklusive Wiederherstellung prüfen.

## Technische Umsetzung

Die Detailseite verwendet bereits den persönlich benannten Produktkatalog. Den bestehenden `RenameDialog` mit `originalName` und `useCustomNames` dort anbinden, statt eine neue Speicherlogik einzuführen.
