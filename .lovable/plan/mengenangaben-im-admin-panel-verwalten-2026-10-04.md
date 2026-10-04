# Mengenangaben im Admin-Panel verwalten

## Ziel
Admins können im Admin-Panel neue Mengenangaben (Einheiten wie „Stück", „Bund", „Scheibe") anlegen und die Reihenfolge per Drag & Drop festlegen. Diese Reihenfolge gilt überall, wo Einheiten ausgewählt werden (Produkt bearbeiten, Liste, Vorrat, Produktdetail).

## Was der Admin sieht
- Neuer Tab **„Mengenangaben"** im Admin-Panel.
- Liste aller Einheiten mit Langform und Kurzform (z. B. „Kilogramm" / „kg"), Ziehgriff zum Sortieren, Stift zum Umbenennen, Schalter zum Ausblenden.
- Knopf **„+ Neue Mengenangabe"**: Langform und Kurzform auf Deutsch eingeben; die übrigen 15 Sprachen werden automatisch per KI übersetzt (nachträglich bearbeitbar).
- Löschen nur, wenn kein Produkt die Einheit als Standard nutzt; sonst Hinweis mit Anzahl betroffener Produkte.

## Technische Details
- Neue Tabelle `units` (id text PK, sort_order, enabled, timestamps) mit GRANTs, RLS: alle lesen, Admins (`has_role`) schreiben. Befüllt mit den 34 bestehenden Einheiten in heutiger Reihenfolge.
- `products.default_unit` von Enum `unit_of_measure` auf `text` umstellen (bestehende Werte bleiben), damit neue Einheiten ohne Code-Änderung möglich sind.
- Bezeichnungen neuer Einheiten in `ui_translations` (Schlüssel `unit.<id>` / `unitS.<id>`), die bereits zur Laufzeit geladen werden; eingebaute Einheiten behalten ihre bestehenden Übersetzungen.
- `src/lib/units.ts`: `getUnits()` liest Reihenfolge/Sichtbarkeit aus der geladenen Tabelle (Fallback: heutige feste Liste); `unitShort` akzeptiert auch neue IDs.
- Vorlesen: neue Einheiten nutzen die Langform als Fallback in `speech-units.ts`.
- Neue Komponente `units-panel.tsx` (dnd-kit wie bei bestehenden Sortierungen), KI-Übersetzung über `translate.server.ts`.
- Neue UI-Texte in allen 16 Sprachen.
