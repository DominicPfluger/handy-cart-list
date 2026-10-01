# Kategoriefarben heller und weniger gesättigt

## Ziel
Die Hintergrundfarben der Abteilungskategorien (Kacheln in der Abteilungsansicht und Emoji-Kästchen in der Einkaufsliste) wirken dezenter: weniger Sättigung, mehr Helligkeit. Die Farbzuordnung pro Kategorie bleibt unverändert.

## Umsetzung
- **`src/styles.css`**: Alle 20 `--cat-*`-Farbwerte werden durch aufgehellte, entsättigte Varianten ersetzt (jeweils Richtung Weiss/Neutral, Farbton bleibt erkennbar). Beispiele:
  - Frischmarkt `#DCF2E0` → `#EDF8EF`
  - Milchprodukte `#F6F1E7` → `#FAF7F1`
  - Fleisch & Fisch `#F8E0DC` → `#FBEEEC`
  - Tiefkühl `#DCEEF7` → `#ECF5FA`
  - Süsses `#F9E0EC` → `#FCEEF4`
  - (alle übrigen analog)
- Keine Änderungen an `src/lib/dept-colors.ts`, `src/routes/abteilungen.tsx` oder `src/routes/index.tsx` — die Farben werden zentral über die Tokens gesteuert, sodass Abteilungsansicht und Einkaufsliste automatisch gleichermassen heller werden.

## Prüfung
- Vorschau: Abteilungs-Hauptansicht, eine Unterebene und die Einkaufsliste kontrollieren (Farbton noch unterscheidbar, Emojis/Bilder gut lesbar).
- Build-Fehlerprotokoll prüfen.
