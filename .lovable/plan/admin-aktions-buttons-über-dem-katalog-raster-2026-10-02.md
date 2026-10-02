# Admin: Aktions-Buttons über dem Katalog-Raster

## Ziel
Im Admin-Bereich (Kachelansicht) stehen die Aktionen „Neue Kategorie", „Neues Produkt", „Mehrere Produkte" und „✨ Fehlende Produkte vorschlagen" als kompakte Button-Zeile oberhalb der Kategorie- und Produktkacheln — alle im gleichen Stil.

## Änderungen

### 1. Button-Zeile oben (`catalog-tile-editor.tsx`)
- Neue Aktionszeile direkt unter der Pfadnavigation / Markt-Auswahl, über dem Kachel-Raster.
- Vier kompakte Buttons im gleichen Stil (`Button variant="outline" size="sm"`, umbrechend):
  - `+ Neue Kategorie` (immer sichtbar im Bearbeiten-Modus)
  - `+ Überschrift` (nur in Kategorien mit Produkten)
  - `+ Neues Produkt` (nur in geöffneter Kategorie)
  - `+ Mehrere Produkte` (nur in geöffneter Kategorie, wenn `onBulkAdd` gesetzt)
  - `✨ Vorschläge` (nur in geöffneter Kategorie)

### 2. Alte Platzierungen entfernen
- Die drei dashed-Kacheln „Neue Kategorie", „+ Überschrift", „Neues Produkt", „Mehrere Produkte" aus dem Kachel-Raster entfernen.
- Die volle-Breite-Zeile „✨ Fehlende Produkte vorschlagen" unter der Produktliste entfernen (öffnet jetzt über den Button oben dasselbe Vorschlags-Fenster).

### 3. Unverändert
- Pfadnavigation, Bearbeiten/Vorschau-Schalter, Drag & Drop, Überschriften-Eingabeformular, Sortier-Steuerung und Aliase bleiben wie sie sind.

## Technik
- Nur `src/components/admin/catalog-tile-editor.tsx` betroffen; bestehende i18n-Keys (`tile.newCat`, `adm.heading`, `tile.newProd`, `adm.multi`, `tile.suggest`) werden wiederverwendet — keine neuen Übersetzungen nötig.
- Sichtbarkeit nur im Bearbeiten-Modus (`editMode`), Vorschau-Modus zeigt keine Buttons.
