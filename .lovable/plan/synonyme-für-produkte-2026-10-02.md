# Synonyme für Produkte

## Ziel
Im Admin-Bearbeiten-Dialog eines Produkts können beliebig viele Synonyme erfasst werden (z. B. Maracuja → „Passionsfrucht", Klebstreifen → „Tesafilm", „Klebeband"). Wer in der App nach einem Synonym sucht, findet das Produkt. In der Liste erscheint weiterhin der normale Produktname.

## Verhalten
- Admin: Neues Feld „Synonyme" im Produkt-Dialog (Admin-Liste und Kachelansicht), als Chips mit Eingabefeld: Enter oder Komma fügt hinzu, x entfernt.
- Synonyme gelten pro Sprache: Ein Synonym wird für die aktuell gewählte Admin-Sprache gespeichert (deutsch „Tesafilm", englisch „Scotch tape"). Optional ein Knopf „Synonyme für alle Sprachen per KI vorschlagen" (nur auf Klick, keine automatischen KI-Aufrufe).
- Suche (Einkaufsliste, Abteilungen, Favoriten): Treffer auf Name, Variante oder Synonym. Bei einem Synonymtreffer zeigt der Eintrag klein „auch: Tesafilm", damit klar ist, warum er erscheint.
- Sortierung der Treffer bleibt wie heute (Verlauf zuerst, dann Abteilungsreihenfolge); exakte Namenstreffer vor Synonymtreffern.

## Technische Details
- Neue Tabelle `product_synonyms` (product_id → products, locale, term, unique(product_id, locale, lower(term))), GRANT select für anon/authenticated, Schreiben nur Admin via `has_role`, Marktadmin via `is_market_product_admin`.
- `catalog.functions.ts` / `catalog-query.ts`: Synonyme der aktiven Sprache (Fallback de) mitladen und in den Such-Index neben `variants` aufnehmen; Normalisierung wie bei Namen (ss/ß, Gross-/Kleinschreibung, Akzente).
- Speichern über bestehenden Admin-Speicherweg (`admin.tsx`-Callbacks, gemeinsam für Liste und Kachel-Editor).
- Optionale KI-Vorschläge in `admin.functions.ts` (Lovable AI), Ergebnis nur als Vorschlag, Admin bestätigt.
- i18n-Texte (`adm.synonyms`, `search.alsoKnownAs` …) in de.ts + allen 15 Lokalen.
- Startwerte: Maracuja/Passionsfrucht und Klebstreifen/Tesafilm/Klebeband werden mitgeliefert, falls die Produkte existieren.
- Test im Browser: Synonym erfassen, in der Suche „Tesafilm" eingeben, Klebstreifen erscheint.
