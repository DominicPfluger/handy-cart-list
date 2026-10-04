# Vorlagen umbenennen + Icons enger

## Ziel
1. In der Listen-Übersicht erhält jede Vorlage einen Stift-Symbol zum Umbenennen (wie bei Listen).
2. Die Icons in den Zeilen (Griff, Stift, Vorlage-Speichern, Papierkorb) rücken näher zusammen.

## Änderungen

### 1. Umbenennen für Vorlagen (`src/hooks/use-shopping-list.ts`)
- Interface um `renameTemplate: (id: string, name: string) => void` erweitern.
- Lokaler Modus: `renameTemplateLocal` — `persistLocalTemplates(localTemplates.map(...))` mit neuem Namen.
- Cloud-Modus: Vorlagen sind Listen mit `isTemplate: true` und teilen denselben `updateList`-Pfad — `renameTemplate` nutzt dieselbe Logik wie `renameList` (optimistisches Update in `cloudLists` + `runCloud updateList`).

### 2. Übersicht (`src/routes/index.tsx`)
- `renameTemplate` aus dem Hook destrukturieren.
- Templates-`OverviewSortable` erhält `onRename={renameTemplate}` (Listen-Instanz bleibt unverändert).

Keine neuen i18n-Schlüssel nötig — `lm.rename` existiert bereits.

### 3. Icons enger (`src/components/overview-sortable.tsx`)
- Zeilen-Container: `gap-2` → `gap-0.5`, Icon-Buttons leicht schmaler (`h-9 w-9` → `h-8 w-8`, Touch-Fläche bleibt ausreichend gross).
- Betrifft Listen- und Vorlagenzeilen in der Übersicht.

## Verifikation
- Typprüfung (`bunx tsgo --noEmit`).
- Browser-Check (angemeldet): Stift an einer Vorlage zeigt Umbenennen-Feld; Umbenennen speichert und überlebt Neuladen; Icons stehen enger.
- Keine Testlisten/Vorlagen im Nutzerkonto anlegen — bestehende Vorlage nur umbenennen und den Originalnamen wiederherstellen.
