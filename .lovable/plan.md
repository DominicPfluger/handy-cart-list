# Standard-Varianten: „laktosefrei" und „vegan" ergänzen

## Ausgangslage
Die Standard-Varianten-Liste (Schnellauswahl-Chips beim Bearbeiten eines Produkts im Admin-Bereich) ist die Konstante `COMMON_VARIANTS` in `src/routes/_authenticated/admin.tsx` (Zeile 697).

Aktueller Stand: `["Bio", "Vollkorn", "laktosefrei", "glutenfrei", "zuckerfrei", "light", "groß", "klein", "mild", "scharf"]`

- **„laktosefrei"** ist bereits in der Liste vorhanden.
- **„vegan"** fehlt.

## Umsetzung
1. In `src/routes/_authenticated/admin.tsx` Zeile 697 den Eintrag `"vegan"` in die Liste aufnehmen (nach `"Vollkorn"` einfügen, passend zu den Ernährungs-Chips oben in der Liste).
2. Die Chips werden bei bestehenden Varianten automatisch abgegraut (Vergleich case-insensitive) — keine weitere Logik nötig.

## Nicht im Umfang
- Keine Änderung an Produktdaten oder Übersetzungen — der Chip fügt nur den Varianten-Text hinzu, die automatische Lokalisierung beim Speichern (bereits vorhanden) übernimmt die Übersetzung.
