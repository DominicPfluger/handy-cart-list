# Kategorien im Admin-Katalog rekursiv löschen

## Ziel
Beim Löschen markierter Kategorien in der Listenansicht des Admin-Katalogs werden Kategorien **mitsamt allen darunterliegenden Inhalten** gelöscht — statt wie bisher übersprungen.

## Verhalten nach der Änderung
- „Auswahl löschen" löscht jede markierte Kategorie **rekursiv**: alle Unterkategorien (beliebig tief), alle enthaltenen Produkte, Überschriften, Aliase und Übersetzungen.
- Keine Kategorie wird mehr wegen Inhalt übersprungen; der bisherige Hinweis „übersprungen" entfällt.
- Der Bestätigungsdialog warnt deutlich, dass auch alle enthaltenen Produkte und Unterkategorien gelöscht werden (neuer Text, z. B. „X Kategorien inkl. aller enthaltenen Produkte und Unterkategorien löschen?").
- Der Sicherungspunkt vor dem Löschen bleibt bestehen und wird erweitert, damit die Aktion weiterhin per „Rückgängig" rückgängig gemacht werden kann (inkl. Produkte, Unterkategorien, Überschriften, Aliase, Übersetzungen).

## Technische Umsetzung
- `src/routes/_authenticated/admin.tsx`, Funktion `deleteSelectedDepts`:
  - Statt `nonEmpty`-Filter: rekursive Ermittlung aller Nachfahren-IDs (Unterkategorien über `parent_id`, Produkte über `department_id`) aus den bereits geladenen Katalogdaten.
  - Sicherungspunkt um `products`, `product_headings` (beide Richtungen), `department_aliases`, `product_aliases` der betroffenen IDs erweitern.
  - Löschreihenfolge: Produkte → Überschriften → Aliase → Kategorien (tiefste zuerst) → Übersetzungen.
- Übersetzungsschlüssel für den neuen Bestätigungstext in den Sprachdateien ergänzen (de + weitere Locales per Auto-Übersetzung).
- `adm.deleteSkippedNotEmpty` bleibt ungenutzt bzw. wird entfernt.

## Prüfung
- Typprüfung + Build.
- Browser-Test: Kategorie mit Unterkategorie und Produkten in der Listenansicht markieren, löschen, bestätigen — alles weg; Rückgängig stellt alles wieder her.
