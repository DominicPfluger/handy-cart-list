# Untertitel-Text im Rezept-Generator anpassen

## Was geändert wird

Der bestehende Untertitel

> „Wähle eine Kategorie und stelle dir aus deinen Lieblingszutaten dein persönliches Wunschrezept zusammen. Deiner Kreativität sind fast keine Grenzen gesetzt."

wird ersetzt durch den neuen Text:

> „Wähle deine gewünschte Kategorie. Lass dich inspirieren und stelle dir ganz einfach aus deinen Lieblingszutaten dein Wunschrezept zusammen. Hier kannst du deiner Kreativität freien Lauf lassen. Deiner Fantasie sind fast keine Grenzen gesetzt."

Der alte Text steht an zwei Stellen mit identischem Wortlaut:
- `rk.sub` in `src/i18n/de.ts` (Zeile 405) — Generator-Untertitel
- `land.genDesc` in `src/i18n/de.ts` (Zeile 749) — Generator-Beschreibung auf der Landingpage (/start)

Beide Schlüssel erhalten den neuen Text, damit sie nicht auseinanderlaufen.

## Technische Umsetzung

1. **de.ts:** Beide Zeilen (rk.sub, land.genDesc) mit dem neuen deutschen Text ersetzen.
2. **messages.json:** `rk.sub` und `land.genDesc` in allen 15 übersetzten Sprachblöcken (en, es, fr, it, pt, nl inkl. Varianten) mit passenden Übersetzungen des neuen Texts ersetzen (de-AT/de-CH erben den de-Fallback, kein Eintrag nötig).
3. Build prüfen (`build-errors.log`) und den neuen Text in der Vorschau auf `/start` (Generator-Sektion) kontrollieren.
