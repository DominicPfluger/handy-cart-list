# Bildergalerie in den oberen Container des Bilder-Tabs verschieben (mit Suchfeld)

## Ziel
Im Admin-Tab „Bilder" erscheint die Bildergalerie (Kategorie-Bildergalerie) nicht mehr als eigener Container unterhalb von „Produkte ohne Bild", sondern innerhalb des oberen Containers — direkt unterhalb der Liste „Produkte ohne Bild". Die Galerie erhält zusätzlich ein Suchfeld (Produktname), das die Kacheln innerhalb der gewählten Kategorie filtert.

## Umsetzung

### 1. `src/components/admin/category-image-gallery.tsx`
- Neuer State `q` (Suchtext).
- `items` zusätzlich nach Produktname filtern: `p.name.toLowerCase().includes(q.toLowerCase())` (Suchtext getrimmt; leerer Text = kein Filter).
- Suchfeld (`type="search"`, Placeholder `adm.noImg.search`, gleiche Optik wie in „Produkte ohne Bild", `w-36`) in die Kopfzeile neben dem Kategorien-Dropdown setzen.
- Bei Suche/Filterwechsel Limit auf `PAGE` (24) zurücksetzen.
- Keine neuen i18n-Schlüssel nötig (vorhandenes `adm.noImg.search` wiederverwenden).

### 2. `src/components/admin/catalog-media-panel.tsx`
- Die Galerie aus dem eigenen `<section>`-Container herauslösen und innerhalb des Containers von „Produkte ohne Bild" rendern:
  - `CategoryImageGallery` als Kind unterhalb des Listen-Blocks von `MissingImagesPanel` einfügen (innerhalb desselben `rounded-2xl border`-Containers), mit oberer Trennlinie (`border-t border-border pt-4`) statt `mt-8`-Abstand.
  - Praktisch: `MissingImagesPanel` bekommt eine `children`-Prop und rendert sie nach dem „Weitere laden"-Button am Ende des Abschnitts; `catalog-media-panel.tsx` übergibt `<CategoryImageGallery … />` als Kind.
- Der bisherige, eigene Galerie-Container (`mt-8 rounded-2xl …` + eigener Titel/Hinweis) entfällt; der KI-Bilder-Abschnitt und die durchsuchbare Gesamt-Galerie am Seitenende bleiben unverändert.

### 3. Reihenfolge im Bilder-Tab (unverändert sonst)
```text
[ Oberer Container ]
  Produkte ohne Bild (Liste, Suche, Filter, Aktionen)
  ──────────────────────────────
  Bildergalerie (Kategorie-Dropdown + Suchfeld, Kacheln, „Mehr laden")
[ KI-Bilder erzeugen ]
[ … restliche Abschnitte ]
```

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`), Build über `/tmp/observability/build-errors.log`.
- Browser-Test im Bilder-Tab: Galerie steht im oberen Container unterhalb von „Produkte ohne Bild"; Suchfeld filtert Kacheln (z. B. „Apfel"); Kategorie-Wechsel setzt Suche/Limit zurück; Klick auf Kachel öffnet den Bearbeitungsdialog.
