# Farbig Icons für Rezept-Bereiche

## Ziel
Die vier Abschnitts-Überschriften im Rezept-Bereich bekommen statt des schlichten Text-Symbols ein farbiges Icon-Kästchen im gleichen Stil wie die Kategorie-Kacheln (abgerundetes Feld mit Farbfläche + Emoji).

## Betroffene Bereiche
1. **🆕 Neue Rezept-Kreationen** — recipe-builder.tsx, Zeile 255
2. **★ Am besten bewertet** — recipe-feed.tsx, Row „rating"
3. **📁 Am häufigsten gespeichert** — recipe-feed.tsx, Row „saves"
4. **♥ Mit deinen Lieblingszutaten** — recipe-feed.tsx, FavoritesRow

## Umsetzung
- Neues kleines Bauteil `SectionTitle` (in recipe-feed.tsx definiert, auch für recipe-builder.tsx importierbar): rendert Emoji in einem `h-9 w-9 rounded-xl` Feld mit farbigem Hintergrund, daneben die Überschrift, flex ausgerichtet.
- Farben pro Bereich (passend zur Shoppi-Palette, Grün #2E7D32 als Anker):
  - Neue Rezept-Kreationen: 🆕 auf zartem Grün
  - Am besten bewertet: ⭐ auf zartem Amber/Gold
  - Am häufigsten gespeichert: 📁 auf zartem Blau
  - Mit deinen Lieblingszutaten: ♥ auf zartem Rot/Rosa
- Keine Text-Änderungen, keine Funktionsänderung — nur die Überschriften.

## Verifikation
- Build-Log prüfen.
- Vorschau /rezepte: alle vier Überschriften mit farbigem Icon prüfen (Screenshot).
