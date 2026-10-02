# Rezept-Generator: Filter-Buttons nebeneinander

## Ziel
In der Generator-Ansicht des Rezept-Generators stehen die fünf Buttons **Ernährungsform, Länderküche, Nur Favoriten, Überrasch mich, Neu beginnen** sauber nebeneinander in einer Zeile (mit Umbruch auf kleine Screens), statt rechts neben dem „← Zurück"-Link gequetscht zu werden.

## Aktueller Zustand (bestätigt)
`src/components/recipe-builder.tsx`, Zeilen ~412–455: Die Kopfzeile ist `flex items-start justify-between` — links der Zurück-Link, rechts ein `flex flex-wrap justify-end`-Container mit den fünf Buttons. Auf schmalen Screens drängen sich Zurück-Link und Buttons in eine Zeile, die Buttons brechen unruhig um.

## Umsetzung (nur `src/components/recipe-builder.tsx`)
1. Die Kopfzeile aufbauen:
   - Zeile 1: der Zurück-Link (wie bisher, eigener Block).
   - Zeile 2: die fünf Buttons in einem eigenen, voll breiten Container `flex flex-wrap items-center gap-1.5`.
2. Styles der einzelnen Buttons unverändert lassen (aktive Zustände, Emojis, Grössen).

## Nicht geändert
- Verhalten der Buttons (Öffnen der Ernährungsform-/Länderküchen-Panels, Favoriten-Filter, Überrasch mich, Neu beginnen).
- Keine i18n-, Datenbank- oder sonstigen Änderungen.

## Verifikation
- Build prüfen; in der Vorschau Rezepte → Generator öffnen und prüfen, dass alle fünf Buttons nebeneinander in einer Reihe stehen (Desktop- und Mobil-Breite).
