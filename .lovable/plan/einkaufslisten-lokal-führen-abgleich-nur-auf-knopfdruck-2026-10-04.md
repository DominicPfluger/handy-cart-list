# Einkaufslisten lokal führen, Abgleich nur auf Knopfdruck

## Verhalten
- **Eigene Listen** (nicht geteilt) werden komplett auf dem Gerät gespeichert. Abhaken, Hinzufügen, Löschen, Mengen ändern, Umbenennen und „Erledigte entfernen“ senden nichts ins Web.
- Im Listenkopf gibt es neben Kaufmodus, Teilen und Herunterladen ein **Abgleich-Symbol** (zwei kreisende Pfeile). Gibt es nicht abgeglichene Änderungen, trägt es einen kleinen Punkt. Ein Tipp gleicht die geöffnete Liste mit dem Web ab, danach erscheint „Liste abgeglichen“.
- **Geteilte Listen** (mit mindestens einem weiteren Mitglied) bleiben live wie bisher, einschliesslich des neuen Schutzes gegen zurückspringende Häkchen. Für sie wird kein Abgleich-Symbol angezeigt.
- Änderungen anderer Geräte an einer eigenen Liste erscheinen erst nach dem Abgleich.
- Neue Listen anlegen, Listen löschen und Vorlagen bleiben wie bisher sofort gespeichert, damit sie in der Übersicht und auf anderen Geräten auftauchen.
- Ohne Internet zeigt der Abgleich eine Meldung an. Die lokalen Änderungen bleiben erhalten.

## Abgleich-Logik
Pro eigener Liste merkt sich das Gerät zwei Stände: den **lokalen Stand** und den **zuletzt abgeglichenen Server-Stand**. Beim Abgleich:
1. Lokal neu hinzugefügte Artikel werden im Web angelegt.
2. Lokal gelöschte Artikel werden im Web gelöscht.
3. Geänderte Artikel (Häkchen, Menge, Abteilung) und der Listenname werden aktualisiert.
4. Danach wird die Liste frisch geladen. Sie wird zum neuen lokalen und abgeglichenen Stand, dabei kommen auch Änderungen anderer Geräte mit.

Bei einem Konflikt gewinnt der lokale Stand für alle Artikel, die du geändert hast.

## Technische Details
- `src/hooks/use-shopping-list.ts`
  - Neuer Geräte-Speicher `shoppi:local-lists` mit `{ [listId]: { items, name, base: { items, name }, dirty } }`.
  - `isShared(list)`: Mitgliederzahl > 1, ermittelt aus `res.members` je `list_id` und in `ShoppingList` als `shared` abgelegt.
  - Item-Mutationen (`toggleItem`, `addItem`, `addCatalogItem`, `removeItem`, Mengen-/Gruppen-Updates, `clearChecked`, `renameList`) prüfen `shared`. Bei eigenen Listen wird nur lokal geändert und `dirty` gesetzt, kein `runCloud`. Neue Artikel behalten ihre `tmp-`-Kennung bis zum Abgleich.
  - `fetchCloud`: Bei eigenen Listen mit `dirty` bleibt der lokale Stand bestehen, nur `base` wird aktualisiert. Ohne `dirty` wird der Server-Stand übernommen. Live-Abo nur für geteilte Listen (`list_items`-Filter auf deren IDs).
  - Neue Funktion `syncList(listId)`: Diff aus lokalem Stand und `base` → `addCloudItems` / `deleteCloudItem` / `updateCloudItem` / `updateCloudList`, danach `fetchCloud` und `dirty` zurücksetzen. Wird mit `isDirty(listId)` und `syncing` über die API bereitgestellt.
  - Einmalige Übernahme: Beim ersten Start wird der aktuelle Server-Stand als lokaler und `base`-Stand gesetzt.
- `src/routes/index.tsx`: Abgleich-Symbol im Listenkopf (nur bei eigenen Listen), Dreh-Animation während `syncing`, Punkt bei `dirty`.
- Neue Übersetzungsschlüssel `list.sync`, `list.synced`, `list.syncOffline` in allen Sprachen.
- Prüfung im Browser mit dem angemeldeten Konto:
  - Abhaken in einer eigenen Liste erzeugt keinen Netzwerkaufruf.
  - Nach dem Neuladen ist der Stand noch da.
  - Abgleich überträgt die Änderungen ins Web.
  - Danach die Testliste zurücksetzen.
