# Plan: Listen-Bearbeitungsdialog + Länderküchen im Rezept-Generator

## 1. Stift-Icon in der Listenübersicht öffnet Bearbeitungsdialog

Aktuell benennt der Stift in der Listenübersicht nur inline um. Neu öffnet er einen Bearbeitungsdialog (Bottom-Sheet) pro Liste mit:

- **Name** — Textfeld zum Umbenennen (ersetzt das Inline-Umbenennen komplett)
- **Markt/Laden** — Auswahl wie beim Erstellen (bestehende Läden + „Neuer Laden" mit Emoji-Auswahl)
- **Reihenfolge** — Position der Liste in der Übersicht verschieben (Schrittweise hoch/runter bzw. Positions-Auswahl 1..n)

Umsetzung:
- Neue Komponente `src/components/list-edit-dialog.tsx` (Bottom-Sheet im Stil des Listen-Managers)
- `src/components/overview-sortable.tsx`: Stift bei Listen ruft `onEdit(id)` statt Inline-Umbenennen; Vorlagen behalten das Inline-Umbenennen
- `src/routes/index.tsx`: Dialog-State, Speichern über `renameList`, `setListStore`, `reorderLists` (bestehende Hooks, keine Datenbankänderung)
- Neue Texte (z. B. `lm.edit`, `lm.position`) in `src/i18n/de.ts` und allen 15 Locale-JSONs

## 2. Länderküchen-Auswahl im Rezept-Generator wieder einbauen

Die früher entfernte Küchen-Auswahl kommt zurück — wie in früheren Versionen, aber nur sichtbar, wenn eine Rezeptkategorie (Vorlage) ausgewählt ist.

Umsetzung:
- `src/components/recipe-builder.tsx`: Küchen-Chips oberhalb der Zutaten-Schritte, gerendert nur wenn `tpl` gesetzt ist
- Filterung der Zutaten über den bestehenden geräte-lokalen Küchen-Filter (`useCuisineFilter`, `shoppi:cuisine-filter`) anhand `product_cuisines`; Non-Food bleibt wie bisher ausgenommen
- Ausgeklappt standardmässig (wie zuletzt bei der Rezeptsuche eingestellt)
- Keine neuen Übersetzungen nötig (bestehende `cuisine.*`-Schlüssel)

## Technische Hinweise

- Keine Datenbankänderungen; beide Änderungen sind rein frontend
- Nach Umsetzung: Typprüfung (`bunx tsgo --noEmit`) und Browser-Test (Dialog öffnen/speichern; Generator mit und ohne Kategorie)
