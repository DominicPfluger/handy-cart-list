# Länderküchen im Admin-Panel nach unten verschieben

## Änderung
In `src/routes/_authenticated/admin.tsx`:

- Den Block `{d && <CuisineAdmin depts={d.depts} prods={d.prods} />}` von seiner aktuellen Position (direkt nach dem Übersetzen-Button, über „Rezept-Zutaten" und der Katalogverwaltung) entfernen.
- Den Block am Seitenende einfügen, direkt **vor** dem „Vorlese-Texte"-Link (der bleibt damit der letzte Eintrag).

Sonst nichts ändern: „Rezept-Zutaten" (RecipeAdmin) bleibt an seiner Stelle, alle Funktionen bleiben unverändert.

## Verifikation
- Build fehlerfrei.
- Vorschau: Admin-Seite laden und prüfen, dass „Länderküchen" unten steht und sich öffnen lässt.
