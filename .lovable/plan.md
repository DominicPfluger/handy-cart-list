# Kategorie-Kacheln aus dem Rezept-Generator entfernen

## Ziel

Die Kategorie-Kacheln (Müsli, Smoothie, Salat, Sandwiches, Pizza, Pfannengericht, Menü-Kombinationen, Dessert) verschwinden aus der Generator-Seite (/rezepte/generator). Die Kategorien wählt man künftig nur noch über die Kacheln auf der Rezepte-Hauptseite (/rezepte) — diese bleiben unverändert.

## Verhalten

- **Generator-Seite mit `?cat=…`:** Nur noch der Generator (Filter, Zutaten, Speichern) — keine Kategorie-Kacheln mehr oberhalb.
- **Generator-Seite ohne Kategorie** (direkter Aufruf von /rezepte/generator ohne `cat` und ohne `recipe`): automatische Weiterleitung zurück zur Rezepte-Hauptseite, wo die Kacheln zur Auswahl stehen.
- **Öffnen eines Community-Rezepts** (`?recipe=…` ohne `cat`): weiter möglich — hier wird die Kategorie aus dem Rezept ermittelt, keine Weiterleitung.
- **„← Zurück"-Knopf** im geöffneten Generator führt zurück zur Rezepte-Hauptseite (dort steht die Kategorie-Auswahl).

## Technische Umsetzung

1. `src/components/recipe-builder.tsx`
   - `categoryBar` im Modus `generator` entfernen (sowohl der Block unter „Basis-Rezept erstellen" als auch die Kacheln oberhalb des geöffneten Generators).
   - Den „← Zurück"-Knopf im Modus `generator` als Link nach `/rezepte` rendern statt `setTplId(null)` (in den anderen Modi bleibt alles wie bisher).
   - Nicht mehr benutzte Importe/Code aufräumen (z. B. falls `RECIPE_TEMPLATES`/`setTplId` an dieser Stelle nicht mehr gebraucht werden — vorsichtig prüfen, `setTplId` wird anderswo weiterverwendet).
2. `src/routes/rezepte.generator.tsx`
   - `beforeLoad`: Wenn weder `cat` noch `recipe` gesetzt ist → `redirect({ to: "/rezepte" })`.
   - Überschrift bleibt wie bisher (gewählte Kategorie als Titel, sonst „Rezept-Generator" — letzteres erscheint praktisch nie mehr wegen der Weiterleitung).
3. Keine Änderungen an `/rezepte` (Kacheln bleiben), keine Übersetzungs- oder Datenbank-Änderungen.

## Prüfung

- Build läuft fehlerfrei.
- Vorschau: /rezepte/generator ohne Parameter leitet auf /rezepte weiter; mit `?cat=pizza` erscheint nur der Pizza-Generator ohne Kacheln; Community-Rezept lässt sich weiterhin im Generator öffnen; „← Zurück" landet auf /rezepte.
