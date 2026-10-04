# Pflege „Produkte ohne Bild": Kategorienfilter + KI-Bildoptionen

## Ziel
Im Admin-Panel „Pflege → Produkte ohne Bild" (MissingImagesPanel) gibt es neu:
1. Einen **Kategorienfilter** (Dropdown), der die Liste auf eine Abteilung/Unterkategorie einschränkt.
2. **KI-Bilderstellungsoptionen** wie bei der Produktliste/Katalog: Beim Klick auf den Zauberstab öffnet sich ein Dialog mit Bildbeschreibung, Stil, Hintergrund, Ansicht und Anzahl — statt der bisherigen Mini-Auswahl.

## Umsetzung

### 1. Kategorienfilter (`src/components/admin/missing-images-panel.tsx`)
- Neuer State `cat` (Department-ID oder leer für „Alle Kategorien").
- Dropdown neben Suche und Bild-Filter: erste Option „Alle Kategorien", danach alle Abteilungen aus `depts`, sortiert nach Pfad, Label = voller Pfad („Frischmarkt › Früchte").
- Filter: Produkt behalten, wenn `department_id` dem gewählten Dept entspricht oder ein Nachfahre davon ist (Parent-Kette via `deptById`). Kombiniert mit Bild-Filter und Suche; Änderung setzt `limit` auf 5 zurück.

### 2. KI-Optionen pro Zeile
- Der Zauberstab-Button öffnet statt des Zwei-Punkte-Menüs einen Dialog (Muster wie der „Alle erzeugen"-Dialog im Katalog-Kacheleditor):
  - Textarea „Bildbeschreibung" (max. 300 Zeichen, optional)
  - `AiImageOptionSelects` (Stil, Hintergrund, Ansicht, Anzahl) aus `src/components/admin/ai-image-options.tsx` — direkt wiederverwendet
  - Wahl: „KI-Bild erzeugen" (Icon wird abgeleitet, 1 Credit) oder „Beide Bilder mit KI erzeugen" (2 Credits) — als zwei Buttons im Dialog
- Ausführung ruft die bestehende `generateImageFor` mit `hint` und `opts` auf; danach Speichern des Icons wie bisher (`saveProductIconFromPath` bzw. `saveCustomIconFromPath`).

### 3. Stapel-Lauf mit Optionen
- „Alle n mit KI erzeugen" öffnet denselben Optionsdialog (Beschreibung + Optionen + Wahl Icon ableiten/separates Icon); der bestehende Modus-Dropdown wandert in den Dialog. Der Lauf arbeitet die sichtbaren Produkte nacheinander ab wie bisher.

### 4. i18n
- Neue Schlüssel `adm.noImg.cat` („Alle Kategorien") und `adm.noImg.options` (Dialogtitel „KI-Bildoptionen") in `src/i18n/de.ts` und allen 15 Locales in `src/i18n/messages.json`; vorhandene Schlüssel (`tile.aiStyle` usw.) wiederverwenden.

## Verifikation
- Typprüfung + Build fehlerfrei.
- Browser-Test als Admin: Kategorie-Filter einschränkt die Liste korrekt (inkl. Unterkategorien), Zauberstab öffnet den Optionsdialog, erzeugtes Bild/Icon landet am Produkt, Stapel-Lauf mit Optionen läuft durch.
