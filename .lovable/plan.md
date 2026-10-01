# Fehlende Einheiten in der Produkt-Detailseite wiederherstellen

## Ursache
Die App kennt 33 Einheiten. Die Datenbank erlaubt als Standard-Einheit eines Produkts aber nur 22. Die Produkt-Detailseite zeigt deshalb nur diese 22 an. Die übrigen 11 sind nicht gelöscht, sie fehlen nur in dieser Auswahl:

Portion, Sack, Eimer, Becher, Tube, Netz, Palette, Tablett, Rolle, Blister, Sixpack

In der Einkaufsliste kannst du sie weiterhin auswählen.

## Lösung
1. Die Datenbank so erweitern, dass sie auch diese 11 Einheiten als Standard-Einheit annimmt.
2. Die Filterung in der Produkt-Detailseite entfernen, damit dort wieder alle 33 Einheiten zur Auswahl stehen.
3. Prüfen: Produkt öffnen, „Palette“ oder „Sixpack“ wählen, speichern, neu laden. Die gewählte Einheit muss danach noch eingestellt sein.

Übersetzungen sind für alle 16 Sprachen schon vorhanden.

## Technische Details
- Migration: `ALTER TYPE public.unit_of_measure ADD VALUE IF NOT EXISTS '<id>'` für portion, sack, eimer, becher, tube, netz, palette, tablett, rolle, blister, sixpack.
- `src/routes/produkt.$id.tsx`: `DB_UNITS`-Set entfernen, `units = getUnits(locale)`.
