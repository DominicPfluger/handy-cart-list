# Abteilungen pro Geschäft ausblenden

## Ziel
Unter **Einstellungen → Abteilungs-Reihenfolge** kann jede Abteilung für das gewählte Geschäft ausgeblendet werden. Ausgeblendete Abteilungen erscheinen in der Einkaufsliste nicht mehr, solange dieses Geschäft aktiv ist. Die Ausblendung gilt pro Geschäft und bleibt auf dem Gerät gespeichert.

## Umsetzung

### 1. Speicher (src/hooks/use-group-order.ts)
- Neuer Geräte-Schlüssel `shoppi:hidden-groups`: `{ [storeId]: string[] }` mit den Schlüsseln ausgeblendeter Abteilungen.
- `useGroupOrder()` liefert zusätzlich: `hidden` (Liste des aktiven Geschäfts), `hiddenAll`, `hideFor(storeId, key)`, `unhideFor(storeId, key)`.
- `resetFor(storeId)` löscht auch die Ausblendungen dieses Geschäfts; `removeCustomStore` ebenfalls.
- Neuer Helfer `filterHidden(groups, hidden)` zum Herausfiltern.

### 2. Einstellungen (src/components/store-order-settings.tsx)
- Jede Zeile der sortierbaren Abteilungsliste bekommt rechts einen **Papierkorb-Button** („Abteilung ausblenden").
- Ausgeblendete Abteilungen verschwinden aus der Sortierliste und erscheinen darunter in einem kleinen Abschnitt **„Ausgeblendet"** mit einem **Wiederherstellen-Button** (Pfeil/Plus) pro Eintrag.
- Ausblenden/Wiederherstellen wirkt sofort auf das gerade gewählte Geschäft.

### 3. Einkaufsliste (src/routes/index.tsx)
- Nach `applyGroupOrder` werden Gruppen, deren Schlüssel in `hidden` des aktiven Geschäfts stehen, herausgefiltert — sie werden im Geschäft nicht angezeigt.

### 4. Texte (i18n)
- Neue Schlüssel `store.hide`, `store.hiddenTitle`, `store.unhide` in `de.ts` und allen 15 Locales von `messages.json`.

## Technische Details
- Nur Geräte-lokale Speicherung (localStorage), wie bisher bei Reihenfolge und eigenen Läden — keine Datenbank-Änderung.
- Gruppenschlüssel bleiben die bestehenden (z. B. `label:obst-gemuese` bzw. Abteilungs-ID), damit Reihenfolge und Ausblendung zusammenpassen.
- Bestehende Daten (Reihenfolgen, eigene Läden) bleiben unverändert.

## Prüfung
- `bunx tsgo --noEmit` und Build-Log.
- Browser-Test: Abteilung ausblenden → in Liste weg; Geschäft wechseln → dort sichtbar; wiederherstellen → wieder da; Neuladen → Zustand bleibt.
