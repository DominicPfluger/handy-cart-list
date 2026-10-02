# KI-Bildvorschlag im Kategorie-Dialog nicht mehr automatisch laden

## Ziel
Beim Öffnen des Bearbeiten-Dialogs einer Kategorie/Unterkategorie wird der KI-Vorschlag für den Bildtext **nicht mehr automatisch** erzeugt — das kostet jedes Mal Credits, auch wenn man das Bild gar nicht ändern will. Der Vorschlag entsteht nur noch auf ausdrücklichen Knopfdruck.

## Umsetzung
1. **Automatischen Aufruf entfernen** (`src/components/admin/catalog-tile-editor.tsx`, ItemSheet): Der `useEffect`, der `loadSuggestion(false)` bei jedem Öffnen des Dialogs aufruft, wird entfernt. Damit startet kein KI-Aufruf mehr ohne Klick.
2. **Manuell bleibt alles gleich:** Der ✨-Knopf (Vorschlag holen) und der ↻-Knopf (mit angehakter Produktauswahl neu vorschlagen) funktionieren weiterhin wie bisher — nur sie lösen den KI-Aufruf aus.
3. **Leeres Feld verständlich machen:** Solange noch kein Vorschlag geholt wurde, zeigt das Bildtext-Feld einen Hinweis wie „Optional: Stichworte fürs KI-Bild — ✨ für einen KI-Vorschlag" (Platzhalter-Text), damit klar ist, woher der Vorschlag kommt. Beschriftung in allen App-Sprachen ergänzen.
4. **Produkt-Checkbox-Liste bleibt:** Die Produktliste zum Anhaken lädt weiterhin beim Öffnen (reine Datenbankabfrage, keine KI, keine Credits); sie kostet nichts und bleibt sofort nutzbar.

## Nicht Teil
- Keine Änderung an der eigentlichen Bildgenerierung, an der Mehrfachanlage oder am Produkt-Dialog.

## Prüfung
- Dialog einer Kategorie öffnen → kein KI-Aufruf, Feld leer mit Hinweis.
- ✨ drücken → Vorschlag erscheint; ↻ mit Checkbox-Auswahl → neuer Vorschlag nur mit angehakten Produkten.
- Typecheck und Build fehlerfrei; kurzer Browser-Test.
