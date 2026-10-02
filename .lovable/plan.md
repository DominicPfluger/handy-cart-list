# Rezept-Generator optimieren (ausgewählte Punkte)

## Backend (Grundlage, zuerst)
1. **Vorlagen + Oberkategorien in die Datenbank**
   - `recipe_templates`: id (text, z. B. „pizza"), emoji, color, sort_order, enabled.
   - `recipe_steps`: id, template_id, key, name, emoji, min, max, required, sort_order.
   - GRANTs + RLS: lesen für alle, schreiben nur Admins (`has_role`). Namen übersetzbar über `catalog_translations` (entity_type `recipe_template`/`recipe_step`).
   - Migration übernimmt die 8 bestehenden Vorlagen samt Schritten aus `recipe-templates.ts` (inkl. `recipe_ingredients`-Zuordnung bleibt über template_id/step_key bestehen). `recipe-templates.ts` bleibt als Fallback, falls die DB leer ist.
2. **Beliebte Kombinationen in die Datenbank**
   - `recipe_popular`: id, template_id, picks (jsonb stepKey→Produktnamen), sort_order. Gleiche Rechte. Seed aus `POPULAR_RECIPES`.

## Frontend (Rezept-Generator, `recipe-builder.tsx`)
3. **Oberkategorien-Akkordeon:** Jede Oberkategorie eine Karte (Emoji, Titel, „1–2 wählen", Zähler „2/3"). Immer eine offen; nach erfüllter Pflichtauswahl öffnet die nächste. Geschlossene Karten zeigen die Auswahl als Chips (antippen entfernt). Kurze Auf/Zu-Animation, Auswahl bleibt beim Zurückgehen erhalten.
4. **Suche + Ernährungsfilter:** Suchfeld je Oberkategorie (ab 8 Produkten, gleiche Suchlogik wie im Katalog); die unter „Mehr" gewählte Ernährungsform blendet unpassende Produkte aus (`excluded_diets`).
5. **Fortschritt + Abschlussleiste:** Fortschrittsbalken oben (erfüllte Pflichtkategorien); feste Leiste unten „Zum Rezept (n Zutaten)"; fehlende Pflichtkategorien rot markiert, Knopf erst aktiv, wenn alle Pflichten erfüllt.
- Beliebte Kombis bleiben antippbar, kommen nun aus der DB. Produkt-Darstellung bleibt vorerst wie heute (Kachel-Umbau mit Untergruppen wurde nicht gewählt).

## Admin-Panel (Tab „Rezepte & Küchen", `recipe-admin.tsx`)
6. **Vorlagen + Oberkategorien verwalten:** Vorlagen-Liste per Drag & Drop, „+ Vorlage", Aktiv-Schalter, Name/Emoji/Farbe bearbeiten. Pro Vorlage: Oberkategorien-Liste per Drag & Drop mit Inline-Bearbeitung (Name, Emoji, min./max., Pflicht). Neue Namen werden per KI in alle 16 Sprachen übersetzt.
7. **Produkte zuweisen:** Pro Oberkategorie Katalogbaum mit Checkboxen (ganze Unterkategorien übernehmen), Untergruppen per Drag & Drop, Hinweis „bereits in: <andere Oberkategorie>", Mehrfachauswahl zum Verschieben zwischen Oberkategorien.
8. **Live-Vorschau:** Der Generator direkt im Admin-Bereich (nur Ansicht, keine Speicherung).
9. **KI-Vorschläge:** „Passende Produkte vorschlagen" je Oberkategorie – nur auf Knopfdruck, mit Bestätigungsdialog (verbraucht Credits).

## Nicht enthalten (nicht gewählt)
- Produkt-Kachel-Umbau mit aufklappbaren Untergruppen im Frontend.

## Technische Details
- Reihenfolge: Migration → Typen → Daten-Layer (`recipes.functions.ts`/`recipes-api.ts` liest DB statt Code) → Frontend-Akkordeon → Admin-Verwaltung → Vorschau → KI-Vorschläge.
- Alle neuen UI-Texte in `de.ts` + 15 Lokale. Keine automatischen KI-Aufrufe; jede Credit-Nutzung mit Bestätigung.

## Prüfung
- Build/Typecheck; Playwright: Generator mit Akkordeon durchspielen (Pflicht erzwingen, Suche, Filter), Admin: Vorlage anlegen, Oberkategorie sortieren, Produkte zuweisen, Vorschau öffnen. KI-Vorschlag nur bis zum Bestätigungsdialog testen.
