# Schriftgrösse Abteilungs-Kategorien: 13px, fett

## Änderung
In `src/routes/abteilungen.tsx`, Zeile 573, die Klasse der Kategorien-Bezeichnung ändern:

- von: `min-w-0 text-center whitespace-normal text-xs font-normal leading-4 text-foreground`
- nach: `min-w-0 text-center whitespace-normal text-[13px] font-bold leading-4 text-foreground`

Zentrierung, Pfeil-Position und alles andere bleiben unverändert.

## Prüfung
- Vorschau: Hauptansicht der Abteilungen, ein- und zweizeilige Namen lesen sich fett und kompakt.
- Build-Fehlerprotokoll kontrollieren.
