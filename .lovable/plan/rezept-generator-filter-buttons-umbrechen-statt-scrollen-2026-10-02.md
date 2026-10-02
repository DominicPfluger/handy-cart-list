# Rezept-Generator: Filter-Buttons umbrechen statt scrollen

## Ausgangslage
Die fünf Buttons (Ernährungsform, Länderküche, Nur Favoriten, Überrasch mich, Neu beginnen) stehen in der Generator-Ansicht bereits nebeneinander in einer Zeile — aber mit `overflow-x-auto` und scrollbar versteckt: Bei langen Beschriftungen muss man seitlich wischen, statt dass die Zeile umbricht.

## Änderung
In `src/components/recipe-builder.tsx` (Button-Zeile, Zeile ~417):

- Container: `flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden` ersetzen durch `flex flex-wrap items-center gap-2` — die Buttons brechen bei fehlendem Platz in die nächste Zeile um, kein seitliches Wischen mehr.
- An den Buttons bleibt `shrink-0 whitespace-nowrap`: Jeder Button bleibt als Ganzes auf einer Zeile (kein Wortumbruch im Button-Text), nur die ganze Zeile bricht um.

Nur diese eine Zeile betroffen. Keine i18n-, Datenbank- oder sonstigen Änderungen; der gleiche Umbau gilt automatisch für die Vorlagen-Ansicht, da beide denselben Code-Zweig nutzen.

## Verifikation
Build prüfen, dann in der Vorschau (Rezepte → Kategorie antippen) auf Handy-Breite (390 px) und Desktop kontrollieren: Alle fünf Buttons sichtbar, umbrechend bei wenig Platz, nichts abgeschnitten.
