# Admin: „Als Textdatei exportieren" → „Liste als Text kopieren"

## Ziel
Der Button im Admin-Katalog heisst neu „Liste als Text kopieren". Statt eine .txt-Datei herunterzuladen, öffnet er einen Dialog, der die Liste als Text zeigt und per Knopfdruck in die Zwischenablage kopiert.

## Umsetzung

**1. `src/components/admin/catalog-tile-editor.tsx`**
- Die Funktion `exportTxt` (Zeilen 275–291, erzeugt Download) ersetzen durch `buildListText()`, die denselben Text erzeugt (Kategoriepfad als Kopfzeile, Produkte mit Emoji, Überschriften als `# …`-Zeilen, Aliasse ausgelassen) und ihn zurückgibt statt herunterzuladen.
- Neuer State `copyOpen`; der Button (Zeile 327) öffnet damit den Dialog statt `exportTxt()`.
- Neuer Dialog `CopyListDialog` am Dateiende (gleiches Muster wie `VariantAddDialog`, Overlay + Card):
  - Überschrift = Kategoriepfad
  - zusammengesetzter Text in einem mehrzeiligen, nicht editierbaren Textfeld (auswählbar, damit man ihn auch von Hand kopieren kann)
  - Knopf „Text kopieren" (vorhandener Schlüssel `share.copyText`): `navigator.clipboard.writeText(...)` mit Toast „Liste kopiert" (`export.copied`); bei Fehler Toast „Kopieren nicht möglich" (`export.copyFailed`) — gleiche Muster wie in export-list-sheet.tsx
  - Knopf „Abbrechen" (`adm.cancel`) schliesst den Dialog

**2. Übersetzungen**
- `src/i18n/de.ts`: `adm.exportTxt` entfernen, neuer Schlüssel `adm.copyList` = „Liste als Text kopieren" (Button-Text).
- `src/i18n/messages.json`: denselben Schlüssel in den 15 weiteren Sprachen ergänzen (en: „Copy list as text", es: „Copiar la lista como texto", fr: „Copier la liste en texte", it: „Copia la lista come testo", pt: „Copiar a lista como texto", nl: „Lijst als tekst kopiëren", de-AT/de-CH: „Liste als Text kopieren"); alten Schlüssel `adm.exportTxt` dort entfernen.
- Kopier-Knopf und Toasts nutzen bestehende Schlüssel (`share.copyText`, `export.copied`, `export.copyFailed`) — keine weiteren neuen Texte.

Keine Datenbank- oder Backend-Änderung.

## Prüfung
- Typprüfung und Build.
- Browser-Test: Admin → Katalog-Kategorie mit Produkten → „Liste als Text kopieren" öffnet Dialog, Knopf kopiert (Clipboard-Berechtigung im Test prüfen bzw. Textfeld-Inhalt verifizieren), Dialog schliesst.
- roadmap.md ergänzen.
