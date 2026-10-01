# Eigene Markt-Liste & Angebote (Admin) — plus freigegebene Feinschliffe

## Ziel
Die Angebots-Seite hört auf, von fest einprogrammierten Demo-Daten (REWE/ALDI/Lidl, Frankfurt) abzuhängen. Stattdessen verwaltetst du im Admin-Bereich eine eigene **Markt-Liste** (Supermarkt-Ketten pro Land) und eigene **Angebote** (Aktionsartikel mit Preis). Alle Nutzer sehen die Angebote ihres Landes. Ausserdem werden die bereits freigegebenen Anpassungen umgesetzt (hellere Kategoriefarben, zentrierte Bezeichnungen, kleinere Listen-Kästchen).

## Teil 1 — bereits freigegeben (Kategorien & Listen)
- `src/styles.css`: alle 20 `--cat-*`-Farben heller und weniger gesättigt.
- `src/routes/abteilungen.tsx`: Kategorie-Namen zentriert, Pfeil rechts am Rand (Haupt- und Unterebene).
- `src/routes/index.tsx` (+ `favoriten.tsx` falls gleich): Listen-Kästchen `h-9 w-9` → `h-8 w-8`, Emoji `text-lg` → `text-base`.

## Teil 2 — Märkte & Angebote

### Datenbank (Migration)
- Neue Tabelle `supermarkets`: Land (Marktcode wie CH, DE, US), Name, Emoji/Logo, Sortierung.
- Neue Tabelle `market_offers`: Verweis auf Supermarkt, Artikelname, Emoji, Preis, alter Preis, Sortierung.
- Zugriffsregeln: Jeder (auch ohne Anmeldung) kann die Listen **lesen**; **ändern** darf nur, wer im Admin-Bereich die Admin-Rolle hat. In der Migration werden auch die Grundsatz-Zugriffsrechte für die Tabellen vergeben.

### Startbestand (in derselben Migration)
Markt-Listen für alle 14 Länder (USA, Kanada, Deutschland, Österreich, Schweiz, Frankreich, Spanien, Mexiko, Italien, Belgien, Niederlande, UK, Portugal, Brasilien), z. B.:
- Schweiz: Migros, Coop, Denner, Volg, Aldi Suisse, Lidl, Spar
- Deutschland: REWE, EDEKA, ALDI, Lidl, Kaufland, Netto
- USA: Walmart, Kroger, Costco, Target, Trader Joe's, Safeway, Aldi
- Kanada: Loblaws, Sobeys, Metro, Costco, No Frills
- Frankreich: Carrefour, Leclerc, Intermarché, Auchan, Lidl, Monoprix
- Spanien: Mercadona, Carrefour, Lidl, Dia, Alcampo · Italien: Coop, Esselunga, Conad, Lidl, Eurospin
- Mexiko: Bodega Aurrerá, Soriana, Chedraui, Costco · Österreich: Billa, Hofer, Spar, Penny, Lidl
- Belgien: Colruyt, Delhaize, Carrefour, Lidl, Aldi · Niederlande: Albert Heijn, Jumbo, Lidl, Aldi, Plus
- UK: Tesco, Sainsbury's, ASDA, Aldi, Lidl, Morrisons · Portugal: Continente, Pingo Doce, Lidl, Auchan
- Brasilien: Carrefour, Pão de Açúcar, Assaí, Atacadão
(Keine Demo-Angebote als Startbestand — die legst du im Admin selbst an; die alte Demo-Liste fällt weg.)

### App
- **Angebots-Seite** (`angebote.tsx`): liest Märkte + Angebote des aktuellen Landes aus der Datenbank; Länder-Umschalter oben; leere Liste mit Hinweis, solange keine Angebote eingetragen sind. Herz-Favoriten bleiben gerätelokal.
- **Admin-Bereich**: neuer Abschnitt „Märkte & Angebote“ — Kette hinzufügen/umbenennen/löschen, Angebote pro Kette anlegen (Name, Emoji, Preis, alter Preis) und löschen. Sortierung per Pfeil-Buttons.
- **Server-Logik**: öffentliches Lesen ohne Anmeldung; Schreibzugriffe prüfen serverseitig die Admin-Rolle.
- **Übersetzungen**: neue Texte in `src/i18n/de.ts` + `messages.json` (alle 16 Sprachen).

## Prüfung
- Vorschau: Angebots-Seite zeigt Schweizer Märkte (leerer Angebotszustand), Länder-Umschalter funktioniert.
- Admin: Kette + Angebot anlegen, erscheint sofort auf der Angebots-Seite; ohne Admin-Rolle kein Schreiben möglich.
- Teil 1: Abteilungsansicht + Einkaufsliste kontrollieren; Build-Fehlerprotokoll prüfen.
