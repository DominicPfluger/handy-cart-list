# Listen-Icon in der Listenübersicht entfernen

## Ziel
In der Listen-Hauptansicht (Übersicht aller Einkaufslisten) wird kein Icon mehr vor dem Listennamen angezeigt — Einkaufslisten haben keine Icons. Vorlagen behalten ihr 📋-Symbol zur Unterscheidung.

## Umsetzung

1. **`src/components/overview-sortable.tsx`**
   - `OverviewRowData.emoji` wird optional (`emoji?: string`).
   - In `OverviewRow` wird das Icon-Feld (Zeile 70: `<span …>{row.emoji}</span>`) nur noch gerendert, wenn `row.emoji` gesetzt ist.

2. **`src/routes/index.tsx`**
   - Bei den Listen-Zeilen (Zeile 394–399) wird `emoji: "🛒"` entfernt.
   - Vorlagen-Zeilen (Zeile 422) behalten `emoji: "📋"`.

## Technik
- Keine Datenbank- oder Logikänderung, reine Anzeige.
- Zeilen ohne Icon rücken optisch nach links (Name steht direkt hinter dem Verschiebe-Griff).

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`).
- Browser-Check der Listenübersicht: Listen ohne Icon, Vorlagen weiterhin mit Symbol.
