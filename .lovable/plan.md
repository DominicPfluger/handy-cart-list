# Mengenangaben in Rezepten manuell bearbeiten

## Ziel
Mengen (Zahl + Einheit) pro Zutat manuell anpassen — sowohl im Rezept-Generator vor dem Speichern als auch nachtraeglich bei gespeicherten Rezepten unter „Meine Rezepte".

## Umsetzung

### 1. Rezept-Generator (vor dem Speichern)
- In der Zutaten-Uebersicht (gewaehlte Zutaten) erhaelt jede Zutat ein Mengenfeld: Zahleneingabe + Einheit-Auswahl.
- Voreingestellt ist die Produkt-Standardmenge; eigene Eingabe ueberschreibt sie nur fuer dieses Rezept (Katalog bleibt unveraendert).
- Beim Speichern werden die eigenen Mengen in `recipes.items` geschrieben; „… nach Wahl"-Eintraege bleiben ohne Mengenfeld.

### 2. Meine Rezepte (nachtraeglich)
- Bei eigenen gespeicherten Rezepten kommt ein Bearbeiten-Knopf (Stift) in der Rezept-Zeile dazu.
- Er oeffnet einen Dialog mit allen Zutaten: je Zeile Name, Mengenfeld (Zahl) und Einheit-Auswahl.
- „Speichern" aktualisiert `recipes.items` in der Datenbank (nur eigene Rezepte, bestehende Berechtigungen greifen); danach zeigen Detailansicht, Vorlesen und Einkaufslisten-Uebernahme die neuen Mengen.

### 3. Gemeinsames Eingabefeld
- Eine wiederverwendbare Mengen-Eingabe (Zahl + Einheit) fuer beide Stellen.
- Einheiten aus der bestehenden Einheiten-Liste (Stueck, g, kg, ml, l, Bund usw.) mit den vorhandenen Uebersetzungen.
- Pruefung: Zahl muss groesser als 0 sein, leeres Feld = Standardmenge beibehalten; Eingabelaenge begrenzt.

### 4. Texte
- Neue Texte (z. B. „Mengen bearbeiten", „Mengen gespeichert") in Deutsch + allen 15 weiteren Sprachen.

## Technische Details
- `src/components/recipe-builder.tsx`: Mengen-Override-State (Map productId → {quantity, unit}), `recipeItems()` nutzt Override statt `formatQuantity(p.defaultQuantity, p.defaultUnit)`.
- Neues kleines Bauteil `src/components/quantity-input.tsx` (Zahl + Einheit-Select, Einheiten aus `unit_of_measure`-Enum mit vorhandenen i18n-Schluesseln).
- `src/components/saved-recipes-board.tsx`: Stift-Knopf nur bei `r.isOwn`; Dialog laedt `recipes.items` des Rezepts und speichert per `supabase.from("recipes").update({ items })` (RLS: nur Besitzer).
- `src/lib/recipes-api.ts`: Hilfsfunktion `updateRecipeItems(recipeId, items)`.
- Keine Datenbank-Migration noetig (`recipes.items` ist bereits JSON mit quantity/unit).
- i18n: `src/i18n/de.ts` + `src/i18n/messages.json` (15 Sprachen).
- Abschluss: Typpruefung, Build, Browser-Test (Generator-Menge aendern + gespeichertes Rezept bearbeiten).
