# Admin-Katalog: Kategorien auch als Liste anzeigen

## Ziel
Im Admin-Panel (Katalog) kann die Darstellung der Kategorien und Produkte zwischen der bisherigen Kachelansicht und einer kompakten Listenansicht umgeschaltet werden.

## Umsetzung

1. **Umschalter im Katalog-Tab** (`src/routes/_authenticated/admin.tsx`)
   - Zwei kleine Buttons (Kachel / Liste) oberhalb des Katalogs.
   - Gewählte Ansicht wird geräte-lokal gespeichert (localStorage), damit sie beim nächsten Besuch erhalten bleibt.

2. **Listenansicht** (`src/components/admin/catalog-tile-editor.tsx`)
   - Neue Darstellung im bestehenden `CatalogTileEditor`: Kategorien und Produkte als schmale Zeilen statt Kacheln.
   - Pro Zeile: Icon/Bild, Name, und dieselben Aktionen wie in der Kachelansicht (Bearbeiten-Dialog per Klick, Drag & Drop zum Sortieren/Verschieben, Alias-Kennzeichnung, Überschriften).
   - Navigation in Unterkategorien bleibt wie bisher (Klick auf Kategorie-Zeile öffnet sie).
   - Alle bestehenden Funktionen (Suche, „Liste als Text kopieren“, „Kategorien & Produkte anlegen“, Breadcrumb-Pfad) bleiben in beiden Ansichten verfügbar.

3. **Texte** in `src/i18n/de.ts` ergänzen (z. B. „Kachelansicht“ / „Listenansicht“), Übersetzungen laufen über den bestehenden Auto-Übersetzungsmechanismus.

## Technische Details
- Keine Datenbankänderungen; reine Frontend-Darstellung.
- Datenquelle und Speicher-/Sortier-Callbacks bleiben identisch — die Listenansicht nutzt dieselben Props wie die Kachelansicht.
- Ansichtswechsel als State in `admin.tsx`, an `CatalogTileEditor` als Prop weitergereicht.

## Prüfung
- Typprüfung + Build.
- Browser-Test: Umschalten zwischen beiden Ansichten, Sortieren per Drag & Drop in der Listenansicht, Bearbeiten-Dialog öffnen.
