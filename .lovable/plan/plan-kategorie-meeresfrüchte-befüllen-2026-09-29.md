# Plan: Kategorie Meeresfrüchte befüllen

## Ziel
Die Kategorie **Meeresfrüchte** (unter Fleisch & Fisch) mit den zuvor aus Fisch entfernten Einträgen plus sinnvollen Ergänzungen füllen, nach Relevanz und Ähnlichkeit sortiert.

## Einträge (je 1 Packung, ausser wo sinnvoll anders)

**Garnelen & Co.**
- Gambas (Riesengarnelen)
- Garnelen
- Krabben
- Hummer
- Langusten
- Scampi

**Muscheln**
- Miesmuscheln
- Venusmuscheln
- Jakobsmuscheln
- Austern

**Weichtiere**
- Tintenfisch
- Calamari (Tintenfischringe)
- Oktopus
- Sepia

Gesamt: 15 Artikel, gruppiert nach Ähnlichkeit (Garnelen/Krebstiere → Muscheln → Weichtiere).

## Umsetzung
1. IDs der Kategorien Meeresfrüchte und Fleisch & Fisch prüfen (Kategorie existiert evtl. bereits, sonst neu anlegen).
2. 15 Produkte via run_sql einfügen (Standardmenge 1 Packung; Austern 1 Dutzend → 1 Stück).
3. Ernährungsform-Klassifikation: excluded_diets = {vegetarian, vegan} für alle; Hummer/Austern etc. keine weiteren Ausschlüsse.
4. Übersetzungen in catalog_translations für en-US, es-ES, fr-FR, it-IT, nl-NL, pt-BR (is_manual=false); regionale Varianten fallen automatisch zurück.
5. sort_order gemäss obiger Reihenfolge.

## Technische Details
- Tabellen: products, departments, catalog_translations (keine Schemaänderung, nur run_sql).
- Kein Code-Eingriff nötig; 30s Katalogcache — nach Neuladen sichtbar.
