# Listen-Kategorie-Icons vergrössern, Container kompakter

## Ziel
Die Kategorie-/Produkt-Icons in der Einkaufsliste und in der Produkte-Auflistung (Abteilungsansicht) werden um ~20% grösser dargestellt, während ihre Container kleiner und mit weniger Innen-/Aussenabstand gebaut werden — kompaktere Zeilen, grösseres Icon.

## Umfang
- `src/routes/index.tsx` (Einkaufsliste)
- `src/routes/abteilungen.tsx` (Produkte-Auflistung)
- Nicht im Umfang: Favoriten-Seite, Abteilungs-Kacheln der Hauptansicht, andere Seiten.

## Änderungen

### 1. Einkaufsliste (`src/routes/index.tsx`)
- **Item-Kästchen (Zeile 347):** `h-8 w-8` → `h-7 w-7` (32px → 28px), `rounded-lg` → `rounded-md`. Emoji sichtbar vergrössern: Kontextgrösse `text-base` (16px) → `text-[19px]` — das gerenderte Emoji (0.7em-Skalierung in `ProductEmoji`) wächst damit von ~11px auf ~13px (+20%).
- **Gruppenkopf-Emoji (Zeile 316):** `text-base` → `text-lg` (+20%).
- **Zeilen-Abstände (Zeile 328):** `gap-3` → `gap-2.5`, `py-3 pl-4 pr-4` → `py-2.5 px-3` (weniger Padding/Margin).
- Kopfzeile der Gruppe (Zeile 315): `gap-2` → `gap-1.5`.

### 2. Produkte-Auflistung (`src/routes/abteilungen.tsx`)
- **Thumbnail-Container (Zeile 641):** `h-14 w-14` → `h-12 w-12` (56px → 48px), `rounded-xl` → `rounded-lg`.
- **Emoji darin (Zeile 62, `ProductThumb`):** `text-3xl` → `text-4xl` (+20%).
- **Produktzeile (Zeile 630):** `gap-3` → `gap-2.5`, `px-3 py-2.5` → `px-2.5 py-2`, `min-h-20` → `min-h-16`.

## Prüfung
- Vorschau: Einkaufsliste mit mehreren Gruppen und Produkte-Liste in der Abteilungsansicht — Icons spürbar grösser, Container kompakter, nichts überlappt; zweizeilige Namen und Bilder in Thumbnails bleiben sauber.
- Build-Fehlerprotokoll prüfen.
