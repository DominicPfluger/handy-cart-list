# Zutatenanzahl entfernen — Zutaten in der Beschreibung zeigen

## Ausgangslage (geprüft)
- Die Community-Rezept-Karten auf `/rezepte/inspirationen` (Bereich „🌍 Community-Rezepte") zeigen unten rechts „X Zutaten · Datum" (`cm.ingredientsN` in `src/components/community-section.tsx`).
- Die Beschreibungszeile der Karte zeigt heute: Beschreibung, sonst die ersten 4 Zutaten.

## Änderungen (nur `src/components/community-section.tsx`)

1. **Zutatenanzahl entfernen:** In der Fusszeile der öffentlichen Karten entfällt „X Zutaten" — dort steht nur noch das Datum neben dem Autor.

2. **Zutaten in der Beschreibung anzeigen:** Die Beschreibungszeile zeigt die enthaltenen Zutaten mit, z. B. „Beschreibungstext · Zutat 1, Zutat 2, Zutat 3 …". Ohne eigene Beschreibung stehen nur die Zutaten dort. Die Zeile bleibt einzeilig und wird mit Auslassungspunkten abgeschnitten — die Zutatenliste muss nicht vollständig sein.

## Nicht geändert
- Die Karten in „Am besten bewertet" / „Am häufigsten gespeichert" und „Lieblingszutaten" (zeigen bereits Beschreibung + Bewertungs-Badge, keine Zutatenanzahl).
- Rezept-Detailseite und Rezept-Generator bleiben unverändert.
- Der Übersetzungsschlüssel `cm.ingredientsN` bleibt in den Dateien (ungestört, falls später wieder gebraucht).

## Verifikation
- Build prüfen; in der Vorschau die Community-Karten auf `/rezepte/inspirationen` ansehen: keine Zutatenanzahl mehr, Zutaten in der Beschreibungszeile, abgeschnitten mit „…".
