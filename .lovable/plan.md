# Länderküchen im Rezept-Generator: inline und vor „Nur Favoriten"

## Ziel
Im Rezept-Generator (nach Wahl einer Rezeptkategorie) steht die Länderküchen-Auswahl direkt über der Schnellwahl-Zeile („Nur Favoriten" / „Überrasch mich" / „Zurücksetzen") und ist immer aufgeklappt — die Küchen-Chips sind sofort sichtbar, ohne Aufklapp-Zeile.

## Umsetzung (`src/components/recipe-builder.tsx`)

1. **Block verschieben:** Der Länderküchen-Block (aktuell Zeilen ~550–596, unter der Schnellwahl-Zeile) wandert oberhalb der Zeile mit „♥ Nur Favoriten", „Überrasch mich" und „Zurücksetzen".
2. **Immer inline:** Die Aufklapp-Schaltfläche (🌍 Länderküche + Pfeil) entfällt; stattdessen steht dort eine kleine feste Überschrift „🌍 Länderküche" und darunter direkt die Küchen-Chips. Der State `cuisineOpen` wird entfernt.
3. **Filterlogik bleibt:** Auswahl über `toggleCuisine`, Filterung der Zutaten und der Hinweistext bei gewählten Küchen bleiben unverändert.

Keine neuen Übersetzungen nötig (`cuisine.filter`/`cuisine.hint` existieren). Sichtbar weiterhin nur, wenn eine Rezeptkategorie gewählt ist.

## Prüfung
- Typprüfung `bunx tsgo --noEmit`.
- Browser-Test: Generator mit Kategorie öffnen — Chips stehen über „Nur Favoriten", sind sofort sichtbar und filtern.
