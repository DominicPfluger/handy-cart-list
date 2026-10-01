# Ernährungsform-Text im Rezept-Generator vollständig anzeigen

## Ziel
Im Rezept-Generator zeigt die Ernährungsform-Schaltfläche oben (neben „Nur Favoriten", „Überrasche mich", „Zurücksetzen") aktuell nur das 🥗-Icon ohne Beschriftung. Der Text „Ernährungsform" soll künftig neben dem Icon vollständig sichtbar sein — nicht abgeschnitten und nicht verkürzt.

Die Abteilungsansicht bleibt unverändert.

## Umsetzung
Datei: `src/components/recipe-builder.tsx` (Bereich mit dem Filter-Buttons im Generator-Header)

- Die Ernährungsform-Schaltfläche bekommt denselben Pill-Stil wie die Nachbar-Buttons: Emoji + Text `t("diet.filter")` nebeneinander.
- `whitespace-nowrap` sorgt dafür, dass die Beschriftung in allen 16 Sprachen komplett angezeigt wird; bei Platzmangel rückt der Button wie bisher in eine zweite Zeile (flex-wrap der Reihe).
- Aktive Filter bleiben grün hinterlegt (bg-primary), mit Anzahl-Anzeige im `title`-Attribut wie bisher.
- Klick-Verhalten (Auf-/Zuklappen des Auswahlmenüs) unverändert.

## Prüfung
- Build fehlerfrei.
- In der Vorschau (mobile Viewport 393×852): Generator öffnen, prüfen, dass „Ernährungsform" ganz lesbar neben dem Icon steht und die Reihe bei Platzmangel sauber umbricht.
- Kurz prüfen, dass die Abteilungsansicht unverändert ist.
