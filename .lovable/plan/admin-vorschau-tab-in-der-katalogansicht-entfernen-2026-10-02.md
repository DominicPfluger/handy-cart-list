# Admin: Vorschau-Tab in der Katalogansicht entfernen

## Ziel
Der Umschalter „Bearbeiten / Vorschau" oben in der Admin-Katalogansicht (Kachelansicht) entfällt. Die Ansicht ist immer im Bearbeiten-Modus, da Kacheln in beiden Modi weitgehend identisch aussehen.

## Änderungen (`src/components/admin/catalog-tile-editor.tsx`)

1. **Umschalter entfernen**: Die Button-Leiste „Bearbeiten / Vorschau" (editMode-State) wird komplett entfernt.
2. **Immer Bearbeiten-Modus**: `editMode` wird als Konstante `true` geführt (oder der State entfernt und alle `editMode &&`-Bedingungen bleiben dauerhaft aktiv):
   - Aktions-Buttons (Neue Kategorie, Überschrift, Neues Produkt, Mehrere Produkte, Vorschläge) immer sichtbar
   - Stift-Symbole auf Kacheln, Drag & Drop, Überschriften-Bearbeitung, Sortier-Steuerung immer aktiv
3. **Hinweistext**: Der Hinweis `tile.hint` („Ziehen zum Verschieben …") bleibt sichtbar, da Drag & Drop weiterhin gilt.
4. **Verhalten unverändert**: Klick auf eine Kategorie navigiert weiterhin in die Unterkategorie; Klick auf ein Produkt öffnet das Bearbeiten-Fenster (bisher nur im Bearbeiten-Modus — wird jetzt Standard).

## Technik
- Nur `catalog-tile-editor.tsx` betroffen; keine i18n- oder Datenbankänderungen. Ungenutzte Keys `tile.edit`/`tile.preview` bleiben in den Sprachdateien (harmlos).
- Kein Eingriff in `admin.tsx` nötig.
