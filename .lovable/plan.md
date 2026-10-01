# Rezept-Generator-Kacheln nach unten verschieben

## Änderung
`src/routes/rezepte.index.tsx` — das 2-spaltige Raster mit den 8 Generator-Kacheln (Müsli, Smoothie, Salat, Sandwiches, Pizza, Pfannengericht, Menü-Kombination, Dessert) im umrandeten Block steht aktuell mit `mt-3` (12px) direkt unter dem Generator-Eintrag. Der Abstand wird auf `mt-6` (24px) vergrössert, damit die Kacheln sichtbar tiefer liegen.

Sonst bleibt alles unverändert (Kachelgrösse, Icons ohne Rahmen, Beschriftungen, Generator-Eintrag oben, Blöcke darunter).

## Prüfung
Vorschau auf /rezepte: Kacheln rücken nach unten, kein Layoutbruch; Build-Fehlerprotokoll kontrollieren.
