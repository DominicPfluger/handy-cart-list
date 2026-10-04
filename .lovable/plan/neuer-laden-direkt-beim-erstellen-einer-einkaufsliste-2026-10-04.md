# „+ Neuer Laden" direkt beim Erstellen einer Einkaufsliste

## Ziel
Beim Erstellen einer Liste (Listenverwaltung) kann im Laden-Dropdown „+ Neuer Laden" gewählt werden. Daraufhin erscheint ein Eingabefeld für den Ladennamen; der neue Laden wird geräte-lokal gespeichert, sofort für die neue Liste vorausgewählt und steht danach überall zur Verfügung — auch in den Einstellungen unter „Abteilungs-Reihenfolge".

## Ist-Zustand
- Eigene Läden existieren bereits: `use-group-order.ts` verwaltet `customStores` mit `addCustomStore(name)` / `removeCustomStore(id)` (geräte-lokal, localStorage).
- `use-stores.ts` führt Standard, Markt-Läden und eigene Läden zusammen — ein neu angelegter Laden erscheint automatisch in allen Auswahlen (Einstellungen, Listen-Dialog).
- Im Listen-Dialog (`list-manager.tsx`) fehlt bisher nur die Möglichkeit, einen Laden anzulegen.

## Umsetzung

### 1. `src/components/list-manager.tsx`
- Das Laden-Dropdown erhält als letzten Eintrag „+ Neuer Laden" (Wert `__new__`).
- Wird dieser Eintrag gewählt, erscheint unter dem Dropdown ein Textfeld „Name des Ladens" mit Knopf „Hinzufügen":
  - `addCustomStore(name)` aus `useGroupOrder()` legt den Laden an und liefert die ID.
  - Die neue ID wird als `newStore` gesetzt, das Eingabefeld verschwindet wieder.
- Leerer Name deaktiviert den Knopf; Enter im Feld löst ebenfalls das Hinzufügen aus.

### 2. Übersetzungen
- Neue Schlüssel `store.new` („+ Neuer Laden"), `store.newPlaceholder` („Name des Ladens"), `store.add` („Hinzufügen") in `src/i18n/de.ts` und `src/i18n/messages.json` für alle 16 Sprachen.

## Technische Details
- Keine Datenbankänderung — eigene Läden bleiben geräte-lokal (`useGroupOrder`).
- Keine Änderung an `use-stores.ts` nötig: neue eigene Läden erscheinen automatisch in der Liste.
- Abteilungs-Reihenfolge und Ausblendungen funktionieren für den neuen Laden sofort (pro-Laden-Schlüssel existieren bereits).

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`) und Build-Log.
- Browser-Test: Listenverwaltung öffnen → „+ Neuer Laden" wählen → Namen eingeben → Laden erscheint ausgewählt; danach in den Einstellungen unter „Abteilungs-Reihenfolge" prüfen, dass der neue Laden wählbar ist.
