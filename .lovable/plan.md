# Teilen-Button in „Meine Listen" entfernen

## Ziel
In der Listenansicht („Meine Listen") verschwindet das Teilen-Icon neben dem Listennamen. Die Liste wird weiterhin über die Einladungsfunktion geteilt („Personen einladen" im Listen-Manager bleibt unverändert).

## Änderungen

1. **`src/routes/index.tsx`**
   - Den Teilen-Button (ShareIcon neben dem Listentitel, Zeilen 227–233) entfernen; der Listentitel bleibt klickbar (öffnet Listen-Manager).
   - Nicht mehr benötigte Imports aufräumen: `ShareIcon` (aus icons.tsx) und `shareList` (aus list-manager.tsx).

2. **Nicht ändern**
   - Listen-Manager (`src/components/list-manager.tsx`): Einladen-Icon für angemeldete Nutzer bleibt; das Teilen-Icon dort erscheint nur für nicht angemeldete Nutzer und bleibt als Fallback bestehen.
   - Teilen-Funktion auf der Favoritenansicht und sonstige Teilen-Einstiege bleiben unverändert.

## Verifikation
- Build fehlerfrei.
- Playwright-Check: Listenansicht zeigt Listentitel ohne Teilen-Icon; Listen-Manager öffnet sich weiterhin und bietet „Einladen" an.
