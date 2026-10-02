# Überschriften „Marktwahl" und „Katalogsprache" in den Dropdowns anzeigen

## Ziel
Im Admin-Bereich (Tab „Katalog") stehen in der Steuerungs-Zeile zwei Dropdowns ohne erkennbaren Titel: die Marktauswahl (Optionen „🌍 Global" + Länderkürzel) und die Katalogsprache (Sprachliste). Neu erscheint im jeweiligen aufgeklappten Menü oben eine fette Überschrift: **„Marktwahl"** bzw. **„Katalogsprache"**, danach erst die Optionen.

## Umsetzung
Nur `src/routes/_authenticated/admin.tsx`, Steuerungs-Zeile (Zeilen ~336–346):

- Markt-Dropdown: die beiden `<option>`-Einträge („🌍 Global" + `MARKETS`) kommen in eine `<optgroup label={T("adm.marketChoice")}>`. Native `<select>`-Menüs zeigen das Optgroup-Label als Überschrift im aufgeklappten Menü — genau das gewünschte Verhalten, ohne Zusatz-UI.
- Katalogsprache-Dropdown: alle `LOCALES`-Optionen kommen in eine `<optgroup label={T("adm.viewLocale")}>`. Der Schlüssel `adm.viewLocale` („Katalogsprache") existiert bereits in allen 16 Sprachen — keine neuen Übersetzungen nötig.
- Auswahlfeld-Grösse, Position in der Steuerungs-Zeile (Markt · Katalogsprache · Sortieren · Suchen) und das Verhalten bleiben unverändert. Die Marktauswahl erscheint weiterhin nur innerhalb einer Kategorie (`cur`).

## Neue Übersetzungen
Ein neuer Schlüssel `adm.marketChoice` = „Marktwahl":
- `src/i18n/de.ts` (Deutsch): „Marktwahl"
- `src/i18n/messages.json` für alle 15 weiteren Sprachen, z. B. en: „Market selection", fr: „Choix du marché", it: „Scelta del mercato", es: „Selección de mercado", pt: „Escolha de mercado", nl: „Marktkeuze", de-AT: „Marktwahl"

Keine Datenbank- oder Logikänderung; keine anderen Dropdowns werden angetastet.

## Verifikation
Build prüfen und im Preview beide Dropdowns öffnen — Überschriften „Marktwahl" bzw. „Katalogsprache" erscheinen oben im Menü, Auswahl funktioniert wie bisher.

