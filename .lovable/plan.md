# Sortieren nach Markt-Relevanz im Admin-Panel

## Ziel
Im Admin-Tab „Katalog" bekommt die Sortier-Auswahl eine neue Option **„Markt-Relevanz"**: Die Produkte der offenen Kategorie werden nach ihrer Relevanz im gewählten Markt sortiert (z. B. welche Artikel in der Schweiz am häufigsten gekauft werden) — und die Reihenfolge wird nur für diesen Markt gespeichert.

## Umsetzung — nur `src/routes/_authenticated/admin.tsx` (+ Übersetzungen)

1. **Neue Option im Sortier-Dropdown:** „Markt-Relevanz" erscheint zusätzlich zu Relevanz / Preis / Alphabet / Ähnlichkeit — aber **nur, wenn oben ein Markt ausgewählt ist** (nicht bei „Global"). Bei „Global" wird die Option ausgeblendet; war sie gewählt und der Markt wird auf „Global" gestellt, springt die Auswahl zurück auf „Relevanz".

2. **Sortier-Logik:** `sortBy`-Typ um `"marketRelevance"` erweitern. In `sortProducts` wird dabei die bestehende KI-Funktion `rankProducts` mit Kriterium `popularity` **und** dem gewählten Markt (`market: mk`) aufgerufen — der Prompt berücksichtigt das Land bereits (lokale Begriffe, typische Produkte). Überschriften-Gruppen bleiben wie bei den anderen Kriterien erhalten.

3. **Speichern pro Markt:** Das bestehende `saveOrder` schreibt bei gewähltem Markt bereits in `product_market_order` (Reihenfolge gilt nur für diesen Markt, globale Sortierung bleibt unberührt) — keine Änderung nötig. Die Überschriften-Neuzuordnung wird bei Markt-Sortierung wie bisher übersprungen (`if (mk) return`).

4. **Rückfrage-Text:** Die Bestätigung nennt das Kriterium, z. B. „Markt-Relevanz (CH)".

5. **Übersetzungen:** Neuer Schlüssel `adm.opt.marketRelevance` in `src/i18n/de.ts` („Markt-Relevanz") und allen 15 Locales von `messages.json` (en: „Market relevance", fr: „Pertinence du marché", it: „Rilevanza del mercato", es: „Relevancia del mercado", pt: „Relevância do mercado", nl: „Marktrelevantie", de-AT/de-CH: „Markt-Relevanz").

## Keine Änderungen an
- Datenbank (Tabelle `product_market_order` und Rechte existieren bereits).
- KI-Funktion `rankProducts` (Markt-Parameter bereits vorhanden).
- Markt-Admins: Sie sehen nur ihren Markt und sortieren wie bisher nur dort.

## Verifikation
- Build prüfen.
- Playwright im Preview: /admin → Kategorie öffnen → Markt wählen → Option „Markt-Relevanz" erscheint im Dropdown → Sortieren ausführen → Reihenfolge ändert sich und bleibt nach Neuladen erhalten; bei „Global" ist die Option nicht sichtbar.
