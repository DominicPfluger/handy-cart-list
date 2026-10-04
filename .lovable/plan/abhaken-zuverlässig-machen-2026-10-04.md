# Abhaken zuverlässig machen

## Woran es liegt
Beim Abhaken wird der Artikel sofort auf dem Gerät durchgestrichen und parallel gespeichert. Jede Speicherung löst eine Live-Aktualisierung aus: Nach 350 ms lädt die App die komplette Liste neu vom Server und **ersetzt** damit den Stand auf dem Gerät.

Hakt man mehrere Artikel kurz hintereinander ab, kommt dieses Neuladen oft an, bevor die späteren Häkchen gespeichert sind. Diese Artikel springen dann auf „nicht erledigt“ zurück und tauchen wieder auf. Beim nächsten Neuladen sind sie wieder abgehakt. Das ist das beobachtete Flackern.

Zweiter, seltener Fall: Ein frisch hinzugefügter Artikel, der noch nicht fertig gespeichert ist, kann abgehakt werden. Dieses Häkchen wird nie gespeichert und geht verloren, sobald der Artikel seine endgültige Kennung bekommt.

## Lösung
1. **Ausstehende Änderungen schützen:** Die App merkt sich jeden Artikel, dessen Häkchen gerade gespeichert wird. Beim Neuladen behält sie für diese Artikel den Stand auf dem Gerät, bis der Server die Speicherung bestätigt hat (Zeitlimit etwa 5 s).
2. **Veraltete Antworten verwerfen:** Jedes Neuladen bekommt eine laufende Nummer. Kommt eine ältere Antwort nach einer neueren an, wird sie ignoriert.
3. **Neu hinzugefügte Artikel:** Wird ein Artikel abgehakt, bevor er gespeichert ist, wird das Häkchen nach dem Speichern an den Server übertragen. Es bleibt also erhalten.

Das gilt für die normale Einkaufsliste und für den Kaufmodus, weil beide denselben Ablauf nutzen.

## Technische Details
- `src/hooks/use-shopping-list.ts`:
  - `pendingChecks: Map<itemId, {checked, until}>` als Ref; wird in `toggleItem` gesetzt und nach erfolgreichem `updateCloudItem` entfernt (bei Fehler ebenfalls, dazu Rollback und Toast).
  - In `fetchCloud` beim Zuordnen der Artikel: Gibt es für einen Artikel einen gültigen Eintrag in `pendingChecks`, überschreibt dieser `checked`.
  - Sequenzzähler `fetchSeq`: Nur das Ergebnis des neuesten `fetchCloud` darf `setCloudLists` aufrufen.
  - `toggleItem` bei `tmp-`-Kennungen: Den gewünschten Zustand vormerken. In `replaceItemLocally` (nach `addItem`) übernehmen und `updateCloudItem` nachsenden.
- Prüfung: Im angemeldeten Browser mehrere Artikel schnell hintereinander abhaken, in der Liste und im Kaufmodus. Kein Zurückspringen, Zustand bleibt nach dem Neuladen erhalten, danach die Testliste zurücksetzen.

---

# Bilder für die Rezept-Kategorien

Auf der Rezepte-Hauptseite bekommen die vier Kacheln eigene Bilder statt der Emojis: Rezept-Generator, Rezepte suchen, Rezept-Listen und Rezept-Inspirationen. Die Kachelfarben und Texte bleiben gleich.

- Pro Kachel wird ein freigestelltes KI-Bild im Stil der Produktbilder erstellt (PNG, transparent, quadratisch). Die Motive: Kochmütze mit Kochlöffel (Generator), Lupe über einem Rezeptblatt (Suchen), gestapelte Rezeptmappen (Listen), aufgeschlagenes Kochbuch mit Funken (Inspirationen).
- Wie bei den KI-Bildern üblich: keine Kräuter, keine Garnituren, keine Gefässe.
- Technisch: Die Bilder liegen unter `src/assets/recipes/` und werden in `src/routes/rezepte.index.tsx` importiert. Dazu bekommen `RecipeEntry` und `GENERATOR_ENTRY` ein Feld `image`, das anstelle von `icon` angezeigt wird (`object-contain`, gleiche Grösse wie bisher). Das Emoji bleibt als Ersatz, falls kein Bild vorhanden ist.
