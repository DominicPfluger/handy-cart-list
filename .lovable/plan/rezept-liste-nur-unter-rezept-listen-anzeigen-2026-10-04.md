# Rezept-Liste nur unter „Rezept-Listen" anzeigen

## Ziel
Der Block „Meine Rezepte" (gespeicherte Rezept-Liste) soll nicht mehr auf der Seite „Rezept-Inspirationen" erscheinen. Er bleibt ausschliesslich unter „Rezept-Listen" sichtbar.

## Änderung
- In `src/components/recipe-builder.tsx` wird die zuletzt ergänzte Zeile im Inspiration-Modus wieder entfernt:
  - Aktuell: `{mode === "inspiration" && <>{collectionsView}{popularView}{recentView}</>}`
  - Neu: `{mode === "inspiration" && <>{popularView}{recentView}</>}`
- Der Listen-Modus (`mode === "lists"`) bleibt unverändert und zeigt weiterhin `collectionsView` („Meine Rezepte").

## Ergebnis
- `/rezepte/inspirationen`: Community-Rezepte oben, dann Favoriten, beliebte und kürzlich erstellte Rezepte — ohne „Meine Rezepte".
- `/rezepte/listen`: zeigt weiterhin die eigene Rezept-Liste.

## Technische Details
- Eine einzige Zeilenänderung in `src/components/recipe-builder.tsx`.
- Keine neuen Übersetzungen, keine Datenbankänderungen.
- Prüfung: Typprüfung (`bunx tsgo --noEmit`) und kurzer Browser-Check beider Seiten.
