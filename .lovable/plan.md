# Rezept-Generator optimieren – Vorschläge

## Heutiger Stand
- Die Vorlagen (Müesli, Pizza, Pfanne, …) und ihre Schritte (z. B. Teig, Sauce, Käse, Belag) sind fest im Programmcode hinterlegt. Ein Admin kann sie nicht umbenennen, ergänzen oder umsortieren.
- Die Zutaten pro Schritt werden schon im Admin-Panel gepflegt, gruppiert über „Zutaten-Gruppen“.

## Vorschlag Frontend (Rezept-Generator)
1. **Vorlage wählen:** Grosse Kacheln mit Emoji (Pizza, Salat, …), daneben „Beliebt“-Vorschläge zum Antippen.
2. **Oberkategorien als Akkordeon:** Jede Oberkategorie (Teig, Basis, Proteinquelle, Belag, Sauce …) ist eine Karte mit Titel, Emoji, Hinweis „1–2 wählen“ und einem Zähler (z. B. „2/3“).
   - Es ist immer nur eine Karte offen. Nach der Pflichtauswahl öffnet sich automatisch die nächste.
   - Im geschlossenen Zustand zeigt die Karte die Auswahl als kleine Chips (antippen = wieder entfernen).
3. **Produkte darunter:** Innerhalb einer Oberkategorie werden die Produkte nach Untergruppen aufgeklappt (z. B. Proteinquelle › Fleisch / Fisch / Vegetarisch). Die Produkte erscheinen als Kacheln mit Bild bzw. Emoji, ein Tipp hakt sie an.
   - Suchfeld je Oberkategorie (ab 8 Produkten).
   - Ernährungsfilter (z. B. vegan) blendet unpassende Produkte aus.
   - Ist das Maximum erreicht, werden die übrigen Produkte ausgegraut.
4. **Fortschritt + Abschluss:** Fortschrittsleiste oben. Unten eine feste Leiste „Zum Rezept (5 Zutaten)“. Pflichtkategorien, die noch fehlen, sind rot markiert.
5. **Flüssigkeit:** Kurze Animationen beim Auf- und Zuklappen, die Auswahl bleibt beim Zurückgehen erhalten. Mobile-first: grosse Tippflächen, kein horizontales Scrollen.

## Vorschlag Backend
- Vorlagen und Oberkategorien kommen neu in die Datenbank statt in den Programmcode:
  - Vorlagen: Name, Emoji, Farbe, Reihenfolge, aktiv ja/nein.
  - Oberkategorien je Vorlage: Name, Emoji, min./max. Auswahl, Pflicht ja/nein, Reihenfolge.
- Die bestehenden Zutaten-Zuordnungen und Untergruppen bleiben erhalten und werden den neuen Oberkategorien zugeordnet. Die heutigen 8 Vorlagen werden einmalig übernommen, damit nichts verloren geht.
- Übersetzungen der Namen für alle 16 Sprachen, automatisch per KI (wie im Katalog).
- Beliebte Kombinationen werden ebenfalls in der Datenbank gepflegt.

## Vorschlag Admin-Panel (Tab „Rezepte & Küchen“)
1. **Vorlagen-Liste:** Kacheln, per Drag & Drop sortierbar, „+ Vorlage“, Aktiv-Schalter.
2. **Vorlage öffnen → Oberkategorien:** Liste per Drag & Drop sortierbar, mit Inline-Bearbeitung von Name, Emoji, min./max. und Pflicht.
3. **Produkte zuweisen:** Pro Oberkategorie das bekannte Muster mit Katalogbaum und Checkboxen (ganze Unterkategorie übernehmen, einzelne Produkte an- und abhaken), dazu Untergruppen per Drag & Drop.
   - Mehrfachauswahl und Verschieben zwischen Oberkategorien.
   - Hinweis „bereits in: Belag“, wenn ein Produkt schon in einer anderen Oberkategorie steckt.
4. **Vorschau:** Rechts bzw. unten eine Live-Vorschau des Generators, so wie Nutzer ihn sehen.
5. **KI-Hilfe (nur auf Knopfdruck, mit Bestätigung):** „Passende Produkte vorschlagen“ für eine Oberkategorie.

## Umsetzung in Etappen
1. Datenbank und Übernahme der bestehenden Vorlagen (der Generator funktioniert danach unverändert).
2. Admin-Verwaltung für Vorlagen und Oberkategorien.
3. Neues Akkordeon-Frontend.
4. Optional: Vorschau und KI-Vorschläge.

## Technische Details
- Neue Tabellen `recipe_templates` (id text, emoji, color, sort_order, enabled) und `recipe_steps` (id, template_id, key, name, emoji, min, max, required, sort_order). Für beide: GRANT, RLS mit Lesen für alle und Schreiben über `has_role(admin)`.
- `recipe_ingredients.template_id`/`step_key` bleiben, `recipe_groups` bleibt die Untergruppen-Ebene. Neue Tabelle `recipe_popular` (template_id, picks jsonb).
- Namen über `catalog_translations` (entity_type `recipe_template`/`recipe_step`), Übersetzung über `translate.server.ts`.
- `recipe-templates.ts` wird zum Fallback und Seed. `recipe-builder.tsx` liest die Daten per Query. `recipe-admin.tsx` bekommt den Vorlagen- und Oberkategorie-Editor.
- Alle neuen UI-Texte in `de.ts` + 15 Lokale.
