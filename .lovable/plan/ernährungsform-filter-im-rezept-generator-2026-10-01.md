# Ernährungsform-Filter im Rezept-Generator

## Ziel

Im Rezept-Generator lassen sich Ernährungsformen wählen (z. B. Vegan, Glutenfrei); nicht passende Zutaten werden in allen Schritten ausgeblendet — genau wie in der Abteilungsansicht.

## Umsetzung

1. **Filter-Chips im Generator** (`src/components/recipe-builder.tsx`)
   - Unter der Kopfzeile (neben „Nur Favoriten") eine waagerecht scrollbare Zeile mit den 15 Ernährungsform-Chips (Icon + Name, wie in der Abteilungsansicht).
   - Auswahl nutzt den bestehenden `useDietFilter`-Hook — die Wahl gilt damit automatisch auch in der Abteilungsansicht und bleibt auf dem Gerät gespeichert.
2. **Zutaten filtern**
   - In der `steps`-Berechnung: Zutaten ausblenden, deren `excludedDiets` eine gewählte Ernährungsform enthält (gleiche Logik wie `abteilungen.tsx`).
   - Bereits gewählte Zutaten, die durch den Filter ausgeblendet werden, bleiben in der Auswahl sichtbar (wie beim 12er-Aufklappen), damit nichts still verloren geht.
3. **Hinweis bei aktivem Filter**
   - Kleiner Hinweistext „Nicht passende Zutaten werden ausgeblendet" (existiert bereits als `n.hint`), wenn mindestens eine Ernährungsform gewählt ist.

## Technik

- Kein neuer Speicher, keine Datenbankänderung: `use-diet-filter.ts` (localStorage `shoppi:diet-filter`) und die Übersetzungen `n.*` existieren bereits in allen 16 Sprachen.
- `getCatalog` liefert `excludedDiets` bereits mit.

## Prüfung

- In der Vorschau: Generator öffnen, „Vegan" wählen, kontrollieren, dass z. B. Milchprodukte im Müsli-Schritt verschwinden; Filter wieder entfernen; Build-Log prüfen.
