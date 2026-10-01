# Länderküchen-Filter in der Abteilungsansicht

## Was der Nutzer sieht
- Neben dem 🥗-Ernährungsform-Icon im Suchfeld erscheint ein zweites Icon 🌍 (Tooltip „Länderküche").
- Klick öffnet Chips mit Küchen, z. B. zum Start: Italienisch, Französisch, Spanisch, Griechisch, Türkisch, Nahost/Orientalisch, Indisch, Thailändisch, Chinesisch, Japanisch, Koreanisch, Mexikanisch, US-amerikanisch, Schweizerisch, Deutsch/Österreichisch.
- Mehrere Küchen wählbar (Vereinigung). Ist eine Küche aktiv, zeigen Abteilungen, Unterkategorien und Suche nur typische Zutaten; leere Kategorien werden ausgeblendet. Kombinierbar mit dem Diätfilter.
- Non-Food wird bei aktivem Filter ausgeblendet. Auswahl nur auf diesem Gerät gespeichert.

## Admin-Panel
- Neuer Bereich „Länderküchen": Küchen anlegen, umbenennen (inkl. Emoji), sortieren, löschen. Neue Küchen werden automatisch in alle Sprachen übersetzt; manuelle Übersetzungen bleiben geschützt.
- Pro Küche: Liste der zugewiesenen Produkte mit Entfernen-Button und Suchfeld „Produkt zuweisen"; ganze Kategorie auf einmal zuweisen/entfernen.
- Im Produkt-Editor: Mehrfachauswahl der Küchen (Häkchen setzen/entfernen).
- Button „✨ Automatisch zuordnen" pro Küche: KI schlägt passende Produkte vor, Admin bestätigt.

## Daten
- Startausstattung: 15 Küchen und einmalige KI-Zuordnung aller ~2.800 Produkte; danach alles manuell anpassbar. Universelle Basics (Salz, Mehl, Eier, Zwiebeln …) werden mehreren passenden Küchen zugeordnet.

## Technische Details
- Migration: Tabelle `cuisines` (id, name, emoji, sort_order) und `product_cuisines` (product_id, cuisine_id, unique) mit GRANTs, RLS: öffentlich lesbar, Schreiben nur `has_role(auth.uid(),'admin')`. Übersetzungen über `catalog_translations` (entity_type `cuisine`).
- `catalog.functions.ts`: Küchen + Zuordnungen laden, `product.cuisineIds` ergänzen.
- `src/hooks/use-cuisine-filter.ts` analog `use-diet-filter.ts` (localStorage `shoppi:cuisine-filter`, speichert Küchen-IDs).
- Filterlogik in `abteilungen.tsx` neben `excludedDiets`.
- Admin: neuer Tab in `/admin`; KI-Vorschläge über bestehenden Lovable-AI-Serverpfad (wie Produktvorschläge).
- Initiale Zuordnung: Skript in Batches über Lovable AI, Ergebnis per SQL eingefügt.
- i18n: „Länderküche" + Admin-Texte in `de.ts` und `messages.json`.
- AGENTS.md: Küchenfilter nutzt `product_cuisines` (admin-gepflegt, AI-vorbefüllt).
