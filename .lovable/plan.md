# Listen-Übersicht nach zugeordnetem Laden gruppieren

## Ziel
In der Listen-Übersicht (erste Ansicht der Einkaufslisten) werden die Listen nach ihrem zugeordneten Laden gruppiert. Jede Gruppe trägt den Ladennamen als Zwischenüberschrift, so sieht man direkt, welche Liste für welches Geschäft gilt.

## Umsetzung

Datei: `src/routes/index.tsx` (Listen-Übersicht, Zeilen ~352–409)

1. `useStores()` aus `src/hooks/use-stores.ts` importieren — sie liefert die Läden in fixer Reihenfolge: „Standard" zuerst, danach die Läden des gewählten Markts, danach eigene Läden.
2. In der Übersicht die Listen vor dem Rendern gruppieren:
   - Laden-Id einer Liste = `listStores[l.id] ?? "default"` (`listStores` ist bereits vorhanden).
   - Gruppen in der Reihenfolge von `useStores()`; Läden ohne Listen bleiben unsichtbar; unbekannte Laden-Ids (z. B. gelöschte Läden) landen in einer Gruppe ganz hinten.
3. Jede Gruppe erhält eine kleine Zwischenüberschrift mit dem Ladennamen (Stil wie bestehende Abschnitts-Überschriften, `text-xs font-semibold text-muted-foreground`).
4. Die Listenzeilen selbst bleiben unverändert (Name + Fortschritt, Klick öffnet die Liste); der bestehende „+ Erstellen"-Button bleibt unterhalb.
5. In jeder Listenzeile zusätzlich den Ladennamen klein anzeigen, falls die Liste einem anderen Laden als der Überschrift zugeordnet ist — nicht nötig, da die Gruppierung das bereits zeigt; daher entfällt dieser Punkt (nur Gruppierung + Überschrift).
6. Innerhalb einer Gruppe bleibt die bestehende Reihenfolge der Listen erhalten (manuelle Sortierung via ListManager).

Keine Änderung an Datenhaltung, i18n-Schlüssel für Ladennamen sind über `useStores()` vorhanden.

## Prüfung
- Typprüfung `bunx tsgo --noEmit`.
- Browser-Test: Übersicht zeigt Gruppen nach Laden; Liste ohne Zuordnung erscheint unter „Standard".
