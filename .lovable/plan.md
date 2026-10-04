# Favoriten: Icons so gross wie in der Abteilungsansicht

## Ziel
Die Produkt-Icons auf der Favoriten-Seite sollen exakt dieselbe Grösse und Form haben wie die Produktzeilen in der Abteilungsansicht (`/abteilungen`).

## Aktueller Stand (geprüft)
- Abteilungsansicht (`src/routes/abteilungen.tsx`, Produktzeile): Icon-Container `h-12 w-12` mit `rounded-lg`, Emoji-Fallback `text-4xl`.
- Favoriten (`src/routes/favoriten.tsx`, `renderRow`): Icon-Container `h-14 w-14` mit `rounded-xl`, Emoji-Fallback `text-3xl` — dadurch erscheinen die Icons dort grösser bzw. die Symbole kleiner.

## Änderung (nur `src/routes/favoriten.tsx`)
1. Im Icon-Container der Favoriten-Zeilen: `h-14 w-14` → `h-12 w-12` und `rounded-xl` → `rounded-lg`.
2. In `ProductThumb`: `symbolClassName="text-3xl"` → `"text-4xl"`.

Damit stimmen Bildgrösse, Eckenradius und Emoji-Fallback mit der Abteilungsansicht überein — für normale Favoriten, Varianten-Favoriten und Suchtreffer auf der Favoriten-Seite (alle nutzen dieselbe Zeilen-Renderfunktion). Keine anderen Ansichten betroffen.

## Verifikation
- Typprüfung (`bunx tsgo --noEmit`) und Build.
- Browser-Check: Favoriten-Seite und Abteilungsansicht gegenüberstellen, gleiche Icongrösse bestätigen.
