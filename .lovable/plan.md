# Rezept-Generator-Kategorien in den Rezept-Generator-Rahmen integrieren

## Ziel
Auf der Rezepte-Hauptseite (`/rezepte`) sollen die 8 Kategorie-Kacheln (Müsli, Smoothie, …) nicht mehr als eigener Block unterhalb, sondern **innerhalb** des umrandeten „Rezept-Generator"-Blocks erscheinen.

## Aktueller Zustand
`src/routes/rezepte.index.tsx`: Überschrift → großer 🧑‍🍳 Rezept-Generator-Link (eigener Rahmen) → Grid mit 8 Kategorie-Kacheln (eigene Rahmen) → Rezept-Listen → Rezept-Inspirationen.

## Umsetzung (nur `src/routes/rezepte.index.tsx`)
- Den Rezept-Generator-Block von einem `Link` in einen umrandeten Container (`rounded-2xl border bg-card p-4`) umwandeln.
- Oben im Container bleibt die Kopfzeile mit 🧑‍🍳-Icon, Titel und Beschreibung — klickbar als Link zu `/rezepte/generator` (ohne Kategorie, öffnet den Generator generisch).
- Darunter (im selben Rahmen) das bestehende 4-spaltige Grid mit den 8 Kategorie-Kacheln, jedes Kachel bleibt ein eigener Link zu `/rezepte/generator?cat=…`.
- Keine verschachtelten Links (HTML-Regel): Der Rahmen ist ein `div`, nur Kopfzeile und Kacheln sind Links.
- Rezept-Listen und Rezept-Inspirationen bleiben unverändert darunter.

## Ergebnis
```text
Rezepte
┌─────────────────────────────┐
│ 🧑‍🍳 Rezept-Generator        │ ← Kopfzeile klickbar
│ Beschreibung …              │
│ ┌────┬────┬────┬────┐       │
│ │Müsli│Smth│Salat│Sandw│      │ ← 8 Kategorien im Rahmen
│ └────┴────┴────┴────┘       │
└─────────────────────────────┘
📁 Rezept-Listen
✨ Rezept-Inspirationen
```

Keine Text-/Übersetzungsänderungen, keine Datenbankänderung.
