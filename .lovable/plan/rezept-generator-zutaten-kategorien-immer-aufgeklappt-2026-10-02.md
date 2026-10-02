# Rezept-Generator: Zutaten-Kategorien immer aufgeklappt

## Ziel

Im Rezept-Generator werden die Zutaten-Kategorien (z. B. Teig, Sauce, Käse) innerhalb einer geöffneten Zutaten-Ebene **immer aufgeklappt** angezeigt: Die Produkte stehen sofort sichtbar daneben, ohne Pfeil (▲/▼) und ohne Aufklapp-Interaktion. Der umrandete Kategorie-Bezeichner (rounded-full mit Emoji + Name) bleibt unverändert.

## Änderungen (nur Darstellung, keine Datenlogik)

Datei: `src/components/recipe-builder.tsx`, Kategorien-Zweig innerhalb einer Zutaten-Ebene.

1. **Pfeil entfernen**: Den `▲/▼`-Span am Kategorie-Bezeichner löschen.
2. **Immer offen**: Die Kategorie-Kachel wird nicht mehr als Aufklapp-Knopf gerendert, sondern nur noch als Kennzeichnung (gleiches Styling wie bisher). `openGroups`-State und sein Umschalten entfallen; alle Gruppen gelten als offen.
3. **Produkte sofort zeigen**: Die Produkte jeder Kategorie erscheinen direkt beim Laden (bisher erst nach Antippen). Der "Weitere anzeigen"-Knopf pro Kategorie (maximal 10 zuerst) und das Zurücksetzen von `visibleCount` beim Vorlagenwechsel bleiben unverändert.
4. **Gewählte Zutaten**: Da alle Kategorien immer offen sind, entfällt der separate "gewählte Zutaten"-Block am Ende der Ebene — gewählte Zutaten erscheinen direkt in ihrer Kategorie (bestehendes Verhalten: gewählte bleiben trotz "Weitere anzeigen" sichtbar).
5. Keine Änderungen an Zuordnungen, gespeicherten Rezepten, Suche innerhalb der Ebene, i18n-Texten oder Farben.

## Abgrenzung

- Die Suche innerhalb einer Zutaten-Ebene und das "Weitere anzeigen" der Ebene selbst bleiben wie sie sind.
- Nur der Rezept-Generator ist betroffen; andere Bereiche (Rezeptseiten, Admin) bleiben unverändert.

## Prüfung

- Typcheck.
- Browser-Test (Playwright): Smoothie-Vorlage öffnen, prüfen dass Produkte aller Kategorien sofort sichtbar sind, kein Pfeil mehr erscheint, "Weitere anzeigen" pro Kategorie weiterhin funktioniert und die Auswahl klickbar bleibt.
