# Laden-Dropdown nur beim Erstellen einer Liste

## Ziel

Im „Meine Listen"-Popup (Listenübersicht und Detailansicht) erscheint unter jedem Listeneintrag ein Laden-Dropdown (🏪). Dieses wird entfernt. Die Laden-Auswahl bleibt ausschliesslich im Erstellen-Formular („+ Neue Liste") erhalten, inklusive „+ Neuer Laden"-Option.

## Änderungen

Datei: `src/components/list-manager.tsx`

1. **`Row`-Komponente:** Das `<select>` mit der Laden-Auswahl unter dem Listennamen (ca. Zeilen 139–146) entfernen. Die dadurch ungenutzten Props `stores`, `storeId`, `onStoreChange` aus der Komponente und deren Interface entfernen.
2. **Aufrufstelle:** In `ListManager` die Props `stores={stores}`, `storeId={…}`, `onStoreChange={…}` aus dem `<Row>`-Aufruf entfernen; `listStores`/`setListStore` aus `useGroupOrder` dort nicht mehr destrukturieren.
3. **Unverändert bleiben:**
   - Die Laden-Auswahl im Erstellen-Formular (inkl. „+ Neuer Laden") — Liste wird wie bisher mit gewähltem Laden angelegt.
   - Die interne Zuordnung `shoppi:list-stores`: bestehende Listen behalten ihren zugewiesenen Laden, die Listenansicht sortiert weiterhin danach.
   - Umbenennen, Löschen, Verschieben, Vorlagen — alles unverändert.

## Folge

Bestehende Listen lassen sich nachträglich nicht mehr über dieses Popup einem anderen Laden zuordnen (das war ausdrücklich gewünscht). Falls später doch ein Ändern gewünscht wird, wäre ein Platz dafür z. B. die Detailansicht der Liste.

## Prüfung

- Typprüfung (`bunx tsgo --noEmit`).
- Browser-Check: Listenübersicht öffnen → Popup zeigt Einträge ohne Laden-Dropdown; Erstellen-Formular zeigt weiterhin die Laden-Auswahl.
