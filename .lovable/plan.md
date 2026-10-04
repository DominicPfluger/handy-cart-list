# Laden pro Einkaufsliste statt Umschalter in der Listenansicht

## Ziel
Der Laden-Umschalter in der Einkaufslisten-Ansicht entfällt. Der Laden wird stattdessen beim Erstellen einer Liste festgelegt und gilt dann dauerhaft für diese Liste.

## Umsetzung
- **Listenansicht (`src/routes/index.tsx`):** Der `StoreSwitcher` über der Liste wird entfernt. Abteilungs-Reihenfolge und ausgeblendete Abteilungen richten sich nach dem Laden, der der aktiven Liste zugeordnet ist (statt des global gewählten Ladens).
- **Zuordnung Liste ↔ Laden:** Die Zuordnung wird geräte-lokal gespeichert (neuer Schlüssel `shoppi:list-stores`, Liste-ID → Laden-ID), passend zu den übrigen geräte-lokalen Einstellungen wie Abteilungs-Reihenfolge. Listen ohne Zuordnung (bestehende Listen) verwenden „Standard".
- **Listen erstellen (`src/components/list-manager.tsx`):** Beim Anlegen einer neuen Liste erscheint unter dem Namensfeld eine Laden-Auswahl (Dropdown mit denselben Läden wie in den Einstellungen: Standard, Läden des Marktes, eigene Läden). Voreingestellt ist „Standard". Beim Erstellen wird die Zuordnung gespeichert.
- **Listen aus Vorlagen oder Favoriten:** Diese erhalten ebenfalls eine Zuordnung – voreingestellt „Standard" (kein zusätzlicher Auswahlschritt).
- **Einstellungen:** Die „Abteilungs-Reihenfolge" pro Laden in den Einstellungen bleibt unverändert – dort wird weiterhin pro Laden sortiert und ausgeblendet.
- Aufräumen: nicht mehr benötigter `StoreSwitcher`-Code und Import werden entfernt.

## Technisch
- `src/hooks/use-group-order.ts`: neuer Hook/Funktionen `listStore(listId)` / `setListStore(listId, storeId)` auf Basis von `shoppi:list-stores`; die Listenansicht nutzt `order`/`hidden` des Listen-Ladens.
- Keine Datenbank-Änderung nötig (geräte-lokal, wie die übrigen Laden-Einstellungen).
- Neue/angepasste Texte in allen 16 Sprachen.

## Prüfung
- Typprüfung und Build.
- Browser-Test: Listenansicht ohne Laden-Umschalter; neue Liste mit gewähltem Laden anlegen; Reihenfolge/Ausblendungen folgen dem Listen-Laden; bestehende Listen verhalten sich wie „Standard".
