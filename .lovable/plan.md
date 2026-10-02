# Rezept-Eigenschaften im Speichern-Dialog

Im Speichern-Dialog des Rezept-Generators („Rezept speichern") kannst du künftig drei optionale Eigenschaften ankreuzen:

- **Sättigung:** Leicht · Ausgewogen · Sättigend · Deftig · Üppig
- **Schärfe:** Ohne Schärfe · Mild · Leicht scharf · Mittelscharf · Scharf · Sehr scharf · Feurig
- **Preisklasse:** Budgetbewusst · Preiswert · Standard · Gehoben · Exquisit

## Umsetzung

1. **Auswahl im Dialog:** Unter der Beschreibung erscheinen drei Gruppen mit anklickbaren Chips (wie die Ernährungsform-Auswahl). Pro Gruppe ist genau eine Wahl möglich; erneutes Antippen hebt sie wieder auf. Alle drei sind freiwillig — nichts auswählen bleibt möglich.
2. **Speichern:** Die Wahl wird zusammen mit dem Rezept gespeichert (neue Felder am Rezept in der Datenbank). Sie gilt für private und öffentliche Rezepte gleichermassen.
3. **Anzeige:** Auf der Rezept-Seite erscheinen die gewählten Eigenschaften als kleine Chips unter dem Titel (z. B. „🍽️ Sättigend · 🌶️ Mild · 💰 Preiswert"). Rezepte ohne Angaben zeigen keine Chips.
4. **Sprachen:** Alle Bezeichnungen in Deutsch und den 15 weiteren App-Sprachen.

## Technische Details

- Migration: `recipes` um drei nullable Text-Spalten erweitern (`satiety`, `spiciness`, `price_class`); Werte als stabile Schlüssel (z. B. `light`, `mild`, `budget`), Anzeige über i18n.
- `src/lib/recipes-api.ts` `createRecipe`: drei optionale Felder ergänzen.
- `src/components/recipe-builder.tsx` Speichern-Dialog: drei Chip-Gruppen mit State, Übergabe an `createRecipe` (beide Speicher-Wege: Sammlung und „+ Neue Sammlung").
- `src/routes/rezept.$slug.tsx`: Chips unter dem Titel anzeigen (nur vorhandene Werte).
- i18n: Schlüssel `rk.satiety`, `rk.satiety.*` (5), `rk.spiciness`, `rk.spiciness.*` (7), `rk.priceClass`, `rk.priceClass.*` (5) in `de.ts` + allen 15 Lokalen in `messages.json`.
- Danach: Typecheck + Build, kurzer Browser-Test (Dialog öffnen, Chips wählen, speichern, Rezept-Seite prüfen).

## Nicht Teil

- Keine Filter-/Suchfunktion nach diesen Eigenschaften (kann später ergänzt werden).
- Keine Pflichtfelder, keine Änderung an bestehenden Rezepten.
- Kein nachträgliches Bearbeiten der Eigenschaften (nur beim Speichern wählbar).
