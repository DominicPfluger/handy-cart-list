# Kategorie „Kuchen" füllen

## Ziel
Die leere Kategorie **Kuchen** (unter „Backwaren & Frühstück") mit den 16 gewünschten Einträgen füllen, nach Relevanz sortiert, plus passende Ergänzungsvorschläge – wie immer in 15 Sprachen übersetzt.

## Sortierung nach Relevanz (Vorschlag)
1. Gugelhupf
2. Marmorkuchen
3. Schokoladenkuchen
4. Apfelkuchen
5. Zitronenkuchen
6. Karottenkuchen
7. Käsekuchen *(Vorschlag)*
8. Streuselkuchen
9. Kirschkuchen
10. Zwetschgenkuchen
11. Nusskuchen
12. Mohnkuchen
13. Butterkuchen
14. Bienenstich
15. Rhabarberkuchen
16. Kürbiskuchen
17. Donauwelle *(Vorschlag)*
18. Frankfurter Kranz *(Vorschlag)*
19. Brownies *(Vorschlag)*
20. Panettone

## Vorschläge für fehlende relevante Produkte
- **Käsekuchen** – Klassiker, fehlt in der Liste
- **Donauwelle** – beliebter Blechkuchen
- **Frankfurter Kranz** – klassischer Festkuchen
- **Brownies** – sehr häufig gekauft/gebacken

## Technische Umsetzung
- Bestehende Pipeline (`/tmp/fk/gen.mjs`-Muster): deterministische UUIDs (`a1b2c3d4-…`), sort_order in 10er-Schritten.
- Alle Einträge: Einheit `stueck`, Menge 1, Emoji 🍰.
- Diätfilter: Nusskuchen/Bienenstich enthalten Nüsse (kein excluded_diets nötig – Nussallergie ist kein Filter); Panettone/Brownies etc. bei `gluten_free` ausblenden; Karottenkuchen/Käsekuchen bleiben vegetarisch-tauglich (keine Ausschlüsse nötig).
- Übersetzungen für 15 Locales via KI-Gateway (de-CH ohne ß, z. B. „Zwetschenkuchen"), de-DE bleibt Quelle.
- Anwenden via `supabase--run_sql`, danach Zeilenzahl verifizieren.

## Ergebnis
Kategorie Kuchen mit 20 Einträgen (16 gewünscht + 4 Vorschläge), nach Relevanz sortiert, übersetzt.
