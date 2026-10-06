# Admin-Bearbeiten-Dialog: Titel oben, Vorschaubild zugeklappt, Icon klein darunter

## Ziel
In beiden Admin-Bearbeiten-Dialogen gilt künftig diese Reihenfolge:

1. Dialogtitel + ✕ (unverändert)
2. **Titel** (Produktname-Feld mit Emoji)
3. **Vorschaubild** — zugeklappt: eine kompakte Zeile mit kleinem Vorschaubild + Pfeil; aufklappen zeigt das Bild **gross** (volle Breite) samt Aktionen (Hochladen, Bild wählen, KI-Optionen, KI-Bild erzeugen/neu laden, Bild entfernen)
4. **Icon** klein (wie bisher, nur weiter unten)
5. Alle übrigen Felder wie bisher (Kategorie bei neuen Produkten, Menge/Einheit, Preis, Varianten, Übersetzungen …)

## Dateien

### 1. `src/components/admin/catalog-tile-editor.tsx` — Hauptdialog (ItemSheet)
Heutige Reihenfolge: Titelzeile → Iconbild-Karte → Vorschaubild (64px) → Name/Emoji → Rest.
Neu:
- Name/Emoji-Zeile direkt unter den Dialogtitel verschieben (im `imageOnly`-Modus weiterhin ausblenden).
- Vorschaubild-Sektion in einen aufklappbaren Block umwandeln: zugeklappt kleines Vorschaubild (mit Emoji-Fallback), Label „Vorschaubild" (bestehender Key `adm.previewImage`), Chevron; aufgeklappt grosses Bild + alle bisherigen Aktionen.
- Icon-Karte (klein, Inhalt unverändert) unterhalb des Vorschaubild-Blocks platzieren.
- `imageOnly`-Modus (👁 Vorschau): Vorschaubild-Block startet aufgeklappt, Name/Emoji bleiben versteckt.

### 2. `src/routes/_authenticated/admin.tsx` — erweiterter Dialog (Editor)
Heutige Reihenfolge: Titelzeile → Name/Emoji → Kategorie-Auswahl → 64px-Bild + „Vorschau"-Knopf → Menge/Einheit → …
Neu:
- Vorschaubild-Sektion: gleicher aufklappbarer Block (zugeklappt kleines Bild, aufgeklappt grosses Bild + „🖼️ Vorschau"-Knopf in den Bildeditor).
- Darunter kleines Icon: `icon_path` laden und als kleines Bild anzeigen (reine Anzeige; Icon-Bearbeitung bleibt im Bildeditor). Fehlt ein Icon, entfällt die Zeile.
- Danach folgen Kategorie-Auswahl, Menge/Einheit, Überschrift, Ernährungsformen, Varianten usw. in bisheriger Reihenfolge.

## Gemeinsamer Baustein
Neues kleines Bauteil `src/components/admin/preview-collapse.tsx`: aufklappbare Karte mit props `label`, `src?`, `emoji?`, Standard zugeklappt, Slot für Aktionen. Beide Dialoge nutzen es, damit Aussehen und Verhalten identisch sind.

## i18n
Keine neuen Texte nötig — bestehende Keys (`adm.previewImage`, `adm.close`, …) weiterverwenden.

## Verifizierung
Playwright im Browser: Produkt-Bearbeiten-Dialog im Tile-Editor öffnen — Reihenfolge prüfen (Name oben, Vorschaubild zugeklappt mit kleinem Bild, Aufklappen zeigt grosses Bild, Icon klein darunter); danach denselben Dialog über die Suche/Tabs öffnen und prüfen. Build-Log kontrollieren.
