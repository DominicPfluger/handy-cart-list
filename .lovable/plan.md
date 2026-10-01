# Namenseingabe beim Übertragen von Favoriten in eine neue Liste

## Ziel
Beim Klick auf „Alle X Favoriten in neue Liste" erscheint zuerst ein Dialog, in dem der Name der neuen Einkaufsliste eingegeben wird. Erst nach Bestätigen wird die Liste erstellt.

## Änderungen

1. **`src/routes/favoriten.tsx`**
   - Neuer Dialog (bestehendes Dialog-Muster der App): Überschrift „Neue Liste aus Favoriten", ein Textfeld für den Listennamen, Buttons „Abbrechen" und „Erstellen".
   - Das Textfeld ist mit dem bisherigen Standardnamen („Favoriten") vorausgefüllt und beim Öffnen markiert, damit er direkt überschrieben oder übernommen werden kann.
   - Leerer Name: „Erstellen" ist deaktiviert bzw. zeigt einen Hinweis; Eingabe wird getrimmt, Länge begrenzt (max. 60 Zeichen).
   - Bestätigen (Button oder Enter) ruft `createListFromItems(name, items)` mit dem eingegebenen Namen auf, zeigt die Erfolgsmeldung und navigiert zur neuen Liste — wie bisher.
   - Abbrechen schließt den Dialog ohne Änderung.

2. **Übersetzungen** — neue Texte (Dialog-Titel, Platzhalter, Buttons) in `src/i18n/de.ts` und allen 15 Locales in `src/i18n/messages.json`.

3. **Nicht ändern** — `createListFromItems` in `src/hooks/use-shopping-list.ts` bleibt unverändert (bekommt den Namen bereits als Parameter); lokaler und Cloud-Zweig funktionieren wie bisher.

## Verifikation
- Build fehlerfrei.
- Playwright-Check: Button klicken → Dialog erscheint mit vorausgefülltem Namen → eigenen Namen eingeben → Liste mit diesem Namen wird erstellt und geöffnet; Abbrechen erstellt nichts.
