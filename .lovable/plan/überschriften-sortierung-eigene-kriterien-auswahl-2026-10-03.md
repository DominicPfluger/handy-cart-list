# Überschriften-Sortierung: eigene Kriterien-Auswahl

## Ziel
Der „↕"-Knopf an einer Überschrift soll nicht mehr das global gewählte Sortierkriterium verwenden, sondern beim Klick eine kleine Auswahl mit genau vier Kriterien öffnen:

- **Ähnlichkeit** (KI)
- **Relevanz** (KI)
- **Alphabetisch** (lokal, ohne KI/Credits)
- **Preis** (lokal, anhand der in der Datenbank gespeicherten Preise — **keine** KI)

## Umsetzung

1. **Kriterien-Dialog pro Überschrift**
   - Klick auf „↕" öffnet einen kleinen Dialog (statt sofort `confirm`) mit den vier Optionen als Auswahl-Schaltflächen, plus „Abbrechen".
   - Nur bei den zwei KI-Kriterien (Ähnlichkeit, Relevanz) folgt die bestehende Credits-Bestätigung (`adm.sortConfirm`); bei „Alphabetisch" und „Preis" wird direkt sortiert (kein KI-Verbrauch).

2. **Sortierlogik** (`sortHeadingGroup` in `src/routes/_authenticated/admin.tsx`)
   - Bekommt das gewählte Kriterium als Parameter statt `sortBy`.
   - `alphabetical`: lokale Sortierung (`localeCompare "de"`).
   - `price`: lokale Sortierung aufsteigend nach dem gespeicherten Preis des Produkts (bereits geladene `prices`-Map im Katalog-Editor, aus `product_reference_prices` bzw. den manuellen Marktpreisen; beim gewählten Markt dessen Preis, sonst der globale Referenzpreis). Produkte ohne Preis ans Ende.
   - `similarity`: KI-Rangfolge über `rankProducts` mit Kriterium `similarity`.
   - `relevance`: KI-Rangfolge mit Kriterium `popularity` (wie bisher bei „Relevanz").
   - Danach wie bisher: `saveOrder` nur für die Gruppe, Überschrift an das neue erste Produkt hängen (`saveH`), bei gewähltem Markt keine Überschriften-Verschiebung.

3. **Beschriftungen**
   - Bestehende i18n-Schlüssel `adm.crit.similarity`, `adm.crit.popularity` (Relevanz), `adm.crit.alphabetical`, `adm.crit.price` wiederverwenden; neuer Schlüssel `adm.sortGroupTitle` („Einträge dieser Überschrift sortieren nach") in allen 16 Sprachen.

## Technische Details
- Dateien: `src/routes/_authenticated/admin.tsx` (Dialog-State + `sortHeadingGroup(headingId, criterion)`), `src/components/admin/catalog-tile-editor.tsx` (↕-Knopf öffnet Dialog statt direktem Callback), `src/i18n/de.ts` + `messages.json` (neuer Schlüssel, 16 Sprachen).
- Keine Datenbank-Änderungen.

## Test
- Browser-Test in „Frische Kräuter": Dialog öffnet sich mit vier Optionen; „Alphabetisch" und „Preis" sortieren lokal ohne KI-Aufruf; „Relevanz" sortiert nach Bestätigung per KI; andere Überschriften-Gruppen bleiben unverändert.
