# Wild im Fleischkatalog ergänzen

- Unter **Fleisch & Fisch** eine Kategorie **Wild** direkt nach **Geflügel** anlegen. **Fisch** und **Meeresfrüchte** bleiben danach in ihrer bisherigen relativen Reihenfolge.
- Darin die Unterkategorien **Reh**, **Wildschwein** und **Hirsch** mit den 8, 7 und 15 genannten Artikeln anlegen. „Wildschweinruecken“ wird als **Wildschweinrücken** angezeigt.
- Innerhalb jeder Unterkategorie die Artikel übersichtlich nach Ähnlichkeit ordnen, passende Standardmengen und Ernährungsform-Einordnungen vergeben und alle neuen Namen für die unterstützten Sprachvarianten ergänzen.
- Anschliessend die Reihenfolge und die vollständigen Artikelbestände in der Abteilungsansicht prüfen.

## Technische Umsetzung

Der vorhandene Katalog nutzt hierarchische Abteilungen mit `parent_id` und `sort_order`, Produkte mit `department_id` sowie separate Katalogübersetzungen. **Geflügel** steht aktuell an Position 8 unter **Fleisch & Fisch**; **Wild** wird an Position 9 eingefügt und die nachfolgenden Kategorien werden eindeutig einsortiert. Die Änderung betrifft Katalogdaten, nicht die Datenbankstruktur oder App-Oberfläche; bereits vorhandene gleichnamige Artikel werden vor dem Anlegen geprüft, damit keine Dubletten entstehen.
