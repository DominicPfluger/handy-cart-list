# Listenansicht folgt der Abteilungsreihenfolge aus den Einstellungen

## Befund (aus dem Code, noch nicht im Browser bestätigt)
- Die Einstellungen bearbeiten die Reihenfolge des dort gewählten „aktiven" Ladens.
- Die Einkaufsliste nutzt dagegen den Laden, der der Liste beim Erstellen zugeordnet wurde (Listen ohne Zuordnung = „Standard").
- Folge: Wer in den Einstellungen z. B. „Migros" sortiert, aber eine Liste mit „Standard" öffnet, sieht keine Änderung. Das ist die wahrscheinlichste Ursache.
- Zweite mögliche Ursache: Einträge ohne Katalog-Abteilung landen in eigenen Gruppen, die die gespeicherte Reihenfolge nicht kennen und hinten stehen.

## Vorgehen
1. Im Browser reproduzieren: Reihenfolge für einen Laden speichern, Liste mit gleichem bzw. anderem Laden öffnen, Gruppenreihenfolge vergleichen. Ursache damit bestätigen.
2. Laden-Zuordnung sichtbar und einheitlich machen:
   - Die Einstellungen öffnen standardmässig den Laden der zuletzt geöffneten Liste.
   - In der Listenansicht klein den zugeordneten Laden anzeigen (nur Anzeige, kein Umschalter), damit klar ist, welche Sortierung gilt.
   - Hat der Laden der Liste keine eigene Sortierung, wird die zuletzt in den Einstellungen bearbeitete Sortierung (bzw. „Standard") verwendet.
3. Einträge ohne Katalog-Abteilung (falls Ursache 2 bestätigt) zuverlässiger einer Hauptabteilung zuordnen, damit sie mitsortiert werden.
4. Erneut im Browser prüfen: Ändern der Reihenfolge in den Einstellungen wirkt sofort in der passenden Liste.

## Technische Details
- `src/routes/index.tsx`: `activeStoreId` aus `listStores[activeList.id]`; Fallback-Kette `all[listStore] ?? all[activeStore] ?? all.default`.
- `src/hooks/use-group-order.ts`: beim Öffnen einer Liste `setStore(listStore)` setzen, damit `store-order-settings.tsx` denselben Laden vorwählt.
- Gruppen-Mapping (`rootForCategory`/`deptByLabel`) bei Bedarf erweitern.
