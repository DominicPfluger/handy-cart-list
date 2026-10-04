# Listen-Übersicht und Abteilungsreihenfolge reparieren

## Ursachen (im Code und im Browser bestätigt)

1. **Zuerst erscheint eine falsche Liste.** Solange die App noch prüft, ob du angemeldet bist, zeigt sie die Beispiel-Liste dieses Geräts („Unsere Einkaufsliste"). Erst danach werden deine gespeicherten Listen geladen. Die Anmeldeprüfung fragt ausserdem jedes Mal online nach. Ohne Internet hält die App dich deshalb für abgemeldet und zeigt wieder die Beispiel-Liste.
2. **Die Abteilungsreihenfolge greift nicht.** Ohne Anmeldung funktioniert die Sortierung (im Browser bestätigt: umgekehrte Reihenfolge wird übernommen). Bei angemeldeten Listen geht der Laden verloren, den du beim Erstellen wählst: Die Liste bekommt erst eine vorläufige Kennung und kurz darauf ihre endgültige. Der Laden bleibt an der vorläufigen hängen, also fällt die Liste auf „Standard" zurück. Dazu kommt die letzte Änderung: Beim Öffnen einer Liste wird die Auswahl in den Einstellungen auf den Laden der Liste umgestellt, meist „Standard". Deine Sortierung für einen anderen Laden wird dadurch scheinbar ignoriert.

## Änderungen

1. **Übersicht erst nach dem Laden zeigen:** Solange Anmeldung und Listen noch laden, erscheint ein kurzer Ladezustand statt der Beispiel-Liste. Danach kommt direkt die Übersicht mit allen gespeicherten Listen.
2. **Offline angemeldet bleiben:** Die Anmeldung wird zuerst aus der gespeicherten Sitzung auf dem Gerät gelesen, damit offline die eigenen Listen erscheinen.
3. **Laden bleibt bei der Liste:** Bekommt eine neue Liste ihre endgültige Kennung, wandert die Laden-Zuordnung mit. Die geöffnete Liste bleibt geöffnet und springt nicht zurück zur Übersicht.
4. **Einstellungen nicht mehr automatisch umstellen:** Diese Umstellung beim Öffnen einer Liste wird entfernt. Unter dem Listennamen steht weiterhin der zugeordnete Laden. Hat dieser Laden keine eigene Sortierung, gilt die zuletzt in den Einstellungen bearbeitete.
5. **Laden einer bestehenden Liste ändern:** Im Dialog „Listen bearbeiten" lässt sich der Laden einer Liste nachträglich wählen. So können ältere Listen mit „Standard" einem Laden zugeordnet werden.
6. **Prüfen:** Angemeldet im Browser eine Liste mit einem Laden erstellen, für diesen Laden die Reihenfolge in den Einstellungen ändern und kontrollieren, dass die Liste sie übernimmt. Ausserdem prüfen, dass beim Start keine Beispiel-Liste mehr aufblitzt.

## Technische Details

- `use-auth-user.ts`: zuerst `supabase.auth.getSession()` (lokal), danach `getUser()` zur Bestätigung; bei Netzwerkfehler die Sitzungsdaten behalten.
- `use-shopping-list.ts`: `user === undefined` nicht als lokalen Modus behandeln, sondern `loading: true` zurückgeben. In der Cloud-Variante von `createList`/`createListFromItems` nach dem Wechsel von der vorläufigen zur endgültigen Kennung `shoppi:list-stores` umschlüsseln (Helfer `renameListStore(tmpId, realId)` in `use-group-order.ts`, mit Event).
- `routes/index.tsx`: Splash/Skeleton, solange `loading || !hydrated`. `openListId` folgt dem Kennungswechsel (wenn `openListId` mit `tmp-` beginnt und `activeList.id` nicht mehr, übernehmen). Den `setSettingsStore`-Effekt entfernen.
- `list-manager.tsx`: Laden-Auswahl pro Liste über `setListStore`.
