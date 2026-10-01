# Schokoriegel: 14 neue Produkte + Marken

## Was

In der bestehenden Kategorie **Schokoriegel** (Unterkategorie von Süssigkeiten) 14 Produkte in der gewünschten Reihenfolge anlegen:

1. Erdnussbutter-Riegel knusprig
2. Karamell-Nougat-Riegel
3. Karamell-Keks-Riegel
4. Erdnuss-Karamell-Riegel
5. Kokos-Riegel
6. Getreide-Riegel
7. Nougat-Riegel
8. Waffelriegel
9. Nuss-Karamell-Riegel
10. Karamell-Getreide-Riegel
11. Joghurt-Riegel
12. Schoko-Wafer-Riegel
13. Karamell-Schoko-Riegel
14. Erdnuss-Nougat-Riegel

Alle als Stück mit Schokoladen-Icon, am Ende der bestehenden Einträge. Übersetzungen in alle 15 Sprachen.

## Marken (ja, werden ergänzt)

Pro Produkt passende, verbreitete Marken in `product_brands` eintragen, z. B.:

- Erdnuss-Karamell-Riegel → Snickers
- Karamell-Keks-Riegel → Twix
- Kokos-Riegel → Bounty
- Schoko-Wafer-Riegel → KitKat
- Karamell-Nougat-Riegel → Mars
- Nougat-Riegel → Milky Way
- Erdnussbutter-Riegel knusprig → Reese's
- Joghurt-Riegel → Yoguette
- Getreide-/Karamell-Getreide-Riegel → Kellogg's, Nestlé Fitness
- Waffelriegel → Knoppers, Hanuta

Damit funktioniert die Marken-Suche (z. B. „Snickers" findet den Erdnuss-Karamell-Riegel) und die Marken-Auswahl beim Hinzufügen.

## Ergänzungen (proaktiv)

Zwei fehlende Klassiker als eigene Produkte: **Milch-Nougat-Riegel** (Kinder Bueno-artig) und **Erdbeer-Joghurt-Riegel**. Werden entfernt, falls unerwünscht.

## Technisch

- `products`: 14 (+2) Zeilen, department_id = Schokoriegel (d5e6f701-…), default_unit stueck, emoji 🍫, sort_order fortlaufend — via `supabase--run_sql`.
- `product_brands`: Marken mit locales (CH/DE/AT-relevante Marken entsprechend) — via `supabase--run_sql`.
- `catalog_translations`: Produktnamen in 15 Locales, is_manual=false — via psql.
- Keine Schemaänderung, keine Codeänderung.
