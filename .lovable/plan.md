# Favoriten: Kleines PNG-Icon für Kategorien verwenden

## Ziel
Auf der Favoriten-Seite sollen die Kategorien-Überschriften das kleine PNG-Icon der Abteilung anzeigen, falls vorhanden (wie in der Abteilungsansicht). Danach grosse Kategorie-Bild, sonst Emoji als Fallback.

## Ist-Zustand (geprüft)
- `src/routes/favoriten.tsx` (Zeile 444) rendert den Kategorien-Header mit `DepartmentIcon` und übergibt **nur** `imageUrl` (grosses Bild), aber **keinen** `imagePath` — dadurch zeigt die Favoriten-Seite aktuell nur das Emoji, nie ein Bild.
- Abteilungen haben im Katalog sowohl `iconPath`/`iconUrl` (kleines 64px-Icon) als auch `imagePath`/`imageUrl` (grosses Bild).
- `DepartmentIcon` in `src/components/catalog-icon.tsx` unterstützt bereits `imagePath`/`imageUrl` und nutzt den geräte-lokalen Bild-Cache.
- Die Abteilungsansicht (`src/routes/abteilungen.tsx`, Zeile 65) nutzt bereits `iconPath ?? imagePath` — dort funktioniert es korrekt.

## Umsetzung
In `src/routes/favoriten.tsx` (Kategorien-Header, Zeile 444) den `DepartmentIcon`-Aufruf ergänzen:

- `imagePath={department.iconPath ?? department.imagePath}`
- `imageUrl={department.iconUrl ?? department.imageUrl}`

Damit gilt die Reihenfolge: kleines PNG-Icon → grosses Bild → Emoji. Keine Änderung an Typen, Komponenten oder i18n nötig.

## Verifikation
- Typprüfung (`bunx tsgo --noEmit`) und Build.
- Browser-Test: Favoriten-Seite öffnen und prüfen, dass Kategorien mit hinterlegtem Icon das kleine PNG anzeigen; Kategorien ohne Bild weiterhin das Emoji.
