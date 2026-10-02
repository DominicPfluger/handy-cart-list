# Rezept-Generator optimieren – einzeln auswählbare Vorschläge

Hake unten an, was umgesetzt werden soll. Nichts wird gebaut, bevor du ausgewählt hast.

## Frontend (Rezept-Generator)
- [ ] **F1 – Oberkategorien als Akkordeon:** Teig, Belag, Proteinquelle usw. als aufklappbare Karten. Immer eine offen, nach Pflichtauswahl öffnet sich die nächste. Geschlossene Karten zeigen die Auswahl als Chips (antippen = entfernen). Zähler „2/3“ je Karte.
- [ ] **F2 – Produkt-Kacheln mit Untergruppen:** Produkte als Bild-/Emoji-Kacheln, nach Untergruppen (z. B. Fleisch / Fisch / Vegetarisch) aufklappbar. Erreichtes Maximum graut den Rest aus.
- [ ] **F3 – Suche und Ernährungsfilter:** Suchfeld je Oberkategorie (ab 8 Produkten); gewählte Ernährungsform blendet unpassende Produkte aus.
- [ ] **F4 – Fortschritt und Abschlussleiste:** Fortschrittsbalken oben, feste Leiste unten „Zum Rezept (5 Zutaten)“, fehlende Pflichtkategorien rot markiert.
- [ ] **F5 – Beliebte Kombinationen:** Antippbare Vorschläge („Beliebt“), die eine ganze Vorlage vorausfüllen.

## Backend
- [ ] **B1 – Vorlagen und Oberkategorien in die Datenbank:** Statt fest im Code: Tabellen für Vorlagen (Name, Emoji, Farbe, Reihenfolge, aktiv) und Oberkategorien (Name, Emoji, min./max., Pflicht, Reihenfolge). Die 8 bestehenden Vorlagen werden einmalig übernommen, nichts geht verloren. Namen werden in alle 16 Sprachen übersetzt.
- [ ] **B2 – Beliebte Kombinationen in die Datenbank:** Pflegbar statt fest im Code (Voraussetzung: B1).

## Admin-Panel (Tab „Rezepte & Küchen“)
- [ ] **A1 – Vorlagen verwalten:** Liste per Drag & Drop, „+ Vorlage“, Aktiv-Schalter, Name/Emoji/Farbe bearbeiten (Voraussetzung: B1).
- [ ] **A2 – Oberkategorien verwalten:** Pro Vorlage Liste per Drag & Drop, Inline-Bearbeitung von Name, Emoji, min./max., Pflicht (Voraussetzung: B1).
- [ ] **A3 – Produkte zuweisen:** Katalogbaum mit Checkboxen (ganze Unterkategorien übernehmen), Untergruppen per Drag & Drop, Hinweis „bereits in: Belag“, Mehrfachauswahl zum Verschieben zwischen Oberkategorien.
- [ ] **A4 – Live-Vorschau:** Der Generator direkt im Admin-Panel, so wie Nutzer ihn sehen.
- [ ] **A5 – KI-Vorschläge:** „Passende Produkte vorschlagen“ je Oberkategorie – nur auf Knopfdruck mit Bestätigung (verbraucht Credits).

## Technische Details (bei Auswahl)
- B1: Neue Tabellen `recipe_templates` + `recipe_steps` mit Lesezugriff für alle, Schreiben nur für Admins; `recipe_ingredients` und `recipe_groups` bleiben als Zuordnung/Untergruppen; Übersetzungen über `catalog_translations`; `recipe-templates.ts` wird Fallback/Seed.
- Frontend-Punkte bauen auf `recipe-builder.tsx`; Admin-Punkte auf `recipe-admin.tsx`. Alle neuen Texte in `de.ts` + 15 Lokale.
