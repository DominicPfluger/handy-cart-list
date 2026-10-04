# Produkteinzelansicht: Umbenennen per Klick auf den Produktnamen

## Ziel
In der Produkteinzelansicht (`src/routes/produkt.$id.tsx`) wird das Stift-Symbol neben dem Produktnamen entfernt. Stattdessen öffnet ein Klick auf die Produktbezeichnung selbst den bestehenden Umbenennen-Dialog.

## Umsetzung
- Die Überschrift mit dem Produktnamen wird zu einem klickbaren Element (Button-Verhalten), das denselben `RenameDialog` öffnet wie bisher das Stift-Symbol (gleiche Daten: Name, Originalname, eigener Name).
- Das Stift-Icon und der dazugehörige Button werden entfernt; der nicht mehr benötigte `PencilIcon`-Import wird aufgeräumt.
- Der Name behält sein bisheriges Aussehen (Schriftgrösse, Umbruch), bekommt aber einen erkennbaren Hinweis auf Klickbarkeit (Cursor, dezenter Hover), damit die Funktion auffindbar bleibt. Tastatur-Bedienung (Enter/Leertaste) und Beschriftung für Screenreader bleiben erhalten.
- Keine Änderung am Umbenennen-Dialog selbst oder an der Speicherlogik (eigene Namen bleiben geräte-lokal).

## Prüfung
- Typprüfung und Build.
- Browser-Test: Produktdetailseite öffnen, kein Stift mehr sichtbar, Klick auf den Namen öffnet den Umbenennen-Dialog, Umbenennen funktioniert.
