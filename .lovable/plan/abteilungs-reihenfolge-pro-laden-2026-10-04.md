# Abteilungs-Reihenfolge pro Laden

## Was du bekommst
- Unter **Mehr / Einstellungen** neuer Bereich **„Abteilungs-Reihenfolge"**.
- Oben eine Laden-Auswahl: Läden des gewählten Marktes (aus der Admin-Märkte-Liste, z. B. Migros, Coop, Aldi) plus **„Standard"** und **„Eigener Laden…"** (frei benennbar, löschbar).
- Darunter alle Hauptabteilungen als Liste mit Griff zum Verschieben (Drag & Drop), plus Knopf **„Zurücksetzen"**.
- In der **Einkaufsliste** oben ein kleiner Laden-Umschalter; die Abteilungen erscheinen sofort in der Reihenfolge dieses Ladens.
- Verschieben direkt in der Liste (bestehender Griff) speichert in den aktuell gewählten Laden.
- Alles nur auf deinem Gerät gespeichert, wie bisher.

## Technische Details
- `use-group-order.ts` erweitern: Speicher `shoppi:list-group-order` wird zu `{ [storeId]: string[] }`; aktiver Laden in `shoppi:active-store` (Default `default`). Alte Array-Daten werden als `default` migriert.
- Eigene Läden: `shoppi:custom-stores` (`{id,name}[]`).
- Läden aus Tabelle `supermarkets` (gefiltert nach Gerätemarkt, `enabled`, sortiert).
- Neue Komponente `store-order-settings.tsx` in `mehr.tsx` (dnd-kit wie list-manager), listet Wurzel-Abteilungen; Schlüssel = Abteilungs-ID (gleich wie Gruppenschlüssel in der Liste).
- `index.tsx`: kleiner Select über den Gruppen, `useGroupOrder()` liefert Reihenfolge des aktiven Ladens.
- Neue i18n-Texte in de.ts + allen Locales von messages.json.
