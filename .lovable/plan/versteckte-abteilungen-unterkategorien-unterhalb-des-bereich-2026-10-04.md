# Versteckte Abteilungen & Unterkategorien unterhalb des Bereichs anzeigen

## Hintergrund (geprüft)
- In `src/components/category-order-settings.tsx` gibt es bereits eine Liste „Ausgeblendete Abteilungen" mit „Wieder einblenden"-Link.
- Sie steht aber **innerhalb** des aufklappbaren Inhalts von „Abteilungen ordnen & umbenennen" (`{open && ...}`-Block, Zeilen 206–218) — sie ist nur sichtbar, wenn der Bereich aufgeklappt ist.
- Die Liste enthält bereits alle Stufen: `hiddenDepts` filtert das komplette `departments`-Array (Haupt- und Unterkategorien), da alle Ebenen mit `parentId` in einer Liste liegen.

## Änderung
Nur `src/components/category-order-settings.tsx`:

1. Den bestehenden Block „Ausgeblendete Abteilungen" (mit „Wieder einblenden"-Link pro Eintrag) aus dem `{open && ...}`-Inhalt herauslösen.
2. Ihn **unterhalb des gesamten Bereichs** rendern — außerhalb des Aufklapp-Inhalts, direkt unter dem Bereich „Abteilungen ordnen & umbenennen" — sodass er auch bei zugeklapptem Bereich sichtbar ist.
3. Sichtbar nur, wenn `hiddenDepts.length > 0` (bestehende Logik bleibt).

## Nicht geändert
- `use-hidden-departments.ts` (Speicher/Wiederherstellen funktioniert wie bisher, geräte-lokal).
- Titel/Texte (`store.hiddenTitle`, `store.unhide`) bleiben; keine neuen Übersetzungen nötig.
- Keine Datenbankänderung.

## Verifikation
- Typprüfung `bunx tsgo --noEmit`.
- Playwright-Check auf `/mehr`: Bereich zugeklappt → versteckte Liste mit Wiederherstellen-Link sichtbar; Klick stellt wieder her.
