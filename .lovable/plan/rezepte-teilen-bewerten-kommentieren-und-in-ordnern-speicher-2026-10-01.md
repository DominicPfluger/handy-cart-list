# Rezepte teilen, bewerten, kommentieren und in Ordnern speichern

## Ausgangslage
Gespeicherte Rezepte liegen heute nur auf dem Gerät (Sammlungen = Ordner, ohne Konto). Damit Teilen, Bewertungen und "am häufigsten gespeichert" funktionieren, werden generierte Rezepte neu in der Cloud abgelegt.

## Was der Nutzer bekommt
1. **Rezept veröffentlichen & teilen** — Knopf "Teilen" im Rezept-Generator erstellt einen öffentlichen Link (z. B. /rezept/abc123). Teilen über das Handy-Teilen-Menü (WhatsApp usw.) oder Link kopieren. Die Rezeptseite ist auch ohne Anmeldung lesbar, mit Vorschaubild/Titel beim Teilen.
2. **Bewerten** — 1 bis 5 Sterne, eine Bewertung pro Person (änderbar). Durchschnitt + Anzahl sichtbar.
3. **Kommentieren** — Kommentarliste unter dem Rezept; eigene Kommentare löschbar, Admin kann alle löschen.
4. **Persönliche Rezeptliste mit Ordnern** — eigene Ordner anlegen/umbenennen/löschen (eine Ebene), Rezepte in Ordner speichern oder verschieben. Bestehende Geräte-Sammlungen werden beim ersten Anmelden automatisch übernommen.
5. **Neue Bereiche in der Rezeptansicht** (oberhalb des Generators, horizontal wischbar):
   - Am besten bewertet
   - Am häufigsten gespeichert
   - Mit deinen Lieblingszutaten (Rezepte, die Produkte aus deinen Favoriten enthalten, sortiert nach Anzahl Treffer)
6. Zutaten eines geteilten Rezepts mit einem Tipp auf die eigene Einkaufsliste übernehmen.
7. Bewerten, Kommentieren und Speichern brauchen Anmeldung; ohne Anmeldung erscheint ein "Anmelden, um …"-Hinweis.
8. Alle neuen Texte in allen 16 Sprachen.

## Offene Annahmen
- Geteilte Rezepte sind öffentlich für alle sichtbar; der Ersteller kann ein Rezept wieder privat stellen oder löschen.
- Rezepttitel/Kommentare werden nicht automatisch übersetzt (Zutaten schon, über den Katalog).

## Technische Details
- Neue Tabellen (mit GRANTs + RLS):
  - `recipes` (id, owner_id, title, template_id, picks jsonb, product_ids uuid[], is_public, share_slug, author_name, created_at) — public SELECT wenn is_public, Owner schreibt.
  - `recipe_ratings` (recipe_id, user_id, stars 1-5, unique) — eigene schreiben, Aggregat öffentlich.
  - `recipe_comments` (recipe_id, user_id, author_name, body, created_at) — lesen öffentlich bei öffentlichem Rezept, eigene einfügen/löschen, Admin via has_role löschen.
  - `recipe_folders` (owner_id, name, sort_order) und `recipe_saves` (user_id, recipe_id, folder_id, unique user+recipe) — nur eigene.
  - View/Funktion `recipe_stats` (avg_rating, rating_count, save_count) für die Ranglisten.
- Server-Funktionen in `src/lib/recipes.functions.ts`: öffentliche Lesefunktionen (Top bewertet, meistgespeichert, nach Produkt-IDs per Überlappung `product_ids && favIds`, Einzelrezept per Slug) mit Publishable-Client; geschützte Funktionen (veröffentlichen, bewerten, kommentieren, Ordner/Saves) mit requireSupabaseAuth.
- Neue öffentliche Route `src/routes/rezept.$slug.tsx` (SSR, eigener head() mit Titel/Beschreibung).
- `use-saved-recipes.ts` wird auf Cloud umgestellt, mit einmaliger Migration aus localStorage `shoppi:recipe-collections`.
- recipe-builder.tsx: Teilen-Knopf, Speichern-Dialog nutzt Cloud-Ordner; rezepte.tsx: drei Karussells.
- i18n-Schlüssel in de.ts + messages.json.
