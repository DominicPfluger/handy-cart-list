# Einstellungen: Hover bei „Ernährungsform" ergänzen

## Ausgangslage
Die Kopfzeile von „Ernährungsform" in Einstellungen (`DietPreferenceRow` in `src/routes/mehr.tsx`, ca. Zeilen 397–437) ist ein Ghost-Button ohne Hintergrund-Hover. Alle anderen Einstellungszeilen (z. B. Abteilungs-Reihenfolge in `src/components/store-order-settings.tsx`, Untermenü-Einträge) reagieren mit `transition active:bg-muted` bzw. Hover auf das Antippen.

Die ausgeklappte Auswahl (Chips) bleibt unverändert — Nutzerbestätigung: nur der Hover wird repariert.

## Änderung
1. In `DietPreferenceRow` (`src/routes/mehr.tsx`) die Kopfzeile vom `Button variant="ghost"` auf einen normalen Button mit demselben Zeilen-Stil wie die anderen Untereinträge umstellen:
   - `className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted active:bg-muted"`
   - Aufklapp-Pfeil, Icon und Titeltext bleiben wie bisher.
2. Keine Änderung am ausgeklappten Auswahlbereich, an i18n oder an der Logik.

## Prüfung
- Typprüfung `bunx tsgo --noEmit` und Build.
- Browser-Check in Einstellungen: Kopfzeile zeigt Hover-Effekt, Auf-/Zuklappen und Chip-Auswahl funktionieren wie bisher.
