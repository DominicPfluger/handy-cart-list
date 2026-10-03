# Zwei Bilder pro Produkt und Kategorie: Icon + grosses Vorschaubild

## Heute
- Produkte: ein Bild; das kleine Icon wird daraus automatisch verkleinert (nicht separat wählbar).
- Kategorien: nur ein einziges Bild, kein separates Icon.

## Neu
Im Admin-Bild-Dialog (Katalog, Klick aufs Bild bzw. Bild-Bereich im „Erweitert"-Dialog) gibt es für Produkte **und** Kategorien zwei Felder nebeneinander:

1. **Icon** (klein, für Listenzeilen und Kacheln) — hochladen, KI-Bild (mit Credits-Bestätigung), löschen.
2. **Vorschaubild** (gross, für Abteilungsansicht und Einzelansicht) — hochladen, KI-Bild (mit Bestätigung), löschen.

Verhalten:
- Wird nur ein Vorschaubild hochgeladen und kein eigenes Icon, wird das Icon wie bisher automatisch daraus verkleinert.
- Ein eigenes Icon wird nie durch ein neues Vorschaubild überschrieben (Markierung „eigenes Icon").
- Fehlt das Vorschaubild, zeigt die Einzelansicht das Icon bzw. das Symbol (Emoji) als Ersatz.
- Bestehende Bilder bleiben unverändert erhalten.

Anzeige:
- Abteilungsansicht: Beim Antippen eines Produkts (aufgeklappt) erscheint oben das grosse Vorschaubild; Kategorien-Kopf zeigt das grosse Kategorie-Bild als Banner. Zeilen/Kacheln nutzen weiterhin die Icons.
- Einzelansicht (Produktseite/Dialog): grosses Vorschaubild.

## Technische Details
- Migration: `departments.icon_path text`, `products.icon_custom boolean default false`, `departments.icon_custom boolean default false` (keine neue Tabelle; RLS/Grants bestehen).
- `src/lib/product-icon.ts`: `saveProductIcon` überspringt Auto-Icon wenn `icon_custom`; neue Helfer `uploadCustomIcon(kind, id, blob)` (64px-WebP via `makeProductIcon`, setzt `icon_custom=true`) und `clearCustomIcon` (fällt auf Auto-Icon zurück); gleiche Logik für Kategorien.
- `catalog-tile-editor.tsx` Bild-Dialog: zwei Abschnitte „Icon" / „Vorschaubild"; Kategorie-Speicherpfad schreibt zusätzlich `icon_path`.
- `catalog.functions.ts` / `catalog-query.ts`: `iconPath`/`iconUrl` auch für Departments; Bild-Cache inkl. neuer Pfade.
- `abteilungen.tsx` + `DepartmentIcon`: Icons in Kacheln bevorzugen `iconUrl`; Banner/aufgeklapptes Produkt nutzen `imageUrl`.
- KI-Bild-Stilregel bleibt (ohne Kräuter, Zusätze, Gefässe); keine automatischen KI-Aufrufe.
- i18n: `adm.iconImage`, `adm.previewImage`, `adm.iconAutoHint` in de.ts + 15 Lokalen.
