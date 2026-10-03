# „Icon-Bild wie Vorschaubild“ reparieren

## Befund (im Code geprüft)
- Der Knopf weiss nur, welches Vorschaubild beim **Öffnen** des Dialogs hinterlegt war.
- Wird im offenen Dialog ein neues Vorschaubild hochgeladen, aus der Bildauswahl übernommen oder per KI neu erzeugt, erfährt der Knopf davon nichts. Er bleibt dann ausgegraut (bei Produkten ohne Bild) oder übernimmt das **alte** Bild.
- Bei neu angelegten Produkten lädt der Dialog die Bilddaten gar nicht, der Knopf bleibt also immer ausgegraut.
- Fehler zeigt der Knopf derzeit nicht an.

Ob das genau deinen Fall trifft, ist noch nicht bestätigt. Deshalb ist Schritt 1 ein Test im Browser.

## Lösung
1. **Fehler nachstellen:** Im Admin ein Produkt öffnen, den Knopf antippen und den genauen Fehler festhalten.
2. **Knopf immer aktuell halten:** Nach jedem Hochladen, Auswählen, KI-Erzeugen oder Entfernen des Vorschaubilds liest der Dialog die Bilddaten neu ein. Der Knopf nutzt dann immer das aktuelle Bild.
3. **Auch für neue Produkte:** Die Bilddaten werden auch geladen, sobald ein neues Produkt gespeichert ist.
4. **Rückmeldung:** Bei Erfolg erscheint „Icon übernommen“, bei einem Problem eine verständliche Fehlermeldung statt nichts.

## Technische Details
- `catalog-tile-editor.tsx`: `useEffect` auf `effId` statt `p.target.id`. Nach `upload`, `pick` (Vorschaubild), `generateDialogImage` und Entfernen jeweils `loadIcon(effId)` aufrufen.
- `useImageAsIcon`: `image_path` direkt vor der Übernahme frisch aus der Datenbank lesen. Toast bei Erfolg und Fehler (bestehender Text `adm.iconImage` bzw. Fehlermeldung).
- Keine Änderungen an der Datenbank.
