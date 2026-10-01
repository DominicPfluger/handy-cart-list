# Ernährungsform-Button im Suchfeld: nur Icon, Text bei Mouse-Over

## Ausgangslage
- Im Suchfeld der Abteilungsansicht (`src/routes/abteilungen.tsx`, Zeile ~389–396) steht ein Button mit „🥗 Ernährungsform · N".
- Die Liste (Startseite) hat keinen solchen Button — nur die Abteilungsansicht ist betroffen.

## Änderung
- Button im Suchfeld auf reines Icon umstellen: nur noch das 🥗-Emoji behalten, Text und „· N" aus dem sichtbaren Label entfernen.
- Den vollständigen Text („Ernährungsform", bei aktiven Filtern inkl. Anzahl) als `title`-Attribut setzen — erscheint bei Mouse-Over als Tooltip.
- Padding des Buttons für die kleinere Icon-Form anpassen (z. B. `px-2 py-1.5`).
- Aktiven-Zustand (grün hinterlegt) und Klick-Verhalten (Filter auf-/zuklappen) unverändert lassen.

## Verifikation
- Build prüfen (`/tmp/observability/build-errors.log`).
- Playwright: Abteilungsansicht öffnen, prüfen, dass der Button nur das Icon zeigt und das `title`-Attribut den Text „Ernährungsform" trägt.
