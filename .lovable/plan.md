# Listen-Reihenfolge folgt der Abteilungs-Sortierung aus den Einstellungen

## Fehler

In den Einstellungen unter „Abteilungs-Reihenfolge" lässt sich die Reihenfolge der Abteilungen pro Laden festlegen. In der Einkaufsliste wird diese Reihenfolge aber nur für Einträge angewendet, die mit einem Katalogprodukt verknüpft sind. Manuell eingetippte Artikel (und Demo-Einträge) werden unter ihrem Kategorienamen gruppiert (z. B. „Obst & Gemüse"). Dieser Gruppenschlüssel ist ein Text („label:Obst & Gemüse") und passt nie zu den gespeicherten Abteilungs-IDs — solche Gruppen bleiben daher immer in der ursprünglichen Reihenfolge, egal was in den Einstellungen eingestellt ist. Im Browser nachgestellt: Nach dem Umordnen in den Einstellungen blieb die Liste unverändert.

## Lösung

In der Gruppierung der Listenansicht (`src/routes/index.tsx`, `grouped`):

1. Hat ein Eintrag kein verknüpftes Katalogprodukt, wird sein Gruppenname (`groupLabel` bzw. Kategorie) mit den Katalog-Abteilungen abgeglichen — über Name, Basisname und alle Übersetzungen (gleiche Logik wie bereits in `leafOf` für Unterkategorien).
2. Wird eine passende Abteilung gefunden, erhält die Gruppe deren oberste Abteilung als Schlüssel (z. B. „Obst & Gemüse" → „Frischmarkt"). Damit greift die in den Einstellungen gespeicherte Reihenfolge auch für manuell eingetippte Artikel.
3. Wird keine passende Abteilung gefunden, bleibt alles wie bisher (Gruppe am Ende, in Katalog-Reihenfolge).

Der Abgleich nutzt eine einmalig aufgebaute Namens-zu-Abteilung-Karte (aus dem bereits geladenen Katalog), kostet also praktisch keine zusätzliche Ladezeit.

## Technische Details

- Datei: `src/routes/index.tsx` (Gruppierung in `grouped`, Zeilen ~207–246)
- Neue Hilfsfunktion: `deptByLabel(label)` — sucht in `catalog.departments` nach `name`, `baseName` oder einem Wert in `names` (Groß-/Kleinschreibung ignoriert); Ergebnis wird memoisiert
- Gruppenschlüssel: `root.id` der gefundenen Abteilung statt `label:<name>`; Bezeichnung und Symbol der Gruppe bleiben die des Eintrags
- Keine Änderung an `use-group-order.ts`, den Einstellungen oder gespeicherten Daten
- Keine neuen Übersetzungen nötig

## Prüfung

- Browser-Test: Reihenfolge in den Einstellungen ändern, Liste mit manuellen Artikeln (z. B. „Tomaten" unter „Obst & Gemüse") prüfen — die Gruppe folgt jetzt der eingestellten Reihenfolge
- Typprüfung und Build fehlerfrei
