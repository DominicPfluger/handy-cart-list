# Märkte verwalten im Tab „Mehr"

## Was du bekommst
Im Admin-Bereich, Tab „Mehr", erscheint ein neuer Abschnitt **„Märkte verwalten"** (über „Markt-Admins verwalten"):

1. **Länder-Märkte**: Liste aller Länder (heute 14: DE, AT, CH, US, GB, CA, ES, MX, FR, IT, PT, BR, NL, BE) mit Flagge, Kürzel, Name und Währung.
   - Land hinzufügen (Kürzel, Name, Flagge, Währung)
   - Bearbeiten (Stift), Ein-/Ausblenden (Schalter), Reihenfolge per Ziehen, Löschen mit Rückfrage
2. **Supermärkte pro Land**: Tipp auf ein Land klappt dessen Supermarkt-Liste auf.
   - Supermarkt hinzufügen (Name, optional Emoji), umbenennen, ausblenden, ziehen, löschen
   - Startbestand: die üblichen Ketten je Land (z. B. CH: Migros, Coop, Denner, Aldi, Lidl, Volg, Manor; DE: Edeka, Rewe, Aldi, Lidl, Kaufland, Penny, Netto …)

Ausgeblendete Länder verschwinden aus allen Markt-Auswahlfeldern im Admin (Katalog, Preise, Import); neu angelegte Länder erscheinen dort automatisch.

## Technische Details
- Migration: zwei neue Tabellen
  - `markets` (code PK, name, flag, currency, enabled, sort_order, Zeitstempel)
  - `supermarkets` (id, market_code → markets, name, emoji, enabled, sort_order, Zeitstempel)
  - GRANT: SELECT für anon/authenticated, Schreibrechte authenticated + service_role; RLS: alle lesen, schreiben nur `has_role(auth.uid(),'admin')`; updated_at-Trigger.
  - Startdaten (14 Länder + Supermärkte) als INSERT in derselben Migration.
- Neue Komponente `src/components/admin/markets-manager.tsx`, eingebunden in `admin.tsx` im `more`-Tab.
- Hook `useMarkets()` (React Query, Fallback auf die heutige Liste) ersetzt die festen `MARKETS`-Konstanten in admin.tsx, import-panel.tsx, catalog-media-panel.tsx und brand-admin.tsx.
- Neue i18n-Keys `mkt.*` in de.ts + allen Locales von messages.json.
- Supermarkt-Liste wird gespeichert, aber die Angebots-Seite nutzt sie vorerst nicht (bleibt unverändert).
