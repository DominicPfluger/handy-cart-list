# Supermarkt-Import im Admin-Bereich

## Was du bekommst
Im Admin-Bereich gibt es einen neuen Bereich **„Import"**:

1. **Link einfügen** — z. B. eine Sortiments- oder Kategorieseite von Migros, Coop, REWE usw.
2. **Einlesen** — die Seite wird abgerufen, die KI zieht daraus Produktname, **Preis**, Packungsgrösse und – falls angegeben – den **Grundpreis** (z. B. CHF 2.40 / 100 g). Werbetexte fallen weg.
3. **Abgleich mit dem Katalog** — jede Zeile bekommt einen Status:
   - **Vorhanden** (gleicher Name, auch in einer Übersetzung) — Produkt bleibt, nur der Richtpreis wird aktualisiert
   - **Ähnlich** (z. B. „Rispentomaten" vs. „Tomaten") — Vorschlag, du wählst „ist dasselbe" oder „neu anlegen"
   - **Neu** — mit vorgeschlagener Abteilung, Emoji und Standardmenge
4. **Vorschau bestätigen** — Häkchen pro Zeile, Abteilung und Preis änderbar, dann „Ausgewählte speichern".
5. Neue Produkte gelten **global** (alle Märkte) und werden **sofort in alle 16 Sprachen übersetzt**.

## Richtpreise
- Preise werden als **Richtwert pro Land** gespeichert (Währung des Markts, z. B. CHF, EUR), mit Quelle und Datum.
- **Grundpreis** pro 100 g / kg bzw. 100 ml / l, wenn die Seite ihn nennt oder er sich sicher aus Preis und Packungsgrösse berechnen lässt (z. B. Käse, Fleisch, Kaffee, Getränke). Bei Stückware (Avocado, Brot) kein Grundpreis.
- Anzeige in der App: kleiner grauer Hinweis „ca. CHF 2.40 · 0.48/100 g" in der Produktdetail-Ansicht und Produktliste — klar als Richtwert gekennzeichnet, keine Preisvergleiche oder Budget-Funktionen.

## Automatische Synchronisation
- Jeder Link kann als **Quelle gespeichert** werden (Name, Link, Intervall: täglich/wöchentlich, an/aus).
- Ein geplanter Job liest gespeicherte Quellen regelmässig neu ein.
- Gefundene **neue** Produkte werden **nicht automatisch** in den Katalog übernommen, sondern landen als „Wartet auf Bestätigung" im Import-Bereich (Zähler-Badge). So bleibt deine Bestätigung erhalten.
- Pro Quelle sichtbar: letzter Lauf, Anzahl neu/vorhanden, Fehler (z. B. Seite blockiert).

## Grenzen
- Manche Supermarkt-Seiten laden Produkte erst per Script oder blockieren Abrufe. Dafür verwende ich einen Web-Abrufdienst (Firecrawl), den du einmal verbinden musst. Ohne ihn funktionieren nur einfache Seiten.
- Bilder werden nicht übernommen. Preise sind Momentaufnahmen und können veralten (Datum wird angezeigt).

## Technische Details
- **Migration**: `import_sources` (name, url, market, interval, enabled, last_run_at, last_status), `import_candidates` (source_id, raw_name, suggested_name, department_id, emoji, price, currency, pack_size, pack_unit, unit_price, unit_basis '100g'/'kg'/'100ml'/'l', match_product_id, match_type, status, created_at) — RLS nur Admin. Neu `product_reference_prices` (product_id, market, price, currency, pack_size, pack_unit, unit_price, unit_basis, source_id, observed_at; unique product_id+market) — öffentlich lesbar, schreiben nur Admin. GRANTs in derselben Migration.
- Grundpreis: von Seite übernommen, sonst berechnet nur bei Gewichts-/Volumeneinheit; Plausibilitätsprüfung.
- **Server-Funktionen** (`src/lib/import.functions.ts`, `requireSupabaseAuth` + Admin-Check): `scanUrl` (Abruf via Firecrawl-Gateway scrape → Markdown; Fallback plain fetch), KI-Extraktion über `aiJson` (Namen normalisiert, Deutsch), Abgleich: exakt/case-insensitive gegen `products.name` + `catalog_translations.name`, danach KI-Ähnlichkeit für Rest-Kandidaten mit Abteilungsvorschlag aus `departments`. `saveSources`, `acceptCandidates` (Insert `products`, dann `translateNames` für alle `TRANSLATED_LOCALES` in `catalog_translations`), `rejectCandidates`.
- **Sync**: Server-Route `src/routes/api/public/cron/import-sync.ts`, gesichert mit eigenem Secret (`IMPORT_CRON_SECRET`); pg_cron + pg_net ruft sie stündlich auf, die Route verarbeitet fällige Quellen und schreibt nur `import_candidates` (Dubletten per unique raw_name+source unterdrückt).
- **UI**: neuer Abschnitt in `src/routes/_authenticated/admin.tsx` (Komponente `src/components/admin/import-panel.tsx`): Link-Feld, Kandidaten-Tabelle mit Status-Chips, Quellenliste mit Schaltern.
- **i18n**: neue `adm.import.*`-Texte in `src/i18n/de.ts` + `messages.json` (16 Sprachen, de-CH Standarddeutsch).
