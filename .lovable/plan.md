# Admin: Stift/Papierkorb neben Zieh-Griff + Icon-Funktionen im Bild-Dialog

## Teil 1 — Produktzeile: Bearbeiten und Löschen neben dem Zieh-Griff

Aktuelle Zeile im Admin-Katalog (`src/components/admin/catalog-tile-editor.tsx`, Zeilen 421–452):

```
[Checkbox] [⠿] [Bild] [Name …………] [✏️] [🏷] [✨] [🗑]
```

Neu — Stift und Papierkorb rücken links neben den Zieh-Griff:

```
[Checkbox] [⠿] [✏️] [🗑] [Bild] [Name …………] [🏷] [✨]
```

- Die beiden bestehenden Buttons (Pencil, Trash2) ausschneiden und direkt nach dem Zieh-Griff-Span vor dem Bild einfügen.
- Funktionalität unverändert: gleiche Handler, `disabled={!editMode}`, Löschen mit Bestätigungsfrage. Varianten- (🏷) und KI-Bild-Knopf (✨) bleiben rechts.

## Teil 2 — Bild-Dialog: Icon (klein) mit voller Funktionsleiste

Die Icon-Zeile (Zeilen 802–815) hat bisher nur „Hochladen" und ein ✕ (bei eigenem Icon). Neu gibt es dort Buttons:

1. **„Beide Bilder gleich"** — übernimmt das grosse Vorschaubild als Icon (aus dem vorhandenen `image_path` abgeleitetes 64px-Icon, als eigenes Icon gespeichert, damit es beim nächsten Vorschaubild-Wechsel bestehen bleibt). Deaktiviert, wenn kein Vorschaubild existiert.
2. **„Bild auswählen"** — öffnet den bestehenden ImagePicker (wie beim Vorschaubild), das gewählte Bild wird als Icon übernommen, ohne das Vorschaubild zu ändern.
3. **„✨ KI-Bild"** — erzeugt ein KI-Bild (gleicher Stil wie Vorschaubild, ohne Kräuter/Zusätze/Gefässe) und verwendet es als Icon für Vorschau und Icon. Bestätigungsfrage vor Credits-Verbrauch. Während der Erzeugung Ladezustand.
4. **„Entfernen"** — bestehende Funktion `clearCustomIcon` (fällt auf das automatische Icon des Vorschaubilds bzw. Emoji zurück), bisher ✕, neu als beschrifteter Knopf (nur bei eigenem Icon sichtbar).

### Technische Details
- Neuer Helfer in `src/lib/product-icon.ts`: `saveCustomIconFromPath(kind, id, path)` — lädt das Bild über signierte URL, erzeugt das 64px-Icon (`makeProductIcon`) und speichert es als eigenes Icon (`icon_path` + `icon_custom: true`, eigener Speicherpfad `product-icons/` bzw. `department-icons/`). Funktioniert für Produkte und Kategorien.
- KI-Icon: nutzt die bestehende Server-Funktion `generateImageFor` (genImg) und wendet danach `saveCustomIconFromPath` an.
- ImagePicker-Wiederverwendung: zweiter Picker-Status `iconPicking` mit eigenem `onPick`-Handler.
- Aktualisierung: nach jeder Aktion `loadIcon(effId)` + Catalog-Cache invalidieren.

### i18n
Neue Schlüssel `adm.iconUseImage` („Beide Bilder gleich"), `adm.iconPick` („Bild auswählen"), `adm.iconAi` („KI-Bild") in `src/i18n/de.ts` und allen 15 weiteren Lokalen in `messages.json`. „Entfernen" nutzt bestehende Schlüssel (`tile.removeImage` / `tile.removeImageConfirm`).

## Verify
Typprüfung, dann Browser-Test: Admin → Katalog → Produktzeile zeigt ⠿/✏️/🗑 links neben dem Bild; Bild-Dialog: „Beide Bilder gleich" übernimmt das Vorschaubild als Icon, Bild auswählen und Entfernen funktionieren, KI-Knopf fragt vor Credits.
