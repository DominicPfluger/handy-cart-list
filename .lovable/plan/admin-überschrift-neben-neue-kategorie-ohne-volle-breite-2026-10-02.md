# Admin: „+ Überschrift“ neben „Neue Kategorie“, ohne volle Breite

## Ziel
Der Knopf „+ Überschrift“ wird in beiden Admin-Ansichten direkt neben „+ Neue Kategorie“ angezeigt und nimmt nicht mehr die gesamte Breite ein.

## Änderungen

### 1. Listenmodus (`src/routes/_authenticated/admin.tsx`)
- Den bestehenden Knopf-Zweig in der Werkzeugleiste (Zeile ~395–400, `flex flex-wrap gap-2` mit „+ Kategorie“, „+ Produkt“, …) um „+ Überschrift“ ergänzen:
  - Bedingung: `cur && products.length > 0 && adding !== "heading"` (wie bisher).
  - Gewöhnlicher kleiner `Button size="sm" variant="outline"` — kein `w-full`, kein `border-dashed` nötig.
- Den bisherigen full-width-Knopf über der Produktliste (Zeilen 473–475) entfernen.
- Das Anlegen-Formular (`AddForm` mit `adding === "heading"`) bleibt unverändert — es erscheint weiterhin in der Werkzeugleisten-Zone, was jetzt der Wunschlage entspricht.

### 2. Kachelmodus (`src/components/admin/catalog-tile-editor.tsx`)
- Den „+ Überschrift“-Knopf (Zeilen 187–192) vom alleinstehenden `w-full`-Element in eine Kachel im Kachel-Raster umwandeln, direkt nach der „Neue Kategorie“-Kachel (Zeilen 178–183):
  - Gleicher Kachel-Stil wie „Neue Kategorie“ (`min-h-28`, dashed border, „+“ plus Beschriftung `adm.heading`).
  - Bedingung wie bisher: `p.cur && editMode && p.onAddHeading && p.products.length > 0`.
- Das Eingabeformular für den neuen Titel (Zeilen 193–200) bleibt unverändert bestehen und erscheint weiterhin unterhalb des Rasters.

### 3. i18n
- Keine neuen Texte nötig (`adm.heading`, `tile.newCat` existieren in allen 16 Sprachen).

## Verifikation
- Typprüfung (tsgo) und Build-Check.
- Vorschau: Admin → Katalog → Kategorie öffnen; in beiden Ansichten steht „+ Überschrift“ neben „+ Neue Kategorie“ und ist kompakt.
