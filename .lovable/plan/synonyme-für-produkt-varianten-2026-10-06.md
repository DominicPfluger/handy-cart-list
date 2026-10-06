# Synonyme für Produkt-Varianten

## Ziel
Jede Variante eines Produkts kann eigene Synonyme haben (z. B. Sojasauce · Glutenfrei → „Tamari“). Die Produktsuche und die Spracheingabe finden die Variante über diese Synonyme. Ausgewählt wird dann direkt die passende Variante, also „Sojasauce · Glutenfrei“.

## Bedienung (Admin → Produkt bearbeiten → Varianten)
- Jede Variante bekommt einen neuen Knopf „Synonyme“ (mit Rahmen) mit einer Zahl daneben.
- Ein Klick klappt unter der Variante einen Bereich auf. Dort stehen die vorhandenen Synonyme als Chips mit ✕ zum Entfernen, dazu ein Eingabefeld (Enter fügt hinzu, doppelte Einträge werden abgelehnt).
- Synonyme gelten für die aktuelle Admin-Sprache. Wird die Variante umbenannt, gehen ihre Synonyme mit.
- Den Synonym-Knopf gibt es erst, wenn das Produkt einmal gespeichert ist (wie beim Variantenbild).

## Suche und Spracheingabe
- Ein Treffer auf ein Synonym erscheint als Varianten-Treffer, genau wie die bestehende Varianten-Suche.
- Die Spracheingabe erkennt das Synonym und setzt das Produkt mit der passenden Variante auf die Liste.

## Technische Details
- Neue Tabelle `variant_synonyms` (product_id, variant, locale, term): Alle dürfen lesen, nur Admins dürfen schreiben (`has_role`).
- `catalog.functions.ts`: Die Katalog-Details erhalten zusätzlich `variantSynonyms` (product_id → variant → terms).
- Suche in `abteilungen.tsx` und der Abgleich in der Spracheingabe beziehen die Varianten-Synonyme mit ein.
- `variant-rename-button.tsx`: Beim Umbenennen werden auch die zugehörigen `variant_synonyms` aktualisiert.
- Neue Komponente `src/components/admin/variant-synonyms.tsx` für die Pflege im Dialog.
- Neue UI-Texte in `de.ts` und allen 16 Sprachdateien.

## Prüfung
Typprüfung und Build, danach ein Browser-Test: Synonym eintragen, in der Suche danach suchen, Variante wird gefunden.
