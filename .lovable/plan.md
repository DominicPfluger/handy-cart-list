# KI-Bild für Kategorien: Vorschlag aus den enthaltenen Produkten

## Ziel

Beim Erzeugen eines KI-Bildes für eine Kategorie/Unterkategorie (✨ KI-Bild im Bearbeiten-Fenster und beim Anlegen) schlägt die App automatisch einen passenden Bildtext vor, der auf den Produkten in dieser Unterkategorie basiert. Der Vorschlag steht im Stichwort-Feld und kann vor dem Erzeugen angepasst werden.

## Umsetzung

1. **Neue Server-Funktion `suggestImagePrompt`** in `src/lib/admin.functions.ts` (Admin-geschützt wie `suggestProducts`):
   - Eingabe: Kategorie-ID.
   - Lädt die Produkte der Kategorie (Namen, max. ~30) und lässt die KI daraus einen kurzen, bildbeschreibenden Text formulieren (z. B. „Frische Kräuter: Petersilie, Basilikum, Schnittlauch auf hellem Hintergrund").
   - Rückgabe: ein kurzer Text (max. 300 Zeichen), passend zum bestehenden `hint`-Parameter der Bild-Erzeugung.

2. **Einbau in `src/components/admin/catalog-tile-editor.tsx`:**
   - Beim Öffnen des KI-Bild-Dialogs für eine **Kategorie** wird der Vorschlag automatisch geladen und das Stichwort-Feld vorausgefüllt (Ladezustand „Vorschlag wird erstellt …").
   - Der Text bleibt frei bearbeitbar; „✨ KI-Bild" erzeugt das Bild wie bisher mit diesem Hint.
   - Bei Produkten und Kategorien ohne Produkte: kein Vorschlag, Feld bleibt leer (Verhalten wie heute).
   - Zusätzlich ein kleiner „↻"-Knopf neben dem Feld, um den Vorschlag neu zu laden.

3. **Übersetzungen:** Neue Schlüssel `tile.aiSuggestLoading` („Vorschlag wird erstellt …") in `src/i18n/de.ts` und allen 15 Locales in `messages.json`.

## Nicht geändert

- Bild-Erzeugung selbst (`generateImageFor`, Grösse, Transparenz) bleibt unverändert.
- Produkte bekommen keinen automatischen Vorschlag (dort ist der Produktname bereits die Grundlage).
- Keine Datenbankänderung.

## Technische Details

- `suggestImagePrompt` nutzt die bestehende KI-Anbindung in `admin.functions.ts` (gleiches Muster wie `suggestCategoryProducts`), mit `requireSupabaseAuth` + Admin-Prüfung.
- Der Vorschlag wird erst beim Öffnen des Dialogs geladen — kein automatischer Aufruf pro Kategorie, spart KI-Guthaben.

## Verifikation

Build prüfen, dann in der Vorschau: Kategorie öffnen → KI-Bild-Dialog → Vorschlag erscheint im Feld → Bild erzeugen → Bild wird der Kategorie zugewiesen.
