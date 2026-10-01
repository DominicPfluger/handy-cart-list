# Länderküchen-Filter im Rezept-Generator

## Ziel
Im Rezept-Generator gibt es einen Länderküchen-Filter, der wie der Ernährungsform-Filter funktioniert: Ein Knopf in der oberen Reihe öffnet ein Auswahlmenü mit allen Länderküchen; gewählte Küchen blenden nicht passende Zutaten aus.

## Umsetzung

### 1. Filter-Logik (`src/components/recipe-builder.tsx`)
- Bestehenden Hook `use-cuisine-filter.ts` (useCuisineFilter, toggleCuisine, setCuisines) wiederverwenden — die Auswahl wird wie beim Ernährungsform-Filter mit der Abteilungsansicht geteilt und bleibt auf dem Gerät gespeichert.
- Neuer State `cuisineOpen` (wie `dietOpen`).
- In der Zutaten-Filterung (Zeile ~86-91) zusätzliche Bedingung: bei aktiven Küchen nur Produkte zeigen, deren `cuisineIds` eine gewählte Küche enthalten; bereits gewählte Zutaten bleiben sichtbar.

### 2. Knopf in der oberen Reihe
- Neuer Pill-Knopf direkt neben „Ernährungsform" mit 🌍-Icon und Text „Länderküche" (`cuisine.filter`), gleicher Stil wie der Ernährungsform-Knopf (grün hinterlegt bei aktiver Auswahl, Umbruch in zweite Zeile bei Platzmangel).

### 3. Auswahlmenü
- Aufklapp-Panel wie beim Ernährungsform-Filter: Überschrift `cuisine.title`, Hinweis `cuisine.hint`, alle Küchen aus `catalog.cuisines` als Chips (Emoji + Name, Mehrfachauswahl, grün markiert wenn aktiv), darunter „Filter zurücksetzen" (`cuisine.reset`) bei aktiver Auswahl.

### 4. Übersetzungen
- Die Schlüssel `cuisine.filter`, `cuisine.title`, `cuisine.hint`, `cuisine.reset` existieren bereits in allen 16 Sprachen (werden in der Abteilungsansicht genutzt) — keine neuen Texte nötig.

## Technische Details
- Datei: `src/components/recipe-builder.tsx` (Import aus `../hooks/use-cuisine-filter`, Filter-Bedingung auf `p.cuisineIds`, Knopf + Panel analog zum Diet-Block, Zeilen 396-452).
- Keine Datenbankänderungen, keine neuen i18n-Schlüssel.

## Prüfung
- Build-Log und Typprüfung.
- Vorschau-Test: Generator öffnen, Küche wählen (z. B. Italienisch), prüfen dass nicht passende Zutaten ausgeblendet werden und die Auswahl mit der Abteilungsansicht geteilt wird.
