# Kategorie-Bezeichnungen in KI-Bildvorschläge einbeziehen

## Ziel
Die KI-Vorschlagsfunktion für Kategorie-Bilder im Admin-Panel (✨-Vorschlag beim Bildtext) berücksichtigt heute nur den Namen der aktuellen Kategorie und ihre Produkte. Künftig werden auch die übrigen Kategorie-Bezeichnungen miteinbezogen, damit der Vorschlag den Kontext besser trifft.

## Umsetzung
1. **Server-Funktion `suggestImagePrompt` erweitern** (`src/lib/admin.functions.ts`):
   - Zusätzlich zur aktuellen Kategorie laden:
     - die **Überkategorie** (parent_id-Kette, falls vorhanden),
     - die **Unterkategorien** der aktuellen Kategorie (Namen),
     - bei einer Unterkategorie: die **Geschwister-Kategorien** (andere Unterkategorien derselben Überkategorie).
   - Diese Bezeichnungen gehen als Kontext in die KI-Anfrage (JSON-Felder `ueberkategorie`, `unterkategorien`, `geschwister`).
2. **KI-Anweisung anpassen**: Die KI soll den Bildtext so formulieren, dass er die aktuelle Kategorie klar von ihren Geschwistern abgrenzt und zum übergeordneten Thema passt (z. B. „Gemüse" unter „Frischmarkt" neben „Obst").
3. **Keine Änderung am Ablauf im Admin-Panel**: Der ✨/↻-Knopf, das editierbare Textfeld und das anschliessende Generieren bleiben wie bisher; nur der vorgeschlagene Text wird treffender.

## Technische Details
- Nur `suggestImagePrompt` in `src/lib/admin.functions.ts` ändern (zusätzliche `departments`-Abfragen über `parent_id`, Eingabe-JSON erweitern, Prompt-Text ergänzen).
- Kein Schema-, kein UI- und kein Übersetzungs-Change nötig.
- Verifikation: Typecheck/Build; im Admin-Panel bei einer Unterkategorie (z. B. Gemüse) den Vorschlag neu laden und prüfen, ob der Text den Kategorie-Kontext widerspiegelt.
