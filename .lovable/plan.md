# Admin-Produktauflistung: kleines Icon statt grosses Bild

## Ziel
In der Produktauflistung des Admin-Panels (Katalog-Tab, Listenansicht unterhalb der Kategorien-Kacheln) soll jedes Produkt sein kleines Icon (64-px-Icon) anzeigen statt des grossen Vorschaubilds. Fällt zurück auf: Icon → Vorschaubild → Emoji.

## Änderungen

### 1. `src/routes/_authenticated/admin.tsx`
- Type `Prod` um `icon_path: string | null` erweitern; Type `Dept` ebenfalls.
- Beide paged-Selects (Zeilen 76–77) um `icon_path` ergänzen. Die Daten fliessen automatisch in den Kachel-Editor (Objekte werden per Spread übergeben, inkl. Alias-Produkte).

### 2. `src/components/admin/catalog-tile-editor.tsx`
- `TileDept` und `TileProd` um `icon_path?: string | null` erweitern.
- Signatur-Liste `paths` (Zeile 149): sowohl `icon_path ?? image_path` (Anzeige) als auch `image_path` (für die Zoom-Funktion per Doppelklick) aufnehmen.
- Produkt-Zeile (Zeile 456): statt `img(x.image_path)` jetzt `img(x.icon_path ?? x.image_path)` rendern.
- Doppelklick-Zoom (Zeile 454) bleibt beim grossen Bild (`x.image_path`) — unverändert.
- Kategorien-Kacheln (Zeile 364) bleiben beim grossen Bild — die Anfrage betrifft nur die Produktauflistung.

## Verifikation
- Build prüfen.
- Playwright: Admin → Katalog, Abteilung mit Produkten mit Icon öffnen; Zeilen-Thumbnail zeigt das kleine Icon, Doppelklick zeigt das grosse Bild.
