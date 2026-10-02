# Überschrift „Marktwahl" im Dropdown anzeigen

## Ziel
Im Admin-Bereich (Tab „Katalog") öffnet das Markt-Dropdown derzeit direkt mit den Optionen „🌍 Global" und den Länderkürzeln — ohne erkennbaren Titel. Neu erscheint im aufgeklappten Menü oben eine Überschrift **„Marktwahl"**, danach erst die Optionen.

## Umsetzung
Nur `src/routes/_authenticated/admin.tsx`, Zeilen 337–343:

- Die beiden `<option>`-Einträge („🌍 Global" + `MARKETS`) werden in eine `<optgroup label={T("adm.marketChoice")}>` eingeschlossen. Native `<select>`-Menüs zeigen das Optgroup-Label als fette Überschrift im aufgeklappten Menü — genau das gewünschte Verhalten, ohne Zusatz-UI.
- Auswahlfeld-Grösse, Position in der Steuerungs-Zeile (Markt · Katalogsprache · Sortieren · Suchen) und das Verhalten bleiben unverändert. Die Marktauswahl erscheint weiterhin nur innerhalb einer Kategorie (`cur`).

## Neue Übersetzungen
Neuer Schlüssel `adm.marketChoice` = „Marktwahl":
- `src/i18n/de.ts` (Deutsch): „Marktwahl"
- `src/i18n/messages.json` für alle 15 weiteren Sprachen, z. B. en: „Market selection", fr: „Choix du marché", it: „Scelta del mercato", es: „Selección de mercado", pt: „Escolha de mercado", nl: „Marktkeuze", de-AT: „Marktwahl"

Keine Datenbank- oder Logikänderung; keine anderen Dropdowns werden angetastet.

## Verifikation
Build prüfen und im Preview das Markt-Dropdown in einer Kategorie öffnen — Überschrift „Marktwahl" erscheint oben im Menü, Auswahl funktioniert wie bisher.
