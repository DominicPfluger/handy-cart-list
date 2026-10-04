# Listenübersicht: roter Löschknopf, Umbenennen, einheitliches Vorlagen-Symbol

## Was sich ändert
1. **Roter Löschknopf**: Der Papierkorb in der Listenübersicht (Listen und Vorlagen) wird rot dargestellt – gleich wie im Dialog „Listen bearbeiten".
2. **Umbenennen**: Neuer Stift-Knopf pro Liste (vor dem Vorlagen-Symbol). Ein Tipp macht den Namen zu einem Eingabefeld; Enter oder Wegtippen speichert, Escape bricht ab. Ein Tipp auf den Namen öffnet die Liste weiterhin. Gilt nur für Listen, nicht für Vorlagen.
3. **Vorlagen-Symbol**: Das bisherige Kopier-Symbol wird durch das Dokument-Symbol aus „Listen bearbeiten" ersetzt.

## Technische Details
- `src/components/overview-sortable.tsx`: Optionale `onRename(id, name)`-Prop, lokaler Zustand für die Bearbeitung in `OverviewRow`, `TrashIcon` mit `text-coral`, Vorlagen-SVG (Rechteck + drei Linien) aus `list-manager.tsx` übernehmen. Der `t`-Typ wird um `lm.rename` erweitert (Schlüssel existiert bereits).
- `src/routes/index.tsx`: `onRename={renameList}` an die Listen-Übersicht übergeben.
