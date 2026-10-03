# Überschriften-Sortierung: eigene Kriterien-Auswahl

## Ziel
Der „↕"-Knopf an einer Überschrift soll nicht mehr das global gewählte Sortierkriterium verwenden, sondern beim Klick eine kleine Auswahl mit genau vier Kriterien öffnen:

- **Ähnlichkeit** (KI)
- **Relevanz** (KI)
- **Alphabetisch** (lokal, ohne KI/Credits)
- **Preis** (KI)

## Umsetzung

1. **Kriterien-Dialog pro Überschrift**
   - Klick auf „↕" öffnet einen kleinen Dialog (statt sofort `confirm`) mit den vier Optionen als Auswahl-Schaltflächen, plus „Abbrechen".
   - Bei den drei KI-Kriterien folgt nach der Wahl die bestehende Credits-Bestätigung (`adm.sortConfirm`); bei „Alphabetisch" entfällt sie (kein KI-Verbrauch) bzw. es kommt nur die kurze Bestätigung.

2. **Sortierlogik** (`sortHeadingGroup` in `src/routes/_authenticated/admin.tsx`)
   - Bekommt das gewählte Kriterium als Parameter statt `sortBy`.
   - `alphabetical`: lokale Sortierung (`localeCompare "de"`).
   - `similarity`, `price`: KI-Rangfolge über `rankProducts` mit diesem Kriterium.
   - `relevance`: KI-Rangfolge mit Kriterium `popularity` (wie bisher bei „Relevanz").
   - Danach wie bisher: `saveOrder` nur für die Gruppe, Überschrift an das neue erste Produkt hängen (`saveH`), bei gewähltem Markt keine Überschriften-Verschiebung.

3. **Beschriftungen**
   - Bestehende i18n-Schlüssel `adm.crit.similarity`, `adm.crit.popularity` (Relevanz), `adm.crit.alphabetical`, `adm.crit.price` wiederverwenden; neuer Schlüssel `adm.sortGroupTitle` („Einträge dieser Überschrift sortieren nach") in allen 16 Sprachen.

## Technische Details
- Dateien: `src/routes/_authenticated/admin.tsx` (Dialog-State + `sortHeadingGroup(headingId, criterion)`), `src/components/admin/catalog-tile-editor.tsx` (↕-Knopf öffnet Dialog statt direktem Callback), `src/i18n/de.ts` + `messages.json` (neuer Schlüssel, 16 Sprachen).
- Keine Datenbank-Änderungen.

## Test
- Browser-Test in „Frische Kräuter": Dialog öffnet sich mit vier Optionen; „Alphabetisch" sortiert lokal ohne KI; ein KI-Kriterium (Relevanz) sortiert nach Bestätigung; andere Überschriften-Gruppen bleiben unverändert.
