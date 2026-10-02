# Kategoriepreise: aufklappbare Kategorien statt Auswahlmenü

Im Admin-Bereich „Preise“ wird unter „Preise einer Kategorie schätzen“ das bisherige Auswahlmenü durch eine übersichtliche Kategorienliste ersetzt:

- Alle Kategorien erscheinen in ihrer bestehenden Reihenfolge und Hierarchie. Unterkategorien werden durch Aufklappen der übergeordneten Kategorie sichtbar; mehrere Zweige dürfen gleichzeitig offen bleiben.
- Jede Kategorie und Unterkategorie erhält eine eigene Aktion „Preise schätzen“. So ist sofort erkennbar, für welchen Bereich die Schätzung gestartet wird; ein zusätzliches Auswahlmenü entfällt.
- Vor jedem kostenpflichtigen Schätzlauf bleibt die Bestätigung mit Kategoriename und gewähltem Markt erhalten. Wie bisher werden nur fehlende Richtpreise ergänzt; die Schätzung einer Oberkategorie umfasst auch ihre Unterkategorien.
- Während eines Laufs sind weitere Schätzaktionen gesperrt; Erfolg und Fehler werden wie bisher angezeigt.

## Technische Details

- In `catalog-media-panel.tsx` die flachen `deptOptions` und die `catId`-Auswahl durch eine hierarchische, unabhängig aufklappbare Darstellung mit lokalem Öffnungszustand ersetzen. Die Schätzfunktion erhält die angeklickte Kategorie-ID direkt.
- Vorhandene Admin-Abteilungsdaten, `estimateCategoryPrices` und die Markt-Auswahl weiterverwenden; keine Datenbankänderung und kein neuer KI-Aufruf beim Aufklappen.
- Nur falls neue sichtbare Texte nötig sind: deutsche Texte und alle 15 weiteren Sprachfassungen ergänzen.
- Im Browser prüfen: mehrere Kategorie-Zweige öffnen, Unterkategorie auswählen, Bestätigung für Kategorie und Markt sehen und Abbrechen ohne Schätzung testen; die kostenpflichtige Schätzung nicht ohne ausdrücklichen Anlass auslösen.
