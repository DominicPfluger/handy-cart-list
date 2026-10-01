# Kategoriefarben entsättigen, Bezeichnungen zentrieren, Listen-Kästchen verkleinern

## Ziel
1. **Kategoriefarben dezenter:** Hintergrundfarben der Kategorien heller und weniger gesättigt (Farbton bleibt erkennbar).
2. **Bezeichnungen zentrieren:** Kategorie-Namen in der Abteilungsansicht mittig unter dem Bild platzieren (der Weiter-Pfeil bleibt rechts am Rand).
3. **Listen-Kästchen verkleinern:** Die Emoji-Kästchen in der Einkaufsliste (der kleine Rahmen um jedes Artikel-Emoji) nochmals etwas kleiner machen.

## Umsetzung
- **`src/styles.css`**: Alle 20 `--cat-*`-Farbwerte durch aufgehellte, entsättigte Varianten ersetzen. Beispiele:
  - Frischmarkt `#DCF2E0` → `#EDF8EF`
  - Milchprodukte `#F6F1E7` → `#FAF7F1`
  - Fleisch & Fisch `#F8E0DC` → `#FBEEEC`
  - Tiefkühl `#DCEEF7` → `#ECF5FA`
  - Süsses `#F9E0EC` → `#FCEEF4`
  - (alle übrigen analog) — Abteilungsansicht und Einkaufsliste färben sich automatisch mit.
- **`src/routes/abteilungen.tsx`**: Textzeile der Kacheln: Name zentriert, Pfeil absolut rechts positioniert — in Haupt- und Unterebene.
- **`src/routes/index.tsx`** (und `src/routes/favoriten.tsx`, falls dort gleich): Kästchen von `h-9 w-9` auf `h-8 w-8`, Emoji von `text-lg` auf `text-base`.

## Prüfung
- Vorschau: Abteilungs-Hauptansicht, eine Unterebene und die Einkaufsliste kontrollieren (Zentrierung, Kästchengrösse, Farben hell + lesbar).
- Build-Fehlerprotokoll prüfen.
