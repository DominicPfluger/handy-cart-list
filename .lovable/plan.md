# Länderküchen-Filter in der Abteilungsansicht

## Was der Nutzer sieht
- Neben dem 🥗-Ernährungsform-Icon im Suchfeld erscheint ein zweites Icon 🌍 (Tooltip „Länderküche").
- Klick öffnet Chips mit Küchen, z. B.: Italienisch, Französisch, Spanisch, Griechisch, Türkisch, Nahost/Orientalisch, Indisch, Thailändisch, Chinesisch, Japanisch, Koreanisch, Mexikanisch, US-amerikanisch, Schweizerisch, Deutsch/Österreichisch.
- Eine Küche wählbar (oder mehrere, dann Vereinigung). Ist eine Küche aktiv, zeigen Abteilungen, Unterkategorien und Suche nur Zutaten, die für diese Küche typisch sind; leere Kategorien werden ausgeblendet (wie beim Diätfilter). Kombinierbar mit dem Diätfilter.
- Non-Food (Haushalt, Drogerie, Küchenutensilien, Mode) wird bei aktivem Filter ausgeblendet.
- Auswahl wird nur auf diesem Gerät gespeichert.

## Daten
- Jedes Lebensmittel bekommt eine Liste typischer Küchen (z. B. Mozzarella → italienisch; Sojasauce → chinesisch, japanisch, koreanisch, thai). Universelle Basics (Salz, Mehl, Eier, Zwiebeln, Olivenöl …) werden mehreren passenden Küchen zugeordnet, damit Ergebnisse nicht zu dünn sind.
- Einmalige automatische KI-Zuordnung aller ~2.800 Produkte; danach im Admin-Panel pro Produkt manuell anpassbar. Neue Produkte werden beim Anlegen automatisch klassifiziert (wie bei der Ernährungsform).

## Technische Details
- Migration: `products.cuisines text[] not null default '{}'` (kein neues RLS nötig).
- `src/hooks/use-cuisine-filter.ts` analog `use-diet-filter.ts` (CUISINES, CUISINE_EMOJI, localStorage `shoppi:cuisine-filter`).
- `catalog.functions.ts`: Spalte `cuisines` laden; Filterlogik in `abteilungen.tsx` neben `excludedDiets` (Produkt sichtbar, wenn keine Küche gewählt oder Schnittmenge vorhanden).
- Klassifizierung: einmaliges Skript über Lovable AI (Batches à ~100 Produkte, Name + Kategorie), Ergebnis per SQL-Update; Admin-Panel: Mehrfachauswahl „Küchen" im Produkt-Editor; beim Produktanlegen serverseitig mitklassifizieren (bestehender translate/classify-Pfad).
- i18n: Labels für 15 Küchen + „Länderküche" in `de.ts` und allen Locales in `messages.json`.
- AGENTS.md-Regel ergänzen: Küchenfilter nutzt products.cuisines (AI-klassifiziert, leer für Non-Food).
