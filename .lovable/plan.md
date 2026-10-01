# Supermarkt-Import im Admin-Bereich

## Was du bekommst
Im Admin-Bereich gibt es einen neuen Bereich **„Import"**:

1. **Link einfügen** — z. B. eine Sortiments- oder Kategorieseite von Migros, Coop, REWE usw.
2. **Einlesen** — die Seite wird abgerufen, die KI zieht daraus die Produktnamen (ohne Preise, Werbetexte, Marken-Floskeln).
3. **Abgleich mit dem Katalog** — jede Zeile bekommt einen Status:
   - **Vorhanden** (gleicher Name, auch in einer Übersetzung) — wird übersprungen
   - **Ähnlich** (z. B. „Rispentomaten" vs. „Tomaten") — Vorschlag, du wählst „ist dasselbe" oder „neu anlegen"
   - **Neu** — mit vorgeschlagener Abteilung, Emoji und Standardmenge
4. **Vorschau bestätigen** — Häkchen pro Zeile, Abteilung änderbar, dann „Ausgewählte speichern".
5. Neue Produkte gelten **global** (alle Märkte) und werden **sofort in alle 16 Sprachen übersetzt**.

## Automatische Synchronisation
- Jeder Link kann als **Quelle gespeichert** werden (Name, Link, Intervall: täglich/wöchentlich, an/aus).
- Ein geplanter Job liest gespeicherte Quellen regelmässig neu ein.
- Gefundene **neue** Produkte werden **nicht automatisch** in den Katalog übernommen, sondern landen als „Wartet auf Bestätigung" im Import-Bereich (Zähler-Badge). So bleibt deine Bestätigung erhalten.
- Pro Quelle sichtbar: letzter Lauf, Anzahl neu/vorhanden, Fehler (z. B. Seite blockiert).

## Grenzen
- Manche Supermarkt-Seiten laden Produkte erst per Script oder blockieren Abrufe. Dafür verwende ich einen Web-Abrufdienst (Firecrawl), den du einmal verbinden musst. Ohne ihn funktionieren nur einfache Seiten.
- Bilder und Preise werden nicht übernommen (Preise bewusst ausgeklammert).

## Technische Details
- **Migration**: `import_sources` (name, url, interval, enabled, last_run_at, last_status) und `import_candidates` (source_id, raw_name, suggested_name, department_id, emoji, match_product_id, match_type exact/similar/new, status pending/accepted/rejected, created_at). GRANTs + RLS: nur `has_role(admin)` lesen/schreiben.
- **Server-Funktionen** (`src/lib/import.functions.ts`, `requireSupabaseAuth` + Admin-Check): `scanUrl` (Abruf via Firecrawl-Gateway scrape → Markdown; Fallback plain fetch), KI-Extraktion über `aiJson` (Namen normalisiert, Deutsch), Abgleich: exakt/case-insensitive gegen `products.name` + `catalog_translations.name`, danach KI-Ähnlichkeit für Rest-Kandidaten mit Abteilungsvorschlag aus `departments`. `saveSources`, `acceptCandidates` (Insert `products`, dann `translateNames` für alle `TRANSLATED_LOCALES` in `catalog_translations`), `rejectCandidates`.
- **Sync**: Server-Route `src/routes/api/public/cron/import-sync.ts`, gesichert mit eigenem Secret (`IMPORT_CRON_SECRET`); pg_cron + pg_net ruft sie stündlich auf, die Route verarbeitet fällige Quellen und schreibt nur `import_candidates` (Dubletten per unique raw_name+source unterdrückt).
- **UI**: neuer Abschnitt in `src/routes/_authenticated/admin.tsx` (Komponente `src/components/admin/import-panel.tsx`): Link-Feld, Kandidaten-Tabelle mit Status-Chips, Quellenliste mit Schaltern.
- **i18n**: neue `adm.import.*`-Texte in `src/i18n/de.ts` + `messages.json` (16 Sprachen, de-CH Standarddeutsch).
