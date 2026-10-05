# Rezept-Generator: Länderküche als Button in der Schnellwahl-Reihe

## Ziel
Im Rezept-Generator soll die Länderküchen-Auswahl nicht mehr als volle, eigene Zeile über den Schnellwahl-Buttons erscheinen, sondern als gleichwertiger Pill-Button in der Reihe «♥ Nur Favoriten / Überrasch mich / Neu beginnen». Kein Popup — ein Klick auf den Button klappt die Küchen-Chips inline darunter auf.

## Änderungen

**src/components/recipe-builder.tsx** (Block `catalog.cuisines.length > 0`, ca. Zeilen 532–578):

1. Den bisherigen aufklappbaren Vollbreiten-Button («🌍 Länderküche» mit Pfeil) entfernen.
2. In der Schnellwahl-Reihe (flex-Zeile mit Nur-Favoriten/Überrasch/Neu beginnen, ca. Zeilen 579–595) zuerst einen Länderküchen-Button einfügen, im selben Pill-Stil wie «Nur Favoriten»:
   - Label: `🌍 {t("cuisine.filter")}`
   - Zustand: aktiv (grün gefüllt, wie `onlyFav`) wenn `cuisineOpen` ODER Küchen gewählt sind — so sieht man auch bei zugeklappten Chips, dass ein Filter wirkt.
   - Klick toggelt `cuisineOpen` (bestehender State, default false).
3. Die Chips (bestehende Küchen-Buttons mit `toggleCuisine`) bleiben unverändert, werden aber direkt unterhalb der Button-Reihe gerendert, solange `cuisineOpen` true ist — inline im Seitenfluss, kein Overlay/Popup. Der Hinweistext `cuisine.hint` bei gewählten Küchen bleibt ebenfalls unter den Chips.
4. Zusammenfassung gewählter Küchen: zusätzlich als kleiner grüner Text im Button selbst (truncate), wie bisher — damit man den aktiven Filter auch bei zugeklappten Chips sieht.

Keine neuen i18n-Schlüssel (cuisine.filter, cuisine.hint, cuisine.title existieren bereits).

## Verifikation
- `bunx tsgo --noEmit`
- Playwright-Browser-Check auf http://localhost:8080 (Rezept-Generator einer Kategorie öffnen): Länderküchen-Button steht in der Schnellwahl-Reihe, Chips erscheinen erst nach Klick inline darunter, Auswahl filtert weiter die Zutaten, kein Popup.
