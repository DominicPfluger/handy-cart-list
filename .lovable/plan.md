# Plan: Sprache, Markt & „Alle Märkte anzeigen" unterhalb von „Abteilungs-Reihenfolge"

## Aktuell
Auf „Mehr" stehen die Zeilen **Sprache** (Sprachwahl), **Markt** (MarketRow) und **Alle Märkte anzeigen** (AllMarketsRow) weiter unten in der Karte „Sprache & Admin" (`src/routes/mehr.tsx`, Zeilen 249–300). „Abteilungs-Reihenfolge" ist eine eigene Karte weiter oben (Zeilen 131–133).

## Änderung (nur `src/routes/mehr.tsx`)
1. Direkt unterhalb der Karte „Abteilungs-Reihenfolge" eine neue Karte (`rounded-2xl border bg-card`, `divide-y`) einfügen mit:
   - Sprachwahl-Zeile (bestehendes Markup, unverändert)
   - `<MarketRow />`
   - `<AllMarketsRow />`
2. Diese drei Zeilen aus der unteren Karte „Sprache & Admin" entfernen. Dort bleiben: Icon-Set, Bilder vorab laden, Schriftgrösse, Vorlese-Sprache, Vorlese-Tempo, Admin-Link, Feedback-Postfach.

Keine Logik-Änderungen, keine i18n-Änderungen — nur Umordnung.

## Prüfung
- Typecheck `bunx tsgo --noEmit`
- Browser: Reihenfolge auf „Mehr" prüfen (Abteilungs-Reihenfolge → neue Karte mit Sprache/Markt/Alle Märkte), alte Position leer.
