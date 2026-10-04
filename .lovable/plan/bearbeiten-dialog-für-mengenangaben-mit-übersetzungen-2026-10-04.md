# Bearbeiten-Dialog für Mengenangaben mit Übersetzungen

## Ziel
Der Stift bei einer Mengenangabe im Admin-Tab „Mengenangaben" öffnet einen Dialog statt der Inline-Bearbeitung. Dort sind alle Sprachen mit Bezeichnung und Abkürzung sichtbar und bearbeitbar.

## Dialog
- Kopf: Name der Einheit in der aktuellen Sprache.
- Tabelle mit einer Zeile pro Sprache (16 eingebaute + im Admin angelegte): Flagge/Sprachname, Feld „Bezeichnung", Feld „Abkürzung".
- Felder sind mit dem aktuell angezeigten Text vorausgefüllt (eigene Übersetzung, sonst eingebauter Standardtext). Leere Felder zeigen den Standard als Platzhalter.
- Knopf „Fehlende per KI übersetzen": füllt leere Sprachen anhand der deutschen Bezeichnung.
- „Speichern" übernimmt alle geänderten Sprachen, „Abbrechen" schliesst ohne Änderung.

## Technische Details
- In `src/components/admin/units-panel.tsx`: Inline-Edit in `UnitItem` entfernen; neuer `UnitEditDialog` (shadcn Dialog), Sprachen über `useAllLocales()`.
- Speichern: `labels` jsonb nur mit abweichenden Werten (gleich Standard → Eintrag weglassen), dann `loadUnits()`.
- KI: bestehende `translateUnitLabels` nutzen und nur leere Sprachen übernehmen.
- Neue Texte (Dialogtitel, Spaltenköpfe, KI-Knopf) in allen 16 Sprachen.
