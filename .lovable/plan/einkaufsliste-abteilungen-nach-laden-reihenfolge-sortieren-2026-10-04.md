# Einkaufsliste: Abteilungen nach Laden-Reihenfolge sortieren

## Stand

Die gewünschte Funktion ist bereits umgesetzt und im Browser verifiziert:

- Die Einkaufsliste gruppiert Artikel nach der obersten Katalog-Abteilung und sortiert die Gruppen nach der in den Einstellungen gespeicherten Abteilungs-Reihenfolge des der Liste zugeordneten Ladens (`shoppi:list-group-order`, pro Laden).
- Manuell eingetippte Artikel (feste Kategorien wie „Obst & Gemüse", „Milchprodukte", „Backwaren") werden über eine Zuordnungstabelle der passenden Abteilung zugeordnet (z. B. „Obst & Gemüse" → „Frischmarkt"), damit auch sie der gespeicherten Reihenfolge folgen.
- Gruppen ohne Zuordnung bleiben wie bisher am Ende.
- Browser-Test bestätigt: Nach Umordnen in den Einstellungen erscheint die Liste exakt in der neuen Reihenfolge.

## Plan

Keine Code-Änderungen nötig. Einziger Schritt: kurze erneute Verifikation im Browser, dass die Listen-Reihenfolge der im gewählten Geschäft gespeicherten Abteilungs-Reihenfolge entspricht (bereits erfolgt — dient nur als Bestätigung).

## Technische Details

- `src/routes/index.tsx`: `rootForCategory`/`CATEGORY_ROOT_NAMES` bildet manuelle Kategorien auf Root-Abteilungen ab; `grouped` nutzt `chainOf(leaf)[0]` bzw. Fallback-Abteilung als Gruppenschlüssel; Sortierung über `applyGroupOrder` aus `use-group-order.ts` mit der Store-ID aus `shoppi:list-stores`.
- Keine neuen i18n-Schlüssel, keine Schema-Änderungen.
