# Admin-Panel: separater Bereich für Zutaten-Zuweisung

## Ziel
Die Rezeptverwaltung im Tab „Rezepte & Küchen“ wird in zwei eigenständige, aufklappbare Bereiche geteilt: Verwaltung und Zutaten-Zuweisung.

## Umsetzung

### 1. Aufteilung in zwei Bereiche (`src/components/recipe-admin.tsx`)
- **Bereich „Rezept-Verwaltung“** (bisheriger Bereich, umbenannt): Vorlagen-Verwaltung (⚙️), Zutatenbereiche/Schritte, Oberkategorien, Beliebte Kombinationen, Vorschau.
- **Neuer Bereich „Zutaten-Zuweisung“**: eigener aufklappbarer Abschnitt mit eigenem Titel und Pfeil, darunter:
  - Vorlagen-Auswahl (Kacheln)
  - Zutatensuche über alle Bereiche
  - Zugewiesene Produkte je Zutatenbereich (aufklappbar, Drag & Drop, Oberkategorie-Auswahl, Sortierung)
  - „Aus Katalog“ inkl. Katalogsuche
  - KI-Vorschläge mit Bestätigung
- Beide Bereiche unabhängig auf- und zuklappbar; geöffnete Zustände und Eingaben bleiben beim Umschalten erhalten.
- Geteilte Daten (Vorlagen, Schritte, Produkte, Gruppen) werden weiterhin einmal geladen und beiden Bereichen zur Verfügung gestellt — entweder als zwei Komponenten mit gemeinsamem Daten-Layer oder als eine Komponente mit zwei Sektionen.

### 2. Vorlagen-Auswahl
- Die Vorlagen-Kacheln erscheinen im Zuweisungs-Bereich; die gewählte Vorlage steuert nur die Zutaten-Zuweisung.
- Die Verwaltung (Schritte, Beliebte Kombinationen, Vorschau) behält ihre eigene Vorlagen-Wahl oder folgt der gleichen Auswahl — Umsetzung: getrennte Auswahl-Zustände, damit beide Bereiche unabhängig arbeiten.

### 3. Beschriftungen
- Neue i18n-Texte (z. B. „Rezept-Verwaltung“, „Zutaten-Zuweisung“) auf Deutsch und in allen 15 weiteren App-Sprachen.

### 4. Prüfung
- Typcheck und Build.
- Browser-Test (Desktop + Handy): beide Bereiche unabhängig aufklappbar, Zuweisung, Suche und „Aus Katalog“ funktionieren wie bisher.

## Technische Details
- Datei: `src/components/recipe-admin.tsx` (Aufteilung, ggf. neue Komponente `recipe-assign-admin.tsx` mit geteilten Server-Funktionen aus `catalog.functions.ts`).
- i18n: `src/i18n/de.ts` + `messages.json` (15 Locales).
- Keine Datenbankänderungen, keine KI-Aufrufe ohne Bestätigung.
