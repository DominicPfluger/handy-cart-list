# Admin-Katalog: Markt-Relevanz-Sortierung + Überschrift verschiebt ihre Produkte mit

## Teil 1 — Sortieren nach Markt-Relevanz

**Ziel:** Die Sortier-Auswahl im Admin-Tab „Katalog" bekommt eine neue Option **„Markt-Relevanz"**: Die Produkte der offenen Kategorie werden nach ihrer Relevanz im gewählten Markt sortiert (z. B. welche Artikel in der Schweiz am häufigsten gekauft werden) — und die Reihenfolge wird nur für diesen Markt gespeichert.

**Umsetzung — `src/routes/_authenticated/admin.tsx` (+ Übersetzungen):**
1. **Neue Option im Sortier-Dropdown:** „Markt-Relevanz" erscheint zusätzlich zu Relevanz / Preis / Alphabet / Ähnlichkeit — aber **nur, wenn oben ein Markt ausgewählt ist** (nicht bei „Global"). Bei „Global" wird die Option ausgeblendet; war sie gewählt und der Markt wird auf „Global" gestellt, springt die Auswahl zurück auf „Relevanz".
2. **Sortier-Logik:** `sortBy`-Typ um `"marketRelevance"` erweitern. In `sortProducts` wird die bestehende KI-Funktion `rankProducts` mit Kriterium `popularity` **und** dem gewählten Markt (`market: mk`) aufgerufen — der Prompt berücksichtigt das Land bereits. Überschriften-Gruppen bleiben erhalten.
3. **Speichern pro Markt:** Das bestehende `saveOrder` schreibt bei gewähltem Markt bereits in `product_market_order` (gilt nur für diesen Markt, globale Sortierung bleibt unberührt) — keine Änderung nötig.
4. **Übersetzungen:** Neuer Schlüssel `adm.opt.marketRelevance` in `src/i18n/de.ts` („Markt-Relevanz") und allen 15 Locales von `messages.json`.

## Teil 2 — Überschrift verschiebt ihre Produkte mit

**Ziel:** Wird eine Überschrift in der Kachel-Ansicht per Drag & Drop auf ein anderes Produkt gezogen, wandert die **ganze Gruppe** mit: die Überschrift plus alle Produkte darunter bis zur nächsten Überschrift (bzw. bis zum Ende der Kategorie).

**Umsetzung — `src/routes/_authenticated/admin.tsx` (Funktion `moveHeading`):**
1. Beim Ablegen einer Überschrift auf ein Ziel-Produkt:
   - Die Gruppe bestimmen: alle Produkte ab dem aktuellen Anker-Produkt der Überschrift bis vor die nächste Überschrift.
   - Diese Produkte aus der Liste nehmen und als Block **vor dem Ziel-Produkt** wieder einfügen (Rest rutscht entsprechend auf).
   - Neue Reihenfolge mit `saveOrder` speichern (global bzw. pro Markt, wie gehabt).
   - Die Überschrift an das neue erste Produkt ihrer Gruppe hängen (`saveHeading`).
2. Rückfrage vor dem Verschieben: „Überschrift und ihre X Produkte verschieben?" — damit kein versehentlicher Gross-Umzug passiert.
3. Überschriften ohne Produkte darunter (leere Gruppe) verhalten sich wie bisher: nur der Titel wandert.
4. Neuer Übersetzungs-Schlüssel `adm.headingMoveConfirm` in de.ts + messages.json; Erfolgsmeldung `adm.headingMoved` existiert bereits.

## Keine Änderungen an
- Datenbank (`product_market_order`, `product_headings` und Rechte existieren bereits).
- KI-Funktion `rankProducts` (Markt-Parameter bereits vorhanden).
- Drag & Drop von Produkten und Kategorien bleibt wie es ist.
- Markt-Admins: unveränderte Rechte.

## Verifikation
- Build prüfen.
- Playwright im Preview: /admin → Kategorie mit Überschriften öffnen → Überschrift am Griff auf ein Produkt weiter unten ziehen → Überschrift **und** ihre Produkte stehen danach an der neuen Position; nach Neuladen erhalten. Sortieren: Markt wählen → „Markt-Relevanz" erscheint → Sortieren ausführen → Reihenfolge bleibt nach Neuladen; bei „Global" ist die Option nicht sichtbar.
