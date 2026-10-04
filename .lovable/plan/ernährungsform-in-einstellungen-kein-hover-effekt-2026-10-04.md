# Ernährungsform in Einstellungen: kein Hover-Effekt

## Ziel
Der Eintrag „Gewünschte Ernährungsform" unter Einstellungen soll beim Darüberfahren mit der Maus keinen Hervorhebungs-Effekt mehr zeigen.

## Umsetzung
- In `src/routes/mehr.tsx` in der Komponente `DietPreferenceRow` (Zeile ~408) die Klassen `hover:bg-muted active:bg-muted` aus der Kopfzeile entfernen.
- Aufklapp-Pfeil, Icon, Titel und die Chip-Auswahl bleiben unverändert; der Eintrag bleibt klickbar.

## Technische Details
- Nur eine CSS-Klassen-Änderung, keine Logik.
- Danach Typprüfung (`bunx tsgo --noEmit`) und Build-Log prüfen.
