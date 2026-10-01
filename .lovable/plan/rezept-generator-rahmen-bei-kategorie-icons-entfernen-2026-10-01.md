# Rezept-Generator: Rahmen bei Kategorie-Icons entfernen

## Änderung
- In `src/routes/rezepte.index.tsx` (Zeile 65) die 8 Generator-Kategorie-Kacheln (Müsli, Smoothie, Salat, Sandwiches, Pizza, Pfannengericht, Menü-Kombination, Dessert) vom Rahmen befreien: `border border-border` aus der Klassenliste entfernen.
- Hintergrund (`bg-background`) und alles andere (2-spaltiges Layout, 64px-Icon-Kästchen, Beschriftung) bleiben unverändert.
- Der äussere umrandete Block und die Einträge darunter (Inspirationen, Listen) behalten ihren Rahmen.

## Prüfung
- Build-Fehlerprotokoll kontrollieren.
- Vorschau auf `/rezepte`: 8 Kacheln ohne sichtbare Umrandung, Layout unverändert.
